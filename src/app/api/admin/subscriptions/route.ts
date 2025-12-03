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
		const planFilter = searchParams.get("plan") || "";
		const statusFilter = searchParams.get("status") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: Record<string, unknown> = {};

		if (planFilter) {
			where.plan = planFilter;
		}

		if (statusFilter) {
			where.status = statusFilter;
		}

		// Get subscriptions and stats
		const [subscriptions, total, stats] = await Promise.all([
			prisma.subscription.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					plan: true,
					status: true,
					stripeCustomerId: true,
					stripeSubscriptionId: true,
					stripePriceId: true,
					stripeCurrentPeriodEnd: true,
					createdAt: true,
					updatedAt: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			}),
			prisma.subscription.count({ where }),
			// Get aggregated stats
			Promise.all([
				prisma.subscription.groupBy({
					by: ["plan"],
					_count: { plan: true },
				}),
				prisma.subscription.groupBy({
					by: ["status"],
					_count: { status: true },
				}),
			]),
		]);

		const [byPlan, byStatus] = stats;

		// Calculate MRR
		const planPrices: Record<string, number> = {
			FREE: 0,
			STARTER: 199,
			PROFESSIONAL: 499,
			ENTERPRISE: 999,
		};

		let mrr = 0;
		for (const plan of byPlan) {
			const price = planPrices[plan.plan] || 0;
			// Only count active subscriptions for MRR
			const activeCount = await prisma.subscription.count({
				where: { plan: plan.plan, status: "ACTIVE" },
			});
			mrr += price * activeCount;
		}

		return NextResponse.json({
			subscriptions,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
			stats: {
				byPlan: byPlan.reduce(
					(acc, p) => {
						acc[p.plan] = p._count.plan;
						return acc;
					},
					{} as Record<string, number>
				),
				byStatus: byStatus.reduce(
					(acc, s) => {
						acc[s.status] = s._count.status;
						return acc;
					},
					{} as Record<string, number>
				),
				mrr,
				arr: mrr * 12,
			},
		});
	} catch (error) {
		console.error("Admin subscriptions error:", error);
		return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
	}
}
