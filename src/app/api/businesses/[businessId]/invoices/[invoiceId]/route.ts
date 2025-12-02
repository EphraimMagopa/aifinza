import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateInvoiceSchema } from "@/lib/validations/invoice";

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

// GET /api/businesses/[businessId]/invoices/[invoiceId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
	try {
		const { businessId, invoiceId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, businessId },
			include: {
				customer: true,
				lineItems: {
					orderBy: { sortOrder: "asc" },
				},
				quote: {
					select: { id: true, quoteNumber: true },
				},
				transactions: {
					where: { type: "INCOME" },
					orderBy: { date: "desc" },
					select: {
						id: true,
						date: true,
						description: true,
						reference: true,
						amount: true,
					},
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

		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			invoice: {
				...invoice,
				subtotal: Number(invoice.subtotal),
				vatAmount: Number(invoice.vatAmount),
				discount: Number(invoice.discount),
				total: Number(invoice.total),
				amountPaid: Number(invoice.amountPaid),
				customer: {
					...invoice.customer,
					creditLimit: invoice.customer.creditLimit ? Number(invoice.customer.creditLimit) : null,
				},
				lineItems: invoice.lineItems.map((li) => ({
					...li,
					quantity: Number(li.quantity),
					unitPrice: Number(li.unitPrice),
					vatRate: Number(li.vatRate),
					vatAmount: Number(li.vatAmount),
					lineTotal: Number(li.lineTotal),
				})),
				transactions: invoice.transactions.map((t) => ({
					...t,
					amount: Number(t.amount),
				})),
			},
		});
	} catch (error) {
		console.error("Get invoice error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/invoices/[invoiceId]
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
	try {
		const { businessId, invoiceId } = await params;
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

		const existing = await prisma.invoice.findFirst({
			where: { id: invoiceId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Can't edit paid or cancelled invoices
		if (existing.status === "PAID" || existing.status === "CANCELLED") {
			return NextResponse.json(
				{ error: "Cannot edit a paid or cancelled invoice" },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const parsed = updateInvoiceSchema.safeParse(body);

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

		const { lineItems, dueDate, ...data } = parsed.data;

		// Build update data
		const updateData: Record<string, unknown> = { ...data };
		if (dueDate) {
			updateData.dueDate = new Date(dueDate);
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
			const invoice = await prisma.$transaction(async (tx) => {
				// Delete existing line items
				await tx.invoiceLineItem.deleteMany({
					where: { invoiceId },
				});

				// Update invoice with new line items
				return tx.invoice.update({
					where: { id: invoiceId },
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
				message: "Invoice updated successfully",
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
		}

		// Simple update without line items
		const invoice = await prisma.invoice.update({
			where: { id: invoiceId },
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
			message: "Invoice updated successfully",
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
		console.error("Update invoice error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/invoices/[invoiceId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; invoiceId: string }> }
) {
	try {
		const { businessId, invoiceId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.invoice.findFirst({
			where: { id: invoiceId, businessId },
			include: {
				transactions: true,
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Can't delete if has payments
		if (existing.transactions.length > 0 || Number(existing.amountPaid) > 0) {
			return NextResponse.json(
				{ error: "Cannot delete an invoice with recorded payments. Cancel it instead." },
				{ status: 400 }
			);
		}

		// Only delete draft invoices
		if (existing.status !== "DRAFT") {
			// Cancel instead of delete
			await prisma.invoice.update({
				where: { id: invoiceId },
				data: { status: "CANCELLED" },
			});

			return NextResponse.json({
				success: true,
				message: "Invoice has been cancelled (non-draft invoices cannot be deleted)",
				cancelled: true,
			});
		}

		await prisma.invoice.delete({
			where: { id: invoiceId },
		});

		return NextResponse.json({
			success: true,
			message: "Invoice deleted successfully",
		});
	} catch (error) {
		console.error("Delete invoice error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
