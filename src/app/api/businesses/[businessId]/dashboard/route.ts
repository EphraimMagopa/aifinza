import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check if user has access to business
async function checkBusinessAccess(userId: string, businessId: string) {
	const membership = await prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});

	return membership;
}

// GET /api/businesses/[businessId]/dashboard - Get dashboard stats
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Get date ranges
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
		const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

		// Fetch all stats in parallel
		const [
			totalBalance,
			incomeThisMonth,
			expensesThisMonth,
			incomeLastMonth,
			expensesLastMonth,
			recentTransactions,
			invoiceStats,
			accountsCount,
			customersCount,
		] = await Promise.all([
			// Total bank balance
			prisma.bankAccount.aggregate({
				where: { businessId, isActive: true },
				_sum: { currentBalance: true },
			}),

			// Income this month
			prisma.transaction.aggregate({
				where: {
					businessId,
					type: "INCOME",
					date: { gte: startOfMonth },
				},
				_sum: { amount: true },
			}),

			// Expenses this month
			prisma.transaction.aggregate({
				where: {
					businessId,
					type: "EXPENSE",
					date: { gte: startOfMonth },
				},
				_sum: { amount: true },
			}),

			// Income last month
			prisma.transaction.aggregate({
				where: {
					businessId,
					type: "INCOME",
					date: { gte: startOfLastMonth, lte: endOfLastMonth },
				},
				_sum: { amount: true },
			}),

			// Expenses last month
			prisma.transaction.aggregate({
				where: {
					businessId,
					type: "EXPENSE",
					date: { gte: startOfLastMonth, lte: endOfLastMonth },
				},
				_sum: { amount: true },
			}),

			// Recent transactions
			prisma.transaction.findMany({
				where: { businessId },
				orderBy: { date: "desc" },
				take: 5,
				include: {
					category: {
						select: { name: true, color: true },
					},
				},
			}),

			// Invoice stats
			prisma.invoice.groupBy({
				by: ["status"],
				where: { businessId },
				_sum: { total: true },
				_count: true,
			}),

			// Bank accounts count
			prisma.bankAccount.count({
				where: { businessId, isActive: true },
			}),

			// Customers count
			prisma.customer.count({
				where: { businessId, isActive: true },
			}),
		]);

		// Calculate trends (percentage change from last month)
		const incomeThisMonthAmount = Number(incomeThisMonth._sum.amount || 0);
		const expensesThisMonthAmount = Number(expensesThisMonth._sum.amount || 0);
		const incomeLastMonthAmount = Number(incomeLastMonth._sum.amount || 0);
		const expensesLastMonthAmount = Number(expensesLastMonth._sum.amount || 0);

		const incomeTrend =
			incomeLastMonthAmount > 0
				? Math.round(
						((incomeThisMonthAmount - incomeLastMonthAmount) / incomeLastMonthAmount) * 100
					)
				: 0;

		const expensesTrend =
			expensesLastMonthAmount > 0
				? Math.round(
						((expensesThisMonthAmount - expensesLastMonthAmount) / expensesLastMonthAmount) * 100
					)
				: 0;

		// Calculate outstanding invoices
		const unpaidStatuses = ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"];
		const outstandingInvoices = invoiceStats
			.filter((s) => unpaidStatuses.includes(s.status))
			.reduce((sum, s) => sum + Number(s._sum.total || 0), 0);

		const unpaidInvoicesCount = invoiceStats
			.filter((s) => unpaidStatuses.includes(s.status))
			.reduce((sum, s) => sum + s._count, 0);

		return NextResponse.json({
			success: true,
			stats: {
				totalBalance: Number(totalBalance._sum.currentBalance || 0),
				incomeThisMonth: incomeThisMonthAmount,
				expensesThisMonth: expensesThisMonthAmount,
				incomeTrend,
				expensesTrend,
				outstandingInvoices,
				unpaidInvoicesCount,
				accountsCount,
				customersCount,
			},
			recentTransactions: recentTransactions.map((t) => ({
				id: t.id,
				description: t.description,
				amount: Number(t.amount),
				type: t.type,
				date: t.date.toISOString(),
				category: t.category,
			})),
		});
	} catch (error) {
		console.error("Get dashboard stats error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
