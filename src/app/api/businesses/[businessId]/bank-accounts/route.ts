import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBankAccountSchema } from "@/lib/validations/bank-account";

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

// GET /api/businesses/[businessId]/bank-accounts - Get all bank accounts
export async function GET(
	_request: Request,
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

		const accounts = await prisma.bankAccount.findMany({
			where: { businessId },
			orderBy: [{ isActive: "desc" }, { name: "asc" }],
		});

		return NextResponse.json({
			success: true,
			accounts: accounts.map((a) => ({
				...a,
				currentBalance: Number(a.currentBalance),
			})),
		});
	} catch (error) {
		console.error("Get bank accounts error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/bank-accounts - Create a bank account
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

		// Only OWNER, ADMIN, and ACCOUNTANT can create accounts
		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createBankAccountSchema.safeParse(body);

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

		const { openingBalance, ...accountData } = parsed.data;

		const account = await prisma.bankAccount.create({
			data: {
				...accountData,
				businessId,
				currentBalance: openingBalance,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Bank account created successfully",
				account: {
					...account,
					currentBalance: Number(account.currentBalance),
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create bank account error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
