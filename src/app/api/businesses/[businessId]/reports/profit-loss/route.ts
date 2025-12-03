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
function getDateRange(period: string): { start: Date; end: Date } {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	let start: Date;
	let end: Date;

	switch (period) {
		case "this-month":
			start = new Date(today.getFullYear(), today.getMonth(), 1);
			end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
			break;
		case "last-month":
			start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
			end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
			break;
		case "this-quarter": {
			const currentQuarter = Math.floor(today.getMonth() / 3);
			start = new Date(today.getFullYear(), currentQuarter * 3, 1);
			end = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
			break;
		}
		case "last-quarter": {
			const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
			const lastQuarterYear = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
			const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
			start = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
			end = new Date(lastQuarterYear, (adjustedLastQuarter + 1) * 3, 0, 23, 59, 59);
			break;
		}
		case "this-year":
			start = new Date(today.getFullYear(), 0, 1);
			end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
			break;
		case "last-year":
			start = new Date(today.getFullYear() - 1, 0, 1);
			end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59);
			break;
		default:
			start = new Date(today.getFullYear(), today.getMonth(), 1);
			end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
	}

	return { start, end };
}

// GET /api/businesses/[businessId]/reports/profit-loss
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
		const { start, end } = getDateRange(period);

		// Get all transactions with categories for the period
		const transactions = await prisma.transaction.findMany({
			where: {
				businessId,
				date: { gte: start, lte: end },
			},
			include: {
				category: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		// Group transactions by category and type
		const incomeByCategory = new Map<string, { name: string; amount: number }>();
		const costOfSalesByCategory = new Map<string, { name: string; amount: number }>();
		const expensesByCategory = new Map<string, { name: string; amount: number }>();

		for (const transaction of transactions) {
			const categoryId = transaction.categoryId || "uncategorized";
			const categoryName = transaction.category?.name || "Uncategorized";
			const amount = Math.abs(Number(transaction.amount));

			if (transaction.type === "INCOME") {
				const existing = incomeByCategory.get(categoryId);
				if (existing) {
					existing.amount += amount;
				} else {
					incomeByCategory.set(categoryId, { name: categoryName, amount });
				}
			} else if (transaction.type === "EXPENSE") {
				// Check if it's a cost of sales category by name convention
				const isCostOfSales =
					categoryName.toLowerCase().includes("cost of sales") ||
					categoryName.toLowerCase().includes("cogs") ||
					categoryName.toLowerCase().includes("direct cost");

				if (isCostOfSales) {
					const existing = costOfSalesByCategory.get(categoryId);
					if (existing) {
						existing.amount += amount;
					} else {
						costOfSalesByCategory.set(categoryId, { name: categoryName, amount });
					}
				} else {
					const existing = expensesByCategory.get(categoryId);
					if (existing) {
						existing.amount += amount;
					} else {
						expensesByCategory.set(categoryId, { name: categoryName, amount });
					}
				}
			}
		}

		// Convert maps to arrays and calculate totals
		const incomeCategories = Array.from(incomeByCategory.entries())
			.map(([categoryId, data]) => ({
				categoryId: categoryId === "uncategorized" ? null : categoryId,
				categoryName: data.name,
				amount: data.amount,
			}))
			.sort((a, b) => b.amount - a.amount);

		const costOfSalesCategories = Array.from(costOfSalesByCategory.entries())
			.map(([categoryId, data]) => ({
				categoryId: categoryId === "uncategorized" ? null : categoryId,
				categoryName: data.name,
				amount: data.amount,
			}))
			.sort((a, b) => b.amount - a.amount);

		const expenseCategories = Array.from(expensesByCategory.entries())
			.map(([categoryId, data]) => ({
				categoryId: categoryId === "uncategorized" ? null : categoryId,
				categoryName: data.name,
				amount: data.amount,
			}))
			.sort((a, b) => b.amount - a.amount);

		const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.amount, 0);
		const totalCostOfSales = costOfSalesCategories.reduce((sum, cat) => sum + cat.amount, 0);
		const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0);

		const grossProfit = totalIncome - totalCostOfSales;
		const netProfit = grossProfit - totalExpenses;

		const grossProfitMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
		const netProfitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

		return NextResponse.json({
			success: true,
			report: {
				income: {
					categories: incomeCategories,
					total: totalIncome,
				},
				costOfSales: {
					categories: costOfSalesCategories,
					total: totalCostOfSales,
				},
				expenses: {
					categories: expenseCategories,
					total: totalExpenses,
				},
				grossProfit,
				netProfit,
				grossProfitMargin,
				netProfitMargin,
			},
			period: {
				start: start.toISOString(),
				end: end.toISOString(),
			},
		});
	} catch (error) {
		console.error("Get profit & loss report error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
