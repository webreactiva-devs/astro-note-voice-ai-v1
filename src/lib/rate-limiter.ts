/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a proper rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Transcription API - more restrictive due to cost
  transcription: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5 // 5 transcriptions per minute
  },
  // Notes API - moderate restriction
  notes: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  },
  // General API - lenient
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }
} as const;

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string, 
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry if doesn't exist or window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  // Check if within limit
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count and update store
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Create rate limit identifier from user ID and endpoint
 */
export function createRateLimitKey(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number, 
  resetTime: number, 
  maxRequests: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString()
  };
}

/**
 * Middleware to apply rate limiting to API endpoints
 */
export function withRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig
): { allowed: boolean; headers: Record<string, string> } {
  const key = createRateLimitKey(userId, endpoint);
  const result = checkRateLimit(key, config);
  
  const headers = getRateLimitHeaders(
    result.remaining,
    result.resetTime,
    config.maxRequests
  );
  
  return {
    allowed: result.allowed,
    headers
  };
}