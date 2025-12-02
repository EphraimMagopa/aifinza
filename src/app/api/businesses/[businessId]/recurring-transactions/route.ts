import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRecurringTransactionSchema } from "@/lib/validations/recurring-transaction";

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

// GET /api/businesses/[businessId]/recurring-transactions - Get all recurring transactions
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
		const isActive = searchParams.get("isActive");

		const recurringTransactions = await prisma.recurringTransaction.findMany({
			where: {
				businessId,
				...(isActive !== null && { isActive: isActive === "true" }),
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			success: true,
			recurringTransactions: recurringTransactions.map((rt) => ({
				...rt,
				amount: Number(rt.amount),
				nextOccurrence: rt.nextDueDate,
			})),
		});
	} catch (error) {
		console.error("Get recurring transactions error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/recurring-transactions - Create recurring transaction
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

		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createRecurringTransactionSchema.safeParse(body);

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

		const { startDate, endDate, categoryId, bankAccountId, ...data } = parsed.data;

		// Calculate next due date based on start date
		const nextDueDate = new Date(startDate);

		const recurringTransaction = await prisma.recurringTransaction.create({
			data: {
				description: data.description,
				amount: data.amount,
				type: data.type,
				frequency: data.frequency,
				isActive: data.isActive,
				startDate: new Date(startDate),
				endDate: endDate ? new Date(endDate) : null,
				nextDueDate,
				businessId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Recurring transaction created successfully",
				recurringTransaction: {
					...recurringTransaction,
					amount: Number(recurringTransaction.amount),
					nextOccurrence: recurringTransaction.nextDueDate,
					category: null,
					bankAccount: null,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create recurring transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
