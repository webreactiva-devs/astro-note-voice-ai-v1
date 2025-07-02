import type { APIRoute } from 'astro';
import { auth } from '@/lib/auth';
import { database } from '@/lib/database';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get note count for the user
    const result = await database.execute({
      sql: 'SELECT COUNT(*) as count FROM notes WHERE userId = ?',
      args: [session.user.id]
    });

    const count = Number(result.rows[0]?.count || 0);

    return new Response(
      JSON.stringify({ count, hasNotes: count > 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in GET /api/notes/count:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};