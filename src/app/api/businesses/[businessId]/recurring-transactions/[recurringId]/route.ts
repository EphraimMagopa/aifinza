import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRecurringTransactionSchema } from "@/lib/validations/recurring-transaction";

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

// GET /api/businesses/[businessId]/recurring-transactions/[recurringId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; recurringId: string }> }
) {
	try {
		const { businessId, recurringId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const recurringTransaction = await prisma.recurringTransaction.findFirst({
			where: { id: recurringId, businessId },
		});

		if (!recurringTransaction) {
			return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			recurringTransaction: {
				...recurringTransaction,
				amount: Number(recurringTransaction.amount),
				nextOccurrence: recurringTransaction.nextDueDate,
				category: null,
				bankAccount: null,
			},
		});
	} catch (error) {
		console.error("Get recurring transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/recurring-transactions/[recurringId]
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; recurringId: string }> }
) {
	try {
		const { businessId, recurringId } = await params;
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

		const existing = await prisma.recurringTransaction.findFirst({
			where: { id: recurringId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateRecurringTransactionSchema.safeParse(body);

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

		const { startDate, endDate, ...data } = parsed.data;

		// Build update data, excluding fields not in schema
		const updateData: Record<string, unknown> = {};
		if (data.description !== undefined) updateData.description = data.description;
		if (data.amount !== undefined) updateData.amount = data.amount;
		if (data.type !== undefined) updateData.type = data.type;
		if (data.frequency !== undefined) updateData.frequency = data.frequency;
		if (data.isActive !== undefined) updateData.isActive = data.isActive;
		if (startDate) {
			updateData.startDate = new Date(startDate);
			updateData.nextDueDate = new Date(startDate);
		}
		if (endDate !== undefined) {
			updateData.endDate = endDate ? new Date(endDate) : null;
		}

		const recurringTransaction = await prisma.recurringTransaction.update({
			where: { id: recurringId },
			data: updateData,
		});

		return NextResponse.json({
			success: true,
			message: "Recurring transaction updated successfully",
			recurringTransaction: {
				...recurringTransaction,
				amount: Number(recurringTransaction.amount),
				nextOccurrence: recurringTransaction.nextDueDate,
				category: null,
				bankAccount: null,
			},
		});
	} catch (error) {
		console.error("Update recurring transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/recurring-transactions/[recurringId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; recurringId: string }> }
) {
	try {
		const { businessId, recurringId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.recurringTransaction.findFirst({
			where: { id: recurringId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Recurring transaction not found" }, { status: 404 });
		}

		await prisma.recurringTransaction.delete({
			where: { id: recurringId },
		});

		return NextResponse.json({
			success: true,
			message: "Recurring transaction deleted successfully",
		});
	} catch (error) {
		console.error("Delete recurring transaction error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
