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

// GET /api/businesses/[businessId]/reports/vat
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

		// Get invoices for output VAT (sales)
		const invoices = await prisma.invoice.findMany({
			where: {
				businessId,
				issueDate: { gte: start, lte: end },
				status: { notIn: ["DRAFT", "CANCELLED"] },
			},
			include: {
				lineItems: true,
			},
		});

		// Get transactions for input VAT (purchases)
		const expenseTransactions = await prisma.transaction.findMany({
			where: {
				businessId,
				date: { gte: start, lte: end },
				type: "EXPENSE",
			},
			include: {
				category: true,
			},
		});

		// Calculate output VAT from invoices
		let outputStandardSales = 0;
		let outputStandardVat = 0;
		let outputZeroSales = 0;

		for (const invoice of invoices) {
			for (const lineItem of invoice.lineItems) {
				const lineTotal = Number(lineItem.lineTotal);
				const vatRate = Number(lineItem.vatRate);
				const vatAmount = Number(lineItem.vatAmount);

				if (vatRate === 15) {
					outputStandardSales += lineTotal;
					outputStandardVat += vatAmount;
				} else if (vatRate === 0) {
					outputZeroSales += lineTotal;
				}
			}
		}

		// Calculate input VAT from expense transactions
		// Note: In a real system, you'd track VAT on individual purchases
		// This is a simplified calculation assuming 15% VAT on expenses
		let inputStandardPurchases = 0;
		let inputStandardVat = 0;
		const inputZeroPurchases = 0;
		let inputCapitalPurchases = 0;
		let inputCapitalVat = 0;

		for (const transaction of expenseTransactions) {
			const amount = Math.abs(Number(transaction.amount));
			const categoryName = transaction.category?.name || "";

			// Check if it's a capital expense by name convention
			const isCapital =
				categoryName.toLowerCase().includes("capital") ||
				categoryName.toLowerCase().includes("asset") ||
				categoryName.toLowerCase().includes("equipment") ||
				categoryName.toLowerCase().includes("vehicle");

			// Assume standard rate VAT on most expenses
			// In production, this would come from actual invoice data
			const vatInclusive = amount;
			const vatExclusive = vatInclusive / 1.15;
			const vatAmount = vatInclusive - vatExclusive;

			if (isCapital) {
				inputCapitalPurchases += vatExclusive;
				inputCapitalVat += vatAmount;
			} else {
				inputStandardPurchases += vatExclusive;
				inputStandardVat += vatAmount;
			}
		}

		const totalOutputVat = outputStandardVat;
		const totalInputVat = inputStandardVat + inputCapitalVat;
		const netVAT = totalOutputVat - totalInputVat;

		return NextResponse.json({
			success: true,
			report: {
				outputVAT: {
					standardRated: {
						sales: outputStandardSales,
						vat: outputStandardVat,
					},
					zeroRated: {
						sales: outputZeroSales,
						vat: 0,
					},
					exempt: {
						sales: 0,
						vat: 0,
					},
					total: {
						sales: outputStandardSales + outputZeroSales,
						vat: totalOutputVat,
					},
				},
				inputVAT: {
					standardRated: {
						purchases: inputStandardPurchases,
						vat: inputStandardVat,
					},
					zeroRated: {
						purchases: inputZeroPurchases,
						vat: 0,
					},
					capital: {
						purchases: inputCapitalPurchases,
						vat: inputCapitalVat,
					},
					total: {
						purchases: inputStandardPurchases + inputZeroPurchases + inputCapitalPurchases,
						vat: totalInputVat,
					},
				},
				netVAT,
				isPayable: netVAT > 0,
			},
			period: {
				start: start.toISOString(),
				end: end.toISOString(),
			},
		});
	} catch (error) {
		console.error("Get VAT report error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
