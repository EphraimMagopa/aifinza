import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordPaymentSchema } from "@/lib/validations/invoice";

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

// POST /api/businesses/[businessId]/invoices/[invoiceId]/payment - Record payment
export async function POST(
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

		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, businessId },
			include: { customer: true },
		});

		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Can't record payment on cancelled or written off invoices
		if (invoice.status === "CANCELLED" || invoice.status === "WRITTEN_OFF") {
			return NextResponse.json(
				{ error: "Cannot record payment on a cancelled or written off invoice" },
				{ status: 400 }
			);
		}

		const body = await request.json();
		const parsed = recordPaymentSchema.safeParse(body);

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

		const { amount, date, reference, notes, bankAccountId } = parsed.data;

		// Calculate outstanding amount
		const outstanding = Number(invoice.total) - Number(invoice.amountPaid);

		if (amount > outstanding) {
			return NextResponse.json(
				{
					error: `Payment amount (${amount}) exceeds outstanding balance (${outstanding})`,
				},
				{ status: 400 }
			);
		}

		// Create payment in transaction
		const result = await prisma.$transaction(async (tx) => {
			// Create transaction record
			const transaction = await tx.transaction.create({
				data: {
					businessId,
					customerId: invoice.customerId,
					invoiceId: invoice.id,
					bankAccountId: bankAccountId || null,
					date: new Date(date),
					description: `Payment for ${invoice.invoiceNumber}`,
					reference: reference || null,
					amount,
					type: "INCOME",
					notes: notes || null,
				},
			});

			// Update invoice amount paid
			const newAmountPaid = Number(invoice.amountPaid) + amount;
			const isPaid = newAmountPaid >= Number(invoice.total);
			const isPartiallyPaid = newAmountPaid > 0 && newAmountPaid < Number(invoice.total);

			const updatedInvoice = await tx.invoice.update({
				where: { id: invoiceId },
				data: {
					amountPaid: newAmountPaid,
					status: isPaid ? "PAID" : isPartiallyPaid ? "PARTIALLY_PAID" : invoice.status,
					paidDate: isPaid ? new Date() : null,
				},
			});

			// Update bank account balance if specified
			if (bankAccountId) {
				await tx.bankAccount.update({
					where: { id: bankAccountId },
					data: {
						currentBalance: { increment: amount },
					},
				});
			}

			return { transaction, invoice: updatedInvoice };
		});

		return NextResponse.json({
			success: true,
			message: "Payment recorded successfully",
			payment: {
				...result.transaction,
				amount: Number(result.transaction.amount),
			},
			invoice: {
				id: result.invoice.id,
				invoiceNumber: result.invoice.invoiceNumber,
				status: result.invoice.status,
				total: Number(result.invoice.total),
				amountPaid: Number(result.invoice.amountPaid),
				outstanding: Number(result.invoice.total) - Number(result.invoice.amountPaid),
			},
		});
	} catch (error) {
		console.error("Record payment error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
