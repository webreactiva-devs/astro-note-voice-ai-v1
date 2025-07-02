import type { APIRoute } from 'astro';
import { authenticateRequest, createUnauthorizedResponse, createServerErrorResponse } from '@/lib/middleware';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { database } from '@/lib/database';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Authenticate request
    const user = await authenticateRequest(request);
    
    // Apply rate limiting
    const rateLimitResult = withRateLimit(user.id, 'notes', RATE_LIMITS.general);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait before checking note count.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            ...rateLimitResult.headers
          } 
        }
      );
    }

    // Get note count for the user
    const result = await database.execute({
      sql: 'SELECT COUNT(*) as count FROM notes WHERE userId = ?',
      args: [user.id]
    });

    const count = Number(result.rows[0]?.count || 0);

    return new Response(
      JSON.stringify({ count, hasNotes: count > 0 }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...rateLimitResult.headers
        } 
      }
    );

  } catch (error) {
    console.error('Error in GET /api/notes/count:', error);
    
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedResponse();
    }
    
    return createServerErrorResponse('Internal server error');
  }
};