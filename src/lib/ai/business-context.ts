import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BusinessContextOptions {
	businessId: string;
	includeTransactions?: boolean;
	includeInvoices?: boolean;
	includeBankAccounts?: boolean;
	includeTaxPeriods?: boolean;
}

/**
 * Fetch and format business data for AI context
 */
export async function getBusinessContext(options: BusinessContextOptions): Promise<string> {
	const {
		businessId,
		includeTransactions = true,
		includeInvoices = true,
		includeBankAccounts = true,
		includeTaxPeriods = true,
	} = options;

	const business = await prisma.business.findUnique({
		where: { id: businessId },
		select: {
			name: true,
			tradingName: true,
			businessType: true,
			registrationNumber: true,
			isVatRegistered: true,
			vatNumber: true,
			vatCycle: true,
			financialYearEnd: true,
		},
	});

	if (!business) {
		return "Business not found.";
	}

	const lines: string[] = [];

	// Business info
	lines.push(`Business: ${business.tradingName || business.name}`);
	if (business.businessType) lines.push(`Type: ${formatBusinessType(business.businessType)}`);
	if (business.registrationNumber) lines.push(`Registration: ${business.registrationNumber}`);
	lines.push(`VAT Registered: ${business.isVatRegistered ? "Yes" : "No"}`);
	if (business.isVatRegistered && business.vatNumber) {
		lines.push(`VAT Number: ${business.vatNumber}`);
		if (business.vatCycle) lines.push(`VAT Cycle: ${formatVatCycle(business.vatCycle)}`);
	}
	if (business.financialYearEnd) {
		lines.push(`Financial Year End: ${getMonthName(business.financialYearEnd)}`);
	}
	lines.push("");

	// Current period dates
	const now = new Date();
	const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

	// Monthly summary
	if (includeTransactions) {
		const [currentMonthStats, lastMonthStats] = await Promise.all([
			getMonthlyStats(businessId, monthStart, monthEnd),
			getMonthlyStats(businessId, lastMonthStart, lastMonthEnd),
		]);

		lines.push("## Current Month Summary");
		lines.push(`Revenue: ${formatCurrency(currentMonthStats.revenue)}`);
		lines.push(`Expenses: ${formatCurrency(currentMonthStats.expenses)}`);
		lines.push(`Net: ${formatCurrency(currentMonthStats.revenue - currentMonthStats.expenses)}`);
		lines.push("");

		lines.push("## Last Month Summary");
		lines.push(`Revenue: ${formatCurrency(lastMonthStats.revenue)}`);
		lines.push(`Expenses: ${formatCurrency(lastMonthStats.expenses)}`);
		lines.push(`Net: ${formatCurrency(lastMonthStats.revenue - lastMonthStats.expenses)}`);
		lines.push("");
	}

	// Bank accounts
	if (includeBankAccounts) {
		const bankAccounts = await prisma.bankAccount.findMany({
			where: { businessId, isActive: true },
			select: {
				name: true,
				bankName: true,
				currentBalance: true,
			},
			take: 5,
		});

		if (bankAccounts.length > 0) {
			lines.push("## Bank Accounts");
			for (const account of bankAccounts) {
				lines.push(
					`- ${account.name} (${account.bankName}): ${formatCurrency(Number(account.currentBalance))}`
				);
			}
			lines.push("");
		}
	}

	// Outstanding invoices
	if (includeInvoices) {
		const [outstandingInvoices, overdueInvoices] = await Promise.all([
			prisma.invoice.aggregate({
				where: {
					businessId,
					status: { in: ["SENT", "PARTIALLY_PAID"] },
				},
				_sum: { total: true },
				_count: true,
			}),
			prisma.invoice.aggregate({
				where: {
					businessId,
					status: { in: ["SENT", "PARTIALLY_PAID"] },
					dueDate: { lt: now },
				},
				_sum: { total: true },
				_count: true,
			}),
		]);

		lines.push("## Invoices");
		lines.push(
			`Outstanding: ${outstandingInvoices._count} invoices (${formatCurrency(Number(outstandingInvoices._sum.total || 0))})`
		);
		lines.push(
			`Overdue: ${overdueInvoices._count} invoices (${formatCurrency(Number(overdueInvoices._sum.total || 0))})`
		);
		lines.push("");
	}

	// Tax periods
	if (includeTaxPeriods) {
		const upcomingTaxPeriods = await prisma.taxPeriod.findMany({
			where: {
				businessId,
				status: { in: ["OPEN", "IN_PROGRESS", "READY_TO_SUBMIT"] },
			},
			orderBy: { dueDate: "asc" },
			take: 3,
		});

		if (upcomingTaxPeriods.length > 0) {
			lines.push("## Upcoming Tax Deadlines");
			for (const period of upcomingTaxPeriods) {
				const daysUntil = Math.ceil(
					(period.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				);
				const urgency = daysUntil < 7 ? " (URGENT)" : daysUntil < 14 ? " (Soon)" : "";
				lines.push(
					`- ${period.type}: Due ${formatDate(period.dueDate, { day: "2-digit", month: "short", year: "numeric" })}${urgency}`
				);
			}
			lines.push("");
		}
	}

	// Recent transactions
	if (includeTransactions) {
		const recentTransactions = await prisma.transaction.findMany({
			where: { businessId },
			orderBy: { date: "desc" },
			take: 5,
			select: {
				date: true,
				description: true,
				amount: true,
				type: true,
			},
		});

		if (recentTransactions.length > 0) {
			lines.push("## Recent Transactions (Last 5)");
			for (const tx of recentTransactions) {
				const sign = tx.type === "INCOME" ? "+" : "-";
				lines.push(
					`- ${formatDate(tx.date, { day: "2-digit", month: "short" })}: ${tx.description?.substring(0, 30) || "No description"} ${sign}${formatCurrency(Math.abs(Number(tx.amount)))}`
				);
			}
			lines.push("");
		}
	}

	return lines.join("\n");
}

/**
 * Get monthly financial stats
 */
async function getMonthlyStats(
	businessId: string,
	startDate: Date,
	endDate: Date
): Promise<{ revenue: number; expenses: number }> {
	const transactions = await prisma.transaction.groupBy({
		by: ["type"],
		where: {
			businessId,
			date: { gte: startDate, lte: endDate },
		},
		_sum: { amount: true },
	});

	let revenue = 0;
	let expenses = 0;

	for (const t of transactions) {
		const amount = Math.abs(Number(t._sum.amount || 0));
		if (t.type === "INCOME") {
			revenue += amount;
		} else if (t.type === "EXPENSE") {
			expenses += amount;
		}
	}

	return { revenue, expenses };
}

/**
 * Format business type for display
 */
function formatBusinessType(type: string): string {
	const types: Record<string, string> = {
		SOLE_PROPRIETOR: "Sole Proprietor",
		PARTNERSHIP: "Partnership",
		PRIVATE_COMPANY: "Private Company (Pty) Ltd",
		PUBLIC_COMPANY: "Public Company",
		CLOSE_CORPORATION: "Close Corporation (CC)",
		NON_PROFIT: "Non-Profit Organization",
		TRUST: "Trust",
		OTHER: "Other",
	};
	return types[type] || type;
}

/**
 * Format VAT cycle for display
 */
function formatVatCycle(cycle: string): string {
	const cycles: Record<string, string> = {
		MONTHLY: "Monthly (Category A)",
		BI_MONTHLY: "Bi-monthly (Category B)",
		FOUR_MONTHLY: "4-Monthly (Category C)",
		SIX_MONTHLY: "6-Monthly",
		ANNUAL: "Annual",
	};
	return cycles[cycle] || cycle;
}

/**
 * Get month name from month number (1-12)
 */
function getMonthName(month: number): string {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return months[month - 1] || "Unknown";
}
