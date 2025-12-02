import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check if user has access to business
async function checkBusinessAccess(userId: string, businessId: string, requiredRoles?: string[]) {
	const membership = await prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});

	if (!membership) return null;

	if (requiredRoles && !requiredRoles.includes(membership.role)) {
		return null;
	}

	return membership;
}

// POST /api/businesses/[businessId]/quotes/[quoteId]/convert - Convert quote to invoice
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; quoteId: string }> }
) {
	try {
		const { businessId, quoteId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const quote = await prisma.quote.findFirst({
			where: { id: quoteId, businessId },
			include: {
				lineItems: {
					orderBy: { sortOrder: "asc" },
				},
				customer: true,
			},
		});

		if (!quote) {
			return NextResponse.json({ error: "Quote not found" }, { status: 404 });
		}

		// Can only convert accepted quotes or drafts
		if (!["DRAFT", "SENT", "ACCEPTED"].includes(quote.status)) {
			return NextResponse.json(
				{ error: "Can only convert draft, sent, or accepted quotes" },
				{ status: 400 }
			);
		}

		// Check if already converted
		if (quote.status === "INVOICED") {
			return NextResponse.json(
				{ error: "This quote has already been converted to an invoice" },
				{ status: 400 }
			);
		}

		// Get optional due date from request body
		const body = await request.json().catch(() => ({}));
		const paymentTerms = quote.customer.paymentTerms || 30;
		const dueDate = body.dueDate
			? new Date(body.dueDate)
			: new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000);

		// Get next invoice number
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			select: { invoicePrefix: true, nextInvoiceNumber: true },
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const invoiceNumber = `${business.invoicePrefix}${String(business.nextInvoiceNumber).padStart(5, "0")}`;

		// Create invoice in transaction
		const invoice = await prisma.$transaction(async (tx) => {
			// Update next invoice number
			await tx.business.update({
				where: { id: businessId },
				data: { nextInvoiceNumber: { increment: 1 } },
			});

			// Update quote status
			await tx.quote.update({
				where: { id: quoteId },
				data: { status: "INVOICED" },
			});

			// Create invoice with line items
			return tx.invoice.create({
				data: {
					businessId,
					customerId: quote.customerId,
					quoteId: quote.id,
					invoiceNumber,
					reference: quote.reference,
					issueDate: new Date(),
					dueDate,
					subtotal: quote.subtotal,
					vatAmount: quote.vatAmount,
					discount: quote.discount,
					total: quote.total,
					notes: quote.notes,
					terms: quote.terms,
					lineItems: {
						create: quote.lineItems.map((li) => ({
							description: li.description,
							quantity: li.quantity,
							unitPrice: li.unitPrice,
							vatRate: li.vatRate,
							vatAmount: li.vatAmount,
							lineTotal: li.lineTotal,
							sortOrder: li.sortOrder,
						})),
					},
				},
				include: {
					customer: {
						select: { id: true, name: true, email: true },
					},
					lineItems: true,
				},
			});
		});

		return NextResponse.json({
			success: true,
			message: "Quote converted to invoice successfully",
			invoice: {
				...invoice,
				subtotal: Number(invoice.subtotal),
				vatAmount: Number(invoice.vatAmount),
				discount: Number(invoice.discount),
				total: Number(invoice.total),
				amountPaid: Number(invoice.amountPaid),
				lineItems: invoice.lineItems.map((li) => ({
					...li,
					quantity: Number(li.quantity),
					unitPrice: Number(li.unitPrice),
					vatRate: Number(li.vatRate),
					vatAmount: Number(li.vatAmount),
					lineTotal: Number(li.lineTotal),
				})),
			},
		});
	} catch (error) {
		console.error("Convert quote to invoice error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
