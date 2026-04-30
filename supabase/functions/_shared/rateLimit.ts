// Simple in-memory rate limiter for Supabase Edge Functions.
// NOTE: Deno Deploy may spin down and clear this memory.
// For production-scale rate limiting, use Upstash Redis or Supabase KV.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.maxRequests - 1, resetAt };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
}

// Enrichment-specific limits: 5 enrichments per user per minute
export function checkEnrichmentRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(`enrich:${userId}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
}

// Campaign send limits: 1 campaign send per user per minute
export function checkCampaignRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  return checkRateLimit(`campaign:${userId}`, {
    windowMs: 60_000,
    maxRequests: 1,
  });
}
