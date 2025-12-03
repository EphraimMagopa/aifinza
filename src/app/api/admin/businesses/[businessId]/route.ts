import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

interface RouteContext {
	params: Promise<{ businessId: string }>;
}

// GET /api/admin/businesses/[businessId] - Get business details
export async function GET(_request: Request, context: RouteContext) {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	try {
		const { businessId } = await context.params;

		const business = await prisma.business.findUnique({
			where: { id: businessId },
			include: {
				users: {
					select: {
						id: true,
						role: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								role: true,
							},
						},
					},
				},
				bankAccounts: {
					select: {
						id: true,
						name: true,
						bankName: true,
						accountType: true,
						isActive: true,
					},
				},
				_count: {
					select: {
						transactions: true,
						invoices: true,
						quotes: true,
						customers: true,
						suppliers: true,
						employees: true,
					},
				},
			},
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		return NextResponse.json({
			business: {
				...business,
				stats: business._count,
				_count: undefined,
			},
		});
	} catch (error) {
		console.error("Admin get business error:", error);
		return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 });
	}
}
