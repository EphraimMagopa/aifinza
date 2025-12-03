import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	try {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

		// Get all stats in parallel
		const [
			totalUsers,
			usersThisMonth,
			usersLastMonth,
			totalBusinesses,
			businessesThisMonth,
			totalSubscriptions,
			subscriptionsByPlan,
			subscriptionsByStatus,
			recentUsers,
			recentBusinesses,
		] = await Promise.all([
			// Total users
			prisma.user.count(),

			// Users created this month
			prisma.user.count({
				where: { createdAt: { gte: startOfMonth } },
			}),

			// Users created last month
			prisma.user.count({
				where: {
					createdAt: {
						gte: startOfLastMonth,
						lt: startOfMonth,
					},
				},
			}),

			// Total businesses
			prisma.business.count(),

			// Businesses created this month
			prisma.business.count({
				where: { createdAt: { gte: startOfMonth } },
			}),

			// Total subscriptions
			prisma.subscription.count(),

			// Subscriptions by plan
			prisma.subscription.groupBy({
				by: ["plan"],
				_count: { plan: true },
			}),

			// Subscriptions by status
			prisma.subscription.groupBy({
				by: ["status"],
				_count: { status: true },
			}),

			// Recent users
			prisma.user.findMany({
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					createdAt: true,
				},
			}),

			// Recent businesses
			prisma.business.findMany({
				take: 5,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					businessType: true,
					createdAt: true,
				},
			}),
		]);

		// Calculate MRR based on subscription plans
		const planPrices: Record<string, number> = {
			FREE: 0,
			STARTER: 199,
			PROFESSIONAL: 499,
			ENTERPRISE: 999,
		};

		let mrr = 0;
		for (const plan of subscriptionsByPlan) {
			const price = planPrices[plan.plan] || 0;
			mrr += price * plan._count.plan;
		}

		// Format response
		const planStats = subscriptionsByPlan.reduce(
			(acc, p) => {
				acc[p.plan] = p._count.plan;
				return acc;
			},
			{} as Record<string, number>
		);

		const statusStats = subscriptionsByStatus.reduce(
			(acc, s) => {
				acc[s.status] = s._count.status;
				return acc;
			},
			{} as Record<string, number>
		);

		return NextResponse.json({
			users: {
				total: totalUsers,
				thisMonth: usersThisMonth,
				lastMonth: usersLastMonth,
				growth: usersLastMonth > 0 ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100 : 0,
			},
			businesses: {
				total: totalBusinesses,
				thisMonth: businessesThisMonth,
			},
			subscriptions: {
				total: totalSubscriptions,
				byPlan: planStats,
				byStatus: statusStats,
				mrr,
				arr: mrr * 12,
			},
			recent: {
				users: recentUsers,
				businesses: recentBusinesses,
			},
		});
	} catch (error) {
		console.error("Admin stats error:", error);
		return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
	}
}
