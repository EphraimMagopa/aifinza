import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateQuoteSchema } from "@/lib/validations/quote";

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

// Calculate line item totals
function calculateLineItem(item: { quantity: number; unitPrice: number; vatRate: number }) {
	const lineTotal = item.quantity * item.unitPrice;
	const vatAmount = (lineTotal * item.vatRate) / 100;
	return { lineTotal, vatAmount };
}

// GET /api/businesses/[businessId]/quotes/[quoteId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; quoteId: string }> }
) {
	try {
		const { businessId, quoteId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const quote = await prisma.quote.findFirst({
			where: { id: quoteId, businessId },
			include: {
				customer: true,
				lineItems: {
					orderBy: { sortOrder: "asc" },
				},
				business: {
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
						logoUrl: true,
					},
				},
			},
		});

		if (!quote) {
			return NextResponse.json({ error: "Quote not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			quote: {
				...quote,
				subtotal: Number(quote.subtotal),
				vatAmount: Number(quote.vatAmount),
				discount: Number(quote.discount),
				total: Number(quote.total),
				customer: {
					...quote.customer,
					creditLimit: quote.customer.creditLimit ? Number(quote.customer.creditLimit) : null,
				},
				lineItems: quote.lineItems.map((li) => ({
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
		console.error("Get quote error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/quotes/[quoteId]
export async function PATCH(
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

		const existing = await prisma.quote.findFirst({
			where: { id: quoteId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Quote not found" }, { status: 404 });
		}

		// Can't edit invoiced or declined quotes
		if (existing.status === "INVOICED") {
			return NextResponse.json(
				{ error: "Cannot edit a quote that has been invoiced" },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const parsed = updateQuoteSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { lineItems, expiryDate, ...data } = parsed.data;

		// Build update data
		const updateData: Record<string, unknown> = { ...data };
		if (expiryDate) {
			updateData.expiryDate = new Date(expiryDate);
		}

		// If line items are updated, recalculate totals
		if (lineItems && lineItems.length > 0) {
			let subtotal = 0;
			let totalVat = 0;
			const processedLineItems = lineItems.map((item, index) => {
				const { lineTotal, vatAmount } = calculateLineItem(item);
				subtotal += lineTotal;
				totalVat += vatAmount;
				return {
					...item,
					vatAmount,
					lineTotal,
					sortOrder: index,
				};
			});

			const total = subtotal + totalVat - (data.discount ?? Number(existing.discount));

			updateData.subtotal = subtotal;
			updateData.vatAmount = totalVat;
			updateData.total = total;

			// Update in transaction
			const quote = await prisma.$transaction(async (tx) => {
				// Delete existing line items
				await tx.quoteLineItem.deleteMany({
					where: { quoteId },
				});

				// Update quote with new line items
				return tx.quote.update({
					where: { id: quoteId },
					data: {
						...updateData,
						lineItems: {
							create: processedLineItems,
						},
					},
					include: {
						customer: {
							select: { id: true, name: true, email: true },
						},
						lineItems: {
							orderBy: { sortOrder: "asc" },
						},
					},
				});
			});

			return NextResponse.json({
				success: true,
				message: "Quote updated successfully",
				quote: {
					...quote,
					subtotal: Number(quote.subtotal),
					vatAmount: Number(quote.vatAmount),
					discount: Number(quote.discount),
					total: Number(quote.total),
					lineItems: quote.lineItems.map((li) => ({
						...li,
						quantity: Number(li.quantity),
						unitPrice: Number(li.unitPrice),
						vatRate: Number(li.vatRate),
						vatAmount: Number(li.vatAmount),
						lineTotal: Number(li.lineTotal),
					})),
				},
			});
		}

		// Simple update without line items
		const quote = await prisma.quote.update({
			where: { id: quoteId },
			data: updateData,
			include: {
				customer: {
					select: { id: true, name: true, email: true },
				},
				lineItems: {
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		return NextResponse.json({
			success: true,
			message: "Quote updated successfully",
			quote: {
				...quote,
				subtotal: Number(quote.subtotal),
				vatAmount: Number(quote.vatAmount),
				discount: Number(quote.discount),
				total: Number(quote.total),
				lineItems: quote.lineItems.map((li) => ({
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
		console.error("Update quote error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/quotes/[quoteId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; quoteId: string }> }
) {
	try {
		const { businessId, quoteId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.quote.findFirst({
			where: { id: quoteId, businessId },
			include: {
				invoices: true,
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Quote not found" }, { status: 404 });
		}

		// Can't delete if converted to invoice
		if (existing.invoices.length > 0) {
			return NextResponse.json(
				{ error: "Cannot delete a quote that has been converted to an invoice" },
				{ status: 400 }
			);
		}

		await prisma.quote.delete({
			where: { id: quoteId },
		});

		return NextResponse.json({
			success: true,
			message: "Quote deleted successfully",
		});
	} catch (error) {
		console.error("Delete quote error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
