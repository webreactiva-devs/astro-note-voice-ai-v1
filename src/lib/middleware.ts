import { auth } from '@/lib/auth';

export interface AuthenticatedUser {
  id: string;
  name?: string;
  email: string;
}

export interface AuthenticatedRequest {
  user: AuthenticatedUser;
  headers: Headers;
}

/**
 * Middleware to authenticate API requests
 * Returns user if authenticated, throws error if not
 */
export async function authenticateRequest(request: Request): Promise<AuthenticatedUser> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      throw new Error('Unauthorized');
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
}

/**
 * Helper to create authenticated API response for unauthorized requests
 */
export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Helper to create server error response
 */
export function createServerErrorResponse(message: string = 'Internal server error') {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Helper to create bad request response
 */
export function createBadRequestResponse(message: string) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Helper to create rate limit response
 */
export function createRateLimitResponse(message: string = 'Too many requests') {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 429, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}