import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

interface HealthCheck {
	status: "up" | "down";
	latency?: number;
	error?: string;
}

interface HealthResponse {
	status: "healthy" | "degraded" | "unhealthy";
	timestamp: string;
	version: string;
	uptime: number;
	checks: {
		database: HealthCheck;
		redis: HealthCheck;
	};
}

/**
 * GET /api/health
 * Health check endpoint for monitoring services
 * Returns status of all dependent services
 */
export async function GET() {
	const _startTime = Date.now();
	const checks: HealthResponse["checks"] = {
		database: { status: "down" },
		redis: { status: "down" },
	};

	// Check database connectivity
	try {
		const dbStart = Date.now();
		await prisma.$queryRaw`SELECT 1`;
		checks.database = {
			status: "up",
			latency: Date.now() - dbStart,
		};
	} catch (error) {
		checks.database = {
			status: "down",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}

	// Check Redis connectivity
	try {
		const redisStart = Date.now();
		await redis.ping();
		checks.redis = {
			status: "up",
			latency: Date.now() - redisStart,
		};
	} catch (error) {
		checks.redis = {
			status: "down",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}

	// Determine overall status
	const allUp = Object.values(checks).every((check) => check.status === "up");
	const allDown = Object.values(checks).every((check) => check.status === "down");

	let overallStatus: HealthResponse["status"];
	if (allUp) {
		overallStatus = "healthy";
	} else if (allDown) {
		overallStatus = "unhealthy";
	} else {
		overallStatus = "degraded";
	}

	const response: HealthResponse = {
		status: overallStatus,
		timestamp: new Date().toISOString(),
		version: process.env.npm_package_version || "1.0.0",
		uptime: process.uptime(),
		checks,
	};

	// Return appropriate HTTP status
	const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

	return NextResponse.json(response, {
		status: httpStatus,
		headers: {
			"Cache-Control": "no-cache, no-store, must-revalidate",
		},
	});
}

/**
 * HEAD /api/health
 * Lightweight health check (just returns status code)
 */
export async function HEAD() {
	try {
		// Quick database check
		await prisma.$queryRaw`SELECT 1`;
		return new NextResponse(null, { status: 200 });
	} catch {
		return new NextResponse(null, { status: 503 });
	}
}
