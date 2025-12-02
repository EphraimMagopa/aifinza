import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBankAccountSchema } from "@/lib/validations/bank-account";

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

// GET /api/businesses/[businessId]/bank-accounts/[accountId] - Get a single account
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; accountId: string }> }
) {
	try {
		const { businessId, accountId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const account = await prisma.bankAccount.findFirst({
			where: { id: accountId, businessId },
			include: {
				_count: {
					select: { transactions: true },
				},
			},
		});

		if (!account) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			account: {
				...account,
				currentBalance: Number(account.currentBalance),
			},
		});
	} catch (error) {
		console.error("Get bank account error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/bank-accounts/[accountId] - Update account
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; accountId: string }> }
) {
	try {
		const { businessId, accountId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER, ADMIN, and ACCOUNTANT can update accounts
		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = updateBankAccountSchema.safeParse(body);

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

		// Verify account belongs to business
		const existing = await prisma.bankAccount.findFirst({
			where: { id: accountId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		const account = await prisma.bankAccount.update({
			where: { id: accountId },
			data: parsed.data,
		});

		return NextResponse.json({
			success: true,
			message: "Bank account updated successfully",
			account: {
				...account,
				currentBalance: Number(account.currentBalance),
			},
		});
	} catch (error) {
		console.error("Update bank account error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/bank-accounts/[accountId] - Delete account
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; accountId: string }> }
) {
	try {
		const { businessId, accountId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER and ADMIN can delete accounts
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Verify account belongs to business
		const existing = await prisma.bankAccount.findFirst({
			where: { id: accountId, businessId },
			include: {
				_count: { select: { transactions: true } },
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Account not found" }, { status: 404 });
		}

		// Don't delete if there are transactions
		if (existing._count.transactions > 0) {
			return NextResponse.json(
				{
					success: false,
					error: `Cannot delete account with ${existing._count.transactions} transactions. Deactivate it instead.`,
				},
				{ status: 400 }
			);
		}

		await prisma.bankAccount.delete({
			where: { id: accountId },
		});

		return NextResponse.json({
			success: true,
			message: "Bank account deleted successfully",
		});
	} catch (error) {
		console.error("Delete bank account error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
