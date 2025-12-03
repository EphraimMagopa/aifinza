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
		const businessType = searchParams.get("businessType") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ tradingName: { contains: search, mode: "insensitive" } },
				{ registrationNumber: { contains: search, mode: "insensitive" } },
			];
		}

		if (businessType) {
			where.businessType = businessType;
		}

		// Get businesses and count
		const [businesses, total] = await Promise.all([
			prisma.business.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					tradingName: true,
					businessType: true,
					isVatRegistered: true,
					email: true,
					createdAt: true,
					_count: {
						select: {
							users: true,
							transactions: true,
							invoices: true,
						},
					},
				},
			}),
			prisma.business.count({ where }),
		]);

		return NextResponse.json({
			businesses: businesses.map((biz) => ({
				...biz,
				userCount: biz._count.users,
				transactionCount: biz._count.transactions,
				invoiceCount: biz._count.invoices,
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
		console.error("Admin businesses list error:", error);
		return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
	}
}
