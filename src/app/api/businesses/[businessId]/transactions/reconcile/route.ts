import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/businesses/[businessId]/transactions/reconcile - Reconcile transactions
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check membership and permissions
		const membership = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId: session.user.id,
					businessId,
				},
			},
		});

		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (!["OWNER", "ADMIN", "ACCOUNTANT"].includes(membership.role)) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const { transactionIds, bankAccountId, statementBalance, statementDate } = body;

		if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
			return NextResponse.json(
				{ success: false, error: "Transaction IDs are required" },
				{ status: 400 }
			);
		}

		if (!bankAccountId) {
			return NextResponse.json(
				{ success: false, error: "Bank account is required" },
				{ status: 400 }
			);
		}

		// Verify bank account belongs to this business
		const bankAccount = await prisma.bankAccount.findFirst({
			where: { id: bankAccountId, businessId },
		});

		if (!bankAccount) {
			return NextResponse.json(
				{ success: false, error: "Bank account not found" },
				{ status: 404 }
			);
		}

		// Verify all transactions belong to this business and bank account
		const transactions = await prisma.transaction.findMany({
			where: {
				id: { in: transactionIds },
				businessId,
				bankAccountId,
			},
		});

		if (transactions.length !== transactionIds.length) {
			return NextResponse.json(
				{ success: false, error: "Some transactions not found or belong to different accounts" },
				{ status: 400 }
			);
		}

		// Check if any transactions are already reconciled
		const alreadyReconciled = transactions.filter((t) => t.isReconciled);
		if (alreadyReconciled.length > 0) {
			return NextResponse.json(
				{
					success: false,
					error: `${alreadyReconciled.length} transaction(s) are already reconciled`,
				},
				{ status: 400 }
			);
		}

		// Calculate reconciled balance
		let reconciledTotal = 0;
		for (const tx of transactions) {
			const amount = tx.amount.toNumber();
			reconciledTotal += tx.type === "INCOME" ? amount : -amount;
		}

		// Reconcile transactions
		const result = await prisma.transaction.updateMany({
			where: {
				id: { in: transactionIds },
				businessId,
			},
			data: {
				isReconciled: true,
				reconciledAt: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: `Successfully reconciled ${result.count} transactions`,
			reconciled: result.count,
			reconciledTotal,
			statementBalance: statementBalance ? Number.parseFloat(statementBalance) : null,
			statementDate: statementDate || null,
		});
	} catch (error) {
		console.error("Reconcile error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/transactions/reconcile - Unreconcile transactions
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId: session.user.id,
					businessId,
				},
			},
		});

		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (!["OWNER", "ADMIN"].includes(membership.role)) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const { transactionIds } = body;

		if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
			return NextResponse.json(
				{ success: false, error: "Transaction IDs are required" },
				{ status: 400 }
			);
		}

		// Unreconcile transactions
		const result = await prisma.transaction.updateMany({
			where: {
				id: { in: transactionIds },
				businessId,
				isReconciled: true,
			},
			data: {
				isReconciled: false,
				reconciledAt: null,
			},
		});

		return NextResponse.json({
			success: true,
			message: `Successfully unreconciled ${result.count} transactions`,
			unreconciled: result.count,
		});
	} catch (error) {
		console.error("Unreconcile error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
