import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTransactionSchema } from "@/lib/validations/transaction";

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

// GET /api/businesses/[businessId]/transactions/[transactionId] - Get a single transaction
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; transactionId: string }> }
) {
	try {
		const { businessId, transactionId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const transaction = await prisma.transaction.findFirst({
			where: { id: transactionId, businessId },
			include: {
				category: { select: { id: true, name: true, color: true } },
				bankAccount: { select: { id: true, name: true, bankName: true } },
				customer: { select: { id: true, name: true } },
				supplier: { select: { id: true, name: true } },
				documents: {
					include: {
						document: { select: { id: true, name: true, fileUrl: true, mimeType: true } },
					},
				},
			},
		});

		if (!transaction) {
			return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			transaction: {
				...transaction,
				amount: Number(transaction.amount),
				vatRate: transaction.vatRate ? Number(transaction.vatRate) : null,
				vatAmount: transaction.vatAmount ? Number(transaction.vatAmount) : null,
			},
		});
	} catch (error) {
		console.error("Get transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/transactions/[transactionId] - Update transaction
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; transactionId: string }> }
) {
	try {
		const { businessId, transactionId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
			"MEMBER",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get existing transaction
		const existing = await prisma.transaction.findFirst({
			where: { id: transactionId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
		}

		// Cannot edit reconciled transactions (except by owner/admin)
		if (existing.isReconciled && !["OWNER", "ADMIN"].includes(membership.role)) {
			return NextResponse.json({ error: "Cannot edit reconciled transactions" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = updateTransactionSchema.safeParse(body);

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

		const { date, ...updateData } = parsed.data;

		// Calculate balance adjustment if amount or type changed
		const oldBalance =
			existing.type === "INCOME" ? Number(existing.amount) : -Number(existing.amount);
		const newType = updateData.type || existing.type;
		const newAmount = updateData.amount !== undefined ? updateData.amount : Number(existing.amount);
		const newBalance = newType === "INCOME" ? newAmount : -newAmount;
		const balanceChange = newBalance - oldBalance;

		const transaction = await prisma.transaction.update({
			where: { id: transactionId },
			data: {
				...updateData,
				...(date && { date: new Date(date) }),
			},
			include: {
				category: { select: { id: true, name: true, color: true } },
				bankAccount: { select: { id: true, name: true, bankName: true } },
			},
		});

		// Update bank account balance if needed
		if (transaction.bankAccountId && balanceChange !== 0) {
			await prisma.bankAccount.update({
				where: { id: transaction.bankAccountId },
				data: { currentBalance: { increment: balanceChange } },
			});
		}

		return NextResponse.json({
			success: true,
			message: "Transaction updated successfully",
			transaction: {
				...transaction,
				amount: Number(transaction.amount),
				vatRate: transaction.vatRate ? Number(transaction.vatRate) : null,
				vatAmount: transaction.vatAmount ? Number(transaction.vatAmount) : null,
			},
		});
	} catch (error) {
		console.error("Update transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/transactions/[transactionId] - Delete transaction
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; transactionId: string }> }
) {
	try {
		const { businessId, transactionId } = await params;
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

		const existing = await prisma.transaction.findFirst({
			where: { id: transactionId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
		}

		// Cannot delete reconciled transactions
		if (existing.isReconciled) {
			return NextResponse.json({ error: "Cannot delete reconciled transactions" }, { status: 403 });
		}

		// Reverse balance change
		if (existing.bankAccountId) {
			const balanceChange =
				existing.type === "INCOME" ? -Number(existing.amount) : Number(existing.amount);

			await prisma.bankAccount.update({
				where: { id: existing.bankAccountId },
				data: { currentBalance: { increment: balanceChange } },
			});
		}

		await prisma.transaction.delete({
			where: { id: transactionId },
		});

		return NextResponse.json({
			success: true,
			message: "Transaction deleted successfully",
		});
	} catch (error) {
		console.error("Delete transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
