import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, parseCSVWithBank } from "@/lib/utils/csv-parsers";

// POST /api/businesses/[businessId]/transactions/bulk - Bulk import transactions
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
		const { csvContent, bankAccountId, bankName, categoryId, skipDuplicates = true } = body;

		if (!csvContent) {
			return NextResponse.json(
				{ success: false, error: "CSV content is required" },
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

		// Parse CSV
		const parseResult = bankName ? parseCSVWithBank(csvContent, bankName) : parseCSV(csvContent);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to parse CSV",
					details: parseResult.errors,
					bankDetected: parseResult.bankName,
				},
				{ status: 400 }
			);
		}

		// Get existing transactions for duplicate checking
		type ExistingTransaction = {
			date: Date;
			description: string;
			amount: { toNumber: () => number };
		};
		let existingTransactions: ExistingTransaction[] = [];
		if (skipDuplicates) {
			existingTransactions = await prisma.transaction.findMany({
				where: { businessId, bankAccountId },
				select: { date: true, description: true, amount: true },
			});
		}

		// Check for duplicates
		const isDuplicate = (date: Date, description: string, amount: number): boolean => {
			return existingTransactions.some(
				(t) =>
					t.date.toDateString() === date.toDateString() &&
					t.description === description &&
					Math.abs(t.amount.toNumber() - amount) < 0.01
			);
		};

		// Prepare transactions for insertion
		const transactionsToInsert: {
			businessId: string;
			bankAccountId: string;
			categoryId: string | null;
			date: Date;
			description: string;
			amount: number;
			type: "INCOME" | "EXPENSE";
			reference: string | null;
			isReconciled: boolean;
		}[] = [];
		const duplicates: typeof parseResult.transactions = [];
		let balanceChange = 0;

		for (const tx of parseResult.transactions) {
			if (skipDuplicates && isDuplicate(tx.date, tx.description, tx.amount)) {
				duplicates.push(tx);
				continue;
			}

			const signedAmount = tx.type === "INCOME" ? tx.amount : -tx.amount;
			balanceChange += signedAmount;

			transactionsToInsert.push({
				businessId,
				bankAccountId,
				categoryId: categoryId || null,
				date: tx.date,
				description: tx.description,
				amount: tx.amount,
				type: tx.type,
				reference: tx.reference,
				isReconciled: false,
			});
		}

		if (transactionsToInsert.length === 0) {
			return NextResponse.json({
				success: true,
				message: "No new transactions to import",
				imported: 0,
				duplicates: duplicates.length,
				bankDetected: parseResult.bankName,
			});
		}

		// Insert transactions and update balance in a transaction
		const result = await prisma.$transaction(async (tx) => {
			const created = await tx.transaction.createMany({
				data: transactionsToInsert,
			});

			// Update bank account balance
			await tx.bankAccount.update({
				where: { id: bankAccountId },
				data: { currentBalance: { increment: balanceChange } },
			});

			return created;
		});

		return NextResponse.json(
			{
				success: true,
				message: `Successfully imported ${result.count} transactions`,
				imported: result.count,
				duplicates: duplicates.length,
				bankDetected: parseResult.bankName,
				parseErrors: parseResult.errors.length > 0 ? parseResult.errors : undefined,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Bulk import error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
