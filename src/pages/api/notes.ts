import type { APIRoute } from 'astro';
import { authenticateRequest, createUnauthorizedResponse, createBadRequestResponse, createServerErrorResponse } from '@/lib/middleware';
import { validateNoteContent, sanitizeContent } from '@/lib/validation';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { database } from '@/lib/database';
import { organizeIdeas, generateTitleAndTags } from '@/lib/ai-service';

// Utility function to generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


export const POST: APIRoute = async ({ request }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, 'notes', RATE_LIMITS.notes);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before creating more notes.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          } 
        }
      );
    }

    const { content, isTranscription = false } = await request.json();

    // Validate content
    const validation = validateNoteContent(content);
    if (!validation.isValid) {
      return createBadRequestResponse(validation.error!);
    }

    // Process content based on whether it's a transcription or direct text
    let processedContent = sanitizeContent(content);
    
    // If it's a transcription, organize the ideas first
    if (isTranscription) {
      console.log('Organizing transcription ideas...');
      processedContent = await organizeIdeas(processedContent);
    }

    // Generate title and tags from the processed content
    console.log('Generating title and tags...');
    const { title, tags } = await generateTitleAndTags(processedContent);

    // Generate unique ID
    const noteId = generateId();

    // Save note to database
    await database.execute({
      sql: `INSERT INTO notes (id, userId, title, content, tags, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [noteId, user.id, title, processedContent, JSON.stringify(tags)]
    });

    return new Response(
      JSON.stringify({
        success: true,
        note: {
          id: noteId,
          title,
          content: processedContent,
          tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }),
      { 
        status: 201, 
        headers: { 
          'Content-Type': 'application/json',
          ...rateLimitResult.headers
        } 
      }
    );

  } catch (error) {
    console.error('Error in POST /api/notes:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedResponse();
    }
    
    return createServerErrorResponse('Internal server error');
  }
};

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, 'notes', RATE_LIMITS.notes);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before fetching notes.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          } 
        }
      );
    }

    // Get query parameters for filtering
    const searchParams = url.searchParams;
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query with filters
    let sql = `SELECT id, title, content, tags, createdAt, updatedAt 
               FROM notes 
               WHERE userId = ?`;
    const args: any[] = [user.id];

    // Add search filter
    if (search) {
      sql += ` AND (title LIKE ? OR content LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`);
    }

    // Add tag filter
    if (tag) {
      sql += ` AND tags LIKE ?`;
      args.push(`%"${tag}"%`);
    }

    // Add date filters
    if (startDate) {
      sql += ` AND createdAt >= ?`;
      args.push(startDate);
    }

    if (endDate) {
      sql += ` AND createdAt <= ?`;
      args.push(endDate + ' 23:59:59');
    }

    // Add ordering and pagination
    sql += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await database.execute({ sql, args });

    // Parse tags from JSON strings
    const notes = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags as string || '[]'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM notes WHERE userId = ?`;
    const countArgs: any[] = [user.id];

    if (search) {
      countSql += ` AND (title LIKE ? OR content LIKE ?)`;
      countArgs.push(`%${search}%`, `%${search}%`);
    }

    if (tag) {
      countSql += ` AND tags LIKE ?`;
      countArgs.push(`%"${tag}"%`);
    }

    if (startDate) {
      countSql += ` AND createdAt >= ?`;
      countArgs.push(startDate);
    }

    if (endDate) {
      countSql += ` AND createdAt <= ?`;
      countArgs.push(endDate + ' 23:59:59');
    }

    const countResult = await database.execute({ sql: countSql, args: countArgs });
    const total = Number(countResult.rows[0]?.total || 0);

    return new Response(
      JSON.stringify({
        success: true,
        notes,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...rateLimitResult.headers
        } 
      }
    );

  } catch (error) {
    console.error('Error in GET /api/notes:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedResponse();
    }
    
    return createServerErrorResponse('Internal server error');
  }
};