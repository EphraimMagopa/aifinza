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

// GET /api/businesses/[businessId]/customers/[customerId]/statement
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
	try {
		const { businessId, customerId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Parse query params for date range
		const { searchParams } = new URL(request.url);
		const fromDate = searchParams.get("from");
		const toDate = searchParams.get("to");

		const customer = await prisma.customer.findFirst({
			where: { id: customerId, businessId },
		});

		if (!customer) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		// Get business details for statement header
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			select: {
				name: true,
				tradingName: true,
				email: true,
				phone: true,
				addressLine1: true,
				addressLine2: true,
				city: true,
				province: true,
				postalCode: true,
				vatNumber: true,
			},
		});

		// Build date filter
		const dateFilter: { issueDate?: { gte?: Date; lte?: Date } } = {};
		if (fromDate || toDate) {
			dateFilter.issueDate = {};
			if (fromDate) dateFilter.issueDate.gte = new Date(fromDate);
			if (toDate) dateFilter.issueDate.lte = new Date(toDate);
		}

		// Get all invoices for this customer
		const invoices = await prisma.invoice.findMany({
			where: {
				customerId,
				...dateFilter,
			},
			orderBy: { issueDate: "asc" },
			select: {
				id: true,
				invoiceNumber: true,
				reference: true,
				status: true,
				issueDate: true,
				dueDate: true,
				total: true,
				amountPaid: true,
			},
		});

		// Get payments (transactions linked to this customer)
		const payments = await prisma.transaction.findMany({
			where: {
				customerId,
				type: "INCOME",
				...(fromDate || toDate
					? {
							date: {
								...(fromDate && { gte: new Date(fromDate) }),
								...(toDate && { lte: new Date(toDate) }),
							},
						}
					: {}),
			},
			orderBy: { date: "asc" },
			select: {
				id: true,
				date: true,
				description: true,
				reference: true,
				amount: true,
				invoiceId: true,
			},
		});

		// Build statement lines
		type StatementLine = {
			id: string;
			date: Date;
			type: "INVOICE" | "PAYMENT" | "CREDIT";
			reference: string;
			description: string;
			debit: number;
			credit: number;
			balance: number;
		};

		const statementLines: StatementLine[] = [];

		// Add invoices as debits
		for (const invoice of invoices) {
			if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
				statementLines.push({
					id: invoice.id,
					date: invoice.issueDate,
					type: "INVOICE",
					reference: invoice.invoiceNumber,
					description: invoice.reference || `Invoice ${invoice.invoiceNumber}`,
					debit: Number(invoice.total),
					credit: 0,
					balance: 0,
				});
			}
		}

		// Add payments as credits
		for (const payment of payments) {
			statementLines.push({
				id: payment.id,
				date: payment.date,
				type: "PAYMENT",
				reference: payment.reference || "",
				description: payment.description,
				debit: 0,
				credit: Number(payment.amount),
				balance: 0,
			});
		}

		// Sort by date
		statementLines.sort((a, b) => a.date.getTime() - b.date.getTime());

		// Calculate running balance
		let runningBalance = 0;
		for (const line of statementLines) {
			runningBalance += line.debit - line.credit;
			line.balance = runningBalance;
		}

		// Calculate totals
		const totalDebits = statementLines.reduce((sum, line) => sum + line.debit, 0);
		const totalCredits = statementLines.reduce((sum, line) => sum + line.credit, 0);
		const closingBalance = totalDebits - totalCredits;

		// Get aging breakdown
		const now = new Date();
		const aging = {
			current: 0,
			days30: 0,
			days60: 0,
			days90: 0,
			over90: 0,
		};

		for (const invoice of invoices) {
			if (!["PAID", "CANCELLED", "DRAFT", "WRITTEN_OFF"].includes(invoice.status)) {
				const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
				if (outstanding > 0) {
					const daysOverdue = Math.floor(
						(now.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
					);

					if (daysOverdue <= 0) {
						aging.current += outstanding;
					} else if (daysOverdue <= 30) {
						aging.days30 += outstanding;
					} else if (daysOverdue <= 60) {
						aging.days60 += outstanding;
					} else if (daysOverdue <= 90) {
						aging.days90 += outstanding;
					} else {
						aging.over90 += outstanding;
					}
				}
			}
		}

		return NextResponse.json({
			success: true,
			statement: {
				business,
				customer: {
					id: customer.id,
					name: customer.name,
					email: customer.email,
					phone: customer.phone,
					addressLine1: customer.addressLine1,
					addressLine2: customer.addressLine2,
					city: customer.city,
					province: customer.province,
					postalCode: customer.postalCode,
					vatNumber: customer.vatNumber,
				},
				dateRange: {
					from: fromDate || null,
					to: toDate || null,
				},
				lines: statementLines,
				summary: {
					totalDebits,
					totalCredits,
					closingBalance,
				},
				aging,
				generatedAt: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Get customer statement error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
