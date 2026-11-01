import type { Request, Response, NextFunction } from 'express';
import { sanitizeTextInput } from '../utils/planningLogic';

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 120;
export const CACHE_TTL_MS = 5 * 60_000;
export const MAX_CACHE_ENTRIES = 100;

interface RateBucket {
  count: number;
  resetAt: number;
}

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const rateLimitStore = new Map<string, RateBucket>();
const aiResponseCache = new Map<string, CacheEntry>();

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes incoming JSON objects to prevent XSS and prototype pollution.
 */
export function sanitizePayloadObject<T>(input: T, maxStringLength = 600): T {
  if (typeof input === 'string') {
    return sanitizeTextInput(input, maxStringLength) as unknown as T;
  }
  if (Array.isArray(input)) {
    return input.slice(0, 100).map((item) => sanitizePayloadObject(item, maxStringLength)) as unknown as T;
  }
  if (input !== null && typeof input === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) {
        continue;
      }
      clean[key] = sanitizePayloadObject(value, maxStringLength);
    }
    return clean as T;
  }
  return input;
}

/**
 * Retrieves a valid cached response or returns null if expired/missing.
 */
export function getCachedAiResponse<T>(key: string): T | null {
  const entry = aiResponseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiResponseCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Stores a response in the bounded LRU cache.
 */
export function setCachedAiResponse(key: string, data: unknown): void {
  if (aiResponseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = aiResponseCache.keys().next().value;
    if (oldestKey) {
      aiResponseCache.delete(oldestKey);
    }
  }
  aiResponseCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Express middleware that attaches defense-in-depth HTTP security headers
 * (compatible with cross-origin preview iframes) and sliding-window rate limiting.
 */
export function securityAndRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'"
  );

  if (req.path.startsWith('/api/')) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'local';
    const now = Date.now();
    const bucket = rateLimitStore.get(clientIp);

    if (!bucket || now > bucket.resetAt) {
      rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
      res.setHeader('X-RateLimit-Remaining', String(RATE_LIMIT_MAX_REQUESTS - 1));
    } else {
      bucket.count += 1;
      const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - bucket.count);
      res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
        res.status(429).json({ error: 'Too many requests. Please retry in a moment.' });
        return;
      }
    }
  }

  next();
}
