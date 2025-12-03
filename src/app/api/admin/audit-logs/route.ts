import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	try {
		const { searchParams } = new URL(request.url);
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
		const action = searchParams.get("action") || "";
		const entityType = searchParams.get("entityType") || "";
		const userId = searchParams.get("userId") || "";
		const businessId = searchParams.get("businessId") || "";
		const startDate = searchParams.get("startDate") || "";
		const endDate = searchParams.get("endDate") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};

		if (action) {
			where.action = action;
		}

		if (entityType) {
			where.entityType = entityType;
		}

		if (userId) {
			where.userId = userId;
		}

		if (businessId) {
			where.businessId = businessId;
		}

		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) {
				(where.createdAt as Record<string, Date>).gte = new Date(startDate);
			}
			if (endDate) {
				(where.createdAt as Record<string, Date>).lte = new Date(endDate);
			}
		}

		// Get audit logs with pagination
		const [logs, total, actionCounts, entityCounts] = await Promise.all([
			prisma.auditLog.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
			}),
			prisma.auditLog.count({ where }),
			// Get action distribution
			prisma.auditLog.groupBy({
				by: ["action"],
				_count: { action: true },
			}),
			// Get entity type distribution
			prisma.auditLog.groupBy({
				by: ["entityType"],
				_count: { entityType: true },
			}),
		]);

		// Fetch user details for the logs
		const userIds = [...new Set(logs.map((log) => log.userId))];
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, name: true, email: true },
		});

		const userMap = new Map(users.map((u) => [u.id, u]));

		// Enrich logs with user info
		const enrichedLogs = logs.map((log) => ({
			...log,
			user: userMap.get(log.userId) || { id: log.userId, name: null, email: "Unknown" },
		}));

		return NextResponse.json({
			logs: enrichedLogs,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
			stats: {
				byAction: actionCounts.reduce(
					(acc, a) => {
						acc[a.action] = a._count.action;
						return acc;
					},
					{} as Record<string, number>
				),
				byEntityType: entityCounts.reduce(
					(acc, e) => {
						acc[e.entityType] = e._count.entityType;
						return acc;
					},
					{} as Record<string, number>
				),
			},
		});
	} catch (error) {
		console.error("Admin audit logs error:", error);
		return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
	}
}
