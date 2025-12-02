import { type NextRequest, NextResponse } from "next/server";

import { auth } from "./auth";
import {
	getRateLimitKey,
	rateLimit,
	rateLimitExceededResponse,
	rateLimitHeaders,
} from "./rate-limit";

export interface ApiContext {
	userId?: string;
	request: NextRequest;
}

/**
 * Wrapper for API route handlers with common functionality
 * - Rate limiting
 * - Error handling
 * - Response formatting
 */
export function withApiMiddleware(
	handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>,
	options: {
		rateLimit?: {
			limit: number;
			window: number;
			identifier?: string;
		};
		requireAuth?: boolean;
	} = {}
) {
	return async (request: NextRequest): Promise<NextResponse> => {
		try {
			const context: ApiContext = { request };

			// Check authentication if required
			if (options.requireAuth) {
				const session = await auth();
				if (!session?.user?.id) {
					return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
				}
				context.userId = session.user.id;
			}

			// Apply rate limiting
			if (options.rateLimit) {
				const key = getRateLimitKey(request, context.userId);
				const result = await rateLimit(key, options.rateLimit);

				if (!result.success) {
					return rateLimitExceededResponse(result);
				}

				// Continue with the request and add rate limit headers to response
				const response = await handler(request, context);

				// Add rate limit headers to successful response
				const headers = new Headers(response.headers);
				for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
					headers.set(key, value);
				}

				return new NextResponse(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers,
				});
			}

			// No rate limiting, just call handler
			return await handler(request, context);
		} catch (error) {
			console.error("API error:", error);

			if (error instanceof z.ZodError) {
				return NextResponse.json(
					{
						error: "Validation failed",
						details: error.flatten().fieldErrors,
					},
					{ status: 400 }
				);
			}

			return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
		}
	};
}

// Import z for ZodError type check
import { z } from "zod";

/**
 * Standard API response helper
 */
export function apiResponse<T>(
	data: T,
	options: { status?: number; headers?: Record<string, string> } = {}
) {
	return NextResponse.json(data, {
		status: options.status || 200,
		headers: options.headers,
	});
}

/**
 * Error response helper
 */
export function apiError(
	message: string,
	options: { status?: number; details?: Record<string, unknown> } = {}
) {
	return NextResponse.json(
		{
			error: message,
			...(options.details && { details: options.details }),
		},
		{ status: options.status || 500 }
	);
}

/**
 * Parse and validate request body with Zod schema
 */
export async function parseBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
	const body = await request.json();
	return schema.parse(body);
}

/**
 * Parse URL search params into an object
 */
export function parseSearchParams(request: Request): Record<string, string> {
	const url = new URL(request.url);
	const params: Record<string, string> = {};

	url.searchParams.forEach((value, key) => {
		params[key] = value;
	});

	return params;
}

/**
 * Get pagination params from request
 */
export function getPaginationParams(request: Request): {
	page: number;
	limit: number;
	skip: number;
} {
	const params = parseSearchParams(request);
	const page = Math.max(1, Number.parseInt(params.page || "1", 10));
	const limit = Math.min(100, Math.max(1, Number.parseInt(params.limit || "20", 10)));
	const skip = (page - 1) * limit;

	return { page, limit, skip };
}
