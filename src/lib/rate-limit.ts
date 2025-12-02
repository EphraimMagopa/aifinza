import { NextResponse } from "next/server";

import { redis } from "./redis";

export interface RateLimitConfig {
	// Maximum number of requests allowed within the window
	limit: number;
	// Time window in seconds
	window: number;
	// Identifier for the rate limit (e.g., "api", "auth")
	identifier?: string;
}

export interface RateLimitResult {
	success: boolean;
	limit: number;
	remaining: number;
	reset: number;
}

// Default rate limit configuration
const defaultConfig: RateLimitConfig = {
	limit: Number.parseInt(process.env.RATE_LIMIT_REQUESTS || "100", 10),
	window: Number.parseInt(process.env.RATE_LIMIT_WINDOW || "60", 10),
};

/**
 * Check if a request is rate limited using sliding window algorithm
 */
export async function rateLimit(
	key: string,
	config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
	const { limit, window, identifier } = { ...defaultConfig, ...config };
	const now = Date.now();
	const windowStart = now - window * 1000;
	const redisKey = identifier ? `rate_limit:${identifier}:${key}` : `rate_limit:${key}`;

	try {
		// Use Redis transaction for atomic operations
		const pipeline = redis.pipeline();

		// Remove old entries outside the window
		pipeline.zremrangebyscore(redisKey, 0, windowStart);

		// Add current request
		pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random()}`);

		// Count requests in current window
		pipeline.zcount(redisKey, windowStart, now);

		// Set TTL to clean up old keys
		pipeline.expire(redisKey, window);

		const results = await pipeline.exec();

		// Get the count from the third command result
		const count = (results?.[2]?.[1] as number) || 0;
		const remaining = Math.max(0, limit - count);
		const reset = Math.ceil((now + window * 1000) / 1000);

		return {
			success: count <= limit,
			limit,
			remaining,
			reset,
		};
	} catch (error) {
		console.error("Rate limit error:", error);
		// On Redis error, allow the request but log it
		return {
			success: true,
			limit,
			remaining: limit,
			reset: Math.ceil((now + window * 1000) / 1000),
		};
	}
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
	return {
		"X-RateLimit-Limit": result.limit.toString(),
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": result.reset.toString(),
	};
}

/**
 * Rate limit response for when limit is exceeded
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
	return NextResponse.json(
		{
			error: "Too many requests",
			message: "Rate limit exceeded. Please try again later.",
			retryAfter: result.reset - Math.ceil(Date.now() / 1000),
		},
		{
			status: 429,
			headers: {
				...rateLimitHeaders(result),
				"Retry-After": (result.reset - Math.ceil(Date.now() / 1000)).toString(),
			},
		}
	);
}

/**
 * Get identifier from request for rate limiting
 * Uses IP address or user ID if authenticated
 */
export function getRateLimitKey(request: Request, userId?: string): string {
	if (userId) {
		return `user:${userId}`;
	}

	// Try to get IP from various headers
	const forwarded = request.headers.get("x-forwarded-for");
	const realIp = request.headers.get("x-real-ip");

	if (forwarded) {
		return `ip:${forwarded.split(",")[0].trim()}`;
	}

	if (realIp) {
		return `ip:${realIp}`;
	}

	// Fallback to a generic key
	return "ip:unknown";
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
	// Standard API rate limit
	api: (key: string) => rateLimit(key, { identifier: "api", limit: 100, window: 60 }),

	// Strict rate limit for auth endpoints
	auth: (key: string) => rateLimit(key, { identifier: "auth", limit: 10, window: 60 }),

	// Very strict rate limit for password reset/forgot password
	passwordReset: (key: string) =>
		rateLimit(key, { identifier: "password_reset", limit: 3, window: 300 }),

	// Rate limit for AI endpoints (more expensive)
	ai: (key: string) => rateLimit(key, { identifier: "ai", limit: 20, window: 60 }),

	// Rate limit for file uploads
	upload: (key: string) => rateLimit(key, { identifier: "upload", limit: 10, window: 60 }),
};
