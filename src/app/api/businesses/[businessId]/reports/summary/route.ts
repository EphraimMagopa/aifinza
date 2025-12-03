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

// Get date range based on period
function getDateRange(period: string): {
	start: Date;
	end: Date;
	previousStart: Date;
	previousEnd: Date;
} {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	let start: Date;
	let end: Date;
	let previousStart: Date;
	let previousEnd: Date;

	switch (period) {
		case "this-month":
			start = new Date(today.getFullYear(), today.getMonth(), 1);
			end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
			previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			previousEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
			break;
		case "last-month":
			start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
			previousStart = new Date(today.getFullYear(), today.getMonth() - 2, 1);
			previousEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0, 23, 59, 59);
			break;
		case "this-quarter": {
			const currentQuarter = Math.floor(today.getMonth() / 3);
			start = new Date(today.getFullYear(), currentQuarter * 3, 1);
			end = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
			previousStart = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
			previousEnd = new Date(today.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);
			break;
		}
		case "last-quarter": {
			const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
			const lastQuarterYear = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
			const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
			start = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
			end = new Date(lastQuarterYear, (adjustedLastQuarter + 1) * 3, 0, 23, 59, 59);
			previousStart = new Date(lastQuarterYear, (adjustedLastQuarter - 1) * 3, 1);
			previousEnd = new Date(lastQuarterYear, adjustedLastQuarter * 3, 0, 23, 59, 59);
			break;
		}
		case "this-year":
			start = new Date(today.getFullYear(), 0, 1);
			end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
			previousStart = new Date(today.getFullYear() - 1, 0, 1);
			previousEnd = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
			break;
		case "last-year":
			start = new Date(today.getFullYear() - 1, 0, 1);
			end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
			previousStart = new Date(today.getFullYear() - 2, 0, 1);
			previousEnd = new Date(today.getFullYear() - 2, 11, 31, 23, 59, 59);
			break;
		default:
			start = new Date(today.getFullYear(), today.getMonth(), 1);
			end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
			previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			previousEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
	}

	return { start, end, previousStart, previousEnd };
}

// GET /api/businesses/[businessId]/reports/summary
export async function GET(
	request: Request,
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

		const { searchParams } = new URL(request.url);
		const period = searchParams.get("period") || "this-month";
		const { start, end, previousStart, previousEnd } = getDateRange(period);

		// Get current period transactions
		const [currentTransactions, previousTransactions, invoices, bankAccounts] = await Promise.all([
			prisma.transaction.findMany({
				where: {
					businessId,
					date: { gte: start, lte: end },
				},
				select: {
					amount: true,
					type: true,
				},
			}),
			prisma.transaction.findMany({
				where: {
					businessId,
					date: { gte: previousStart, lte: previousEnd },
				},
				select: {
					amount: true,
					type: true,
				},
			}),
			prisma.invoice.findMany({
				where: {
					businessId,
					issueDate: { gte: start, lte: end },
				},
				select: {
					total: true,
					amountPaid: true,
					status: true,
				},
			}),
			prisma.bankAccount.findMany({
				where: {
					businessId,
					isActive: true,
				},
				select: {
					currentBalance: true,
				},
			}),
		]);

		// Calculate current period totals
		const currentRevenue = currentTransactions
			.filter((t) => t.type === "INCOME")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const currentExpenses = currentTransactions
			.filter((t) => t.type === "EXPENSE")
			.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

		// Calculate previous period totals
		const previousRevenue = previousTransactions
			.filter((t) => t.type === "INCOME")
			.reduce((sum, t) => sum + Number(t.amount), 0);

		const previousExpenses = previousTransactions
			.filter((t) => t.type === "EXPENSE")
			.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

		// Calculate changes
		const revenueChange =
			previousRevenue > 0
				? ((currentRevenue - previousRevenue) / previousRevenue) * 100
				: currentRevenue > 0
					? 100
					: 0;

		const expenseChange =
			previousExpenses > 0
				? ((currentExpenses - previousExpenses) / previousExpenses) * 100
				: currentExpenses > 0
					? 100
					: 0;

		// Calculate profit
		const profit = currentRevenue - currentExpenses;
		const profitMargin = currentRevenue > 0 ? (profit / currentRevenue) * 100 : 0;

		// Calculate invoice totals
		const invoicesPaid = invoices
			.filter((i) => i.status === "PAID")
			.reduce((sum, i) => sum + Number(i.amountPaid), 0);

		const invoicesOutstanding = invoices
			.filter((i) => !["PAID", "CANCELLED", "WRITTEN_OFF"].includes(i.status))
			.reduce((sum, i) => sum + (Number(i.total) - Number(i.amountPaid)), 0);

		// Calculate cash balance
		const cashBalance = bankAccounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

		return NextResponse.json({
			success: true,
			summary: {
				revenue: currentRevenue,
				expenses: currentExpenses,
				profit,
				profitMargin,
				invoicesPaid,
				invoicesOutstanding,
				cashBalance,
				revenueChange,
				expenseChange,
			},
			period: {
				start: start.toISOString(),
				end: end.toISOString(),
			},
		});
	} catch (error) {
		console.error("Get report summary error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
