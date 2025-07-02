import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const noteId = params.id;
    if (!noteId) {
      return new Response(
        JSON.stringify({ error: 'Note ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { title, content, tags } = await request.json();

    if (!title || !content || typeof title !== 'string' || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(tags)) {
      return new Response(
        JSON.stringify({ error: 'Tags must be an array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify note exists and belongs to the user
    const existingNote = await database.execute({
      sql: 'SELECT id, userId FROM notes WHERE id = ?',
      args: [noteId]
    });

    if (existingNote.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Note not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingNote.rows[0].userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied: You can only edit your own notes' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update note
    await database.execute({
      sql: `UPDATE notes 
            SET title = ?, content = ?, tags = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?`,
      args: [title.trim(), content.trim(), JSON.stringify(tags), noteId]
    });

    // Fetch updated note
    const updatedNote = await database.execute({
      sql: 'SELECT id, title, content, tags, createdAt, updatedAt FROM notes WHERE id = ?',
      args: [noteId]
    });

    const note = updatedNote.rows[0];
    
    return new Response(
      JSON.stringify({
        success: true,
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          tags: JSON.parse(note.tags as string || '[]'),
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const noteId = params.id;
    if (!noteId) {
      return new Response(
        JSON.stringify({ error: 'Note ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify note exists and belongs to the user
    const existingNote = await database.execute({
      sql: 'SELECT id, userId FROM notes WHERE id = ?',
      args: [noteId]
    });

    if (existingNote.rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Note not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingNote.rows[0].userId !== session.user.id) {
      return new Response(
        JSON.stringify({ error: 'Access denied: You can only delete your own notes' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete note
    await database.execute({
      sql: 'DELETE FROM notes WHERE id = ?',
      args: [noteId]
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Note deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};