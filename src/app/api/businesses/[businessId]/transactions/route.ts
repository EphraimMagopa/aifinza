import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTransactionSchema } from "@/lib/validations/transaction";

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

// GET /api/businesses/[businessId]/transactions - Get transactions with filters
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

		// Parse query params
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const bankAccountId = searchParams.get("bankAccountId");
		const categoryId = searchParams.get("categoryId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const search = searchParams.get("search");
		const isReconciled = searchParams.get("isReconciled");
		const reconciled = searchParams.get("reconciled"); // Alias for isReconciled
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

		// Build where clause
		const where: Prisma.TransactionWhereInput = { businessId };

		if (type) where.type = type as Prisma.TransactionWhereInput["type"];
		if (bankAccountId) where.bankAccountId = bankAccountId;
		if (categoryId) where.categoryId = categoryId;

		// Handle reconciled filter (support both param names)
		const reconciledParam = isReconciled ?? reconciled;
		if (reconciledParam !== null) {
			where.isReconciled = reconciledParam === "true";
		}

		if (startDate || endDate) {
			where.date = {};
			if (startDate) where.date.gte = new Date(startDate);
			if (endDate) where.date.lte = new Date(endDate);
		}

		if (search) {
			where.OR = [
				{ description: { contains: search, mode: "insensitive" } },
				{ reference: { contains: search, mode: "insensitive" } },
			];
		}

		// Get total count for pagination
		const total = await prisma.transaction.count({ where });

		// Get transactions
		const transactions = await prisma.transaction.findMany({
			where,
			include: {
				category: { select: { id: true, name: true, color: true } },
				bankAccount: { select: { id: true, name: true, bankName: true } },
				customer: { select: { id: true, name: true } },
				supplier: { select: { id: true, name: true } },
			},
			orderBy: [{ date: "desc" }, { createdAt: "desc" }],
			skip: (page - 1) * limit,
			take: limit,
		});

		return NextResponse.json({
			success: true,
			transactions: transactions.map((t) => ({
				...t,
				amount: Number(t.amount),
				vatRate: t.vatRate ? Number(t.vatRate) : null,
				vatAmount: t.vatAmount ? Number(t.vatAmount) : null,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get transactions error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/transactions - Create a transaction
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

		// OWNER, ADMIN, ACCOUNTANT, and MEMBER can create transactions
		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
			"MEMBER",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createTransactionSchema.safeParse(body);

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

		const { date, ...transactionData } = parsed.data;

		// Create transaction
		const transaction = await prisma.transaction.create({
			data: {
				...transactionData,
				date: new Date(date),
				businessId,
			},
			include: {
				category: { select: { id: true, name: true, color: true } },
				bankAccount: { select: { id: true, name: true, bankName: true } },
			},
		});

		// Update bank account balance if linked
		if (transaction.bankAccountId) {
			const balanceChange =
				transaction.type === "INCOME"
					? Number(transaction.amount)
					: transaction.type === "EXPENSE"
						? -Number(transaction.amount)
						: 0;

			if (balanceChange !== 0) {
				await prisma.bankAccount.update({
					where: { id: transaction.bankAccountId },
					data: { currentBalance: { increment: balanceChange } },
				});
			}
		}

		return NextResponse.json(
			{
				success: true,
				message: "Transaction created successfully",
				transaction: {
					...transaction,
					amount: Number(transaction.amount),
					vatRate: transaction.vatRate ? Number(transaction.vatRate) : null,
					vatAmount: transaction.vatAmount ? Number(transaction.vatAmount) : null,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
