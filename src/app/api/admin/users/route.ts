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
		const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
		const search = searchParams.get("search") || "";
		const role = searchParams.get("role") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		if (role) {
			where.role = role;
		}

		// Get users and count
		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					email: true,
					image: true,
					role: true,
					emailVerified: true,
					createdAt: true,
					_count: {
						select: {
							businesses: true,
						},
					},
					subscription: {
						select: {
							plan: true,
							status: true,
						},
					},
				},
			}),
			prisma.user.count({ where }),
		]);

		return NextResponse.json({
			users: users.map((user) => ({
				...user,
				businessCount: user._count.businesses,
				_count: undefined,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Admin users list error:", error);
		return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
	}
}
