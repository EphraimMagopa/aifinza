import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validation schema for updating a business
const updateBusinessSchema = z.object({
	name: z.string().min(2).optional(),
	tradingName: z.string().optional().nullable(),
	registrationNumber: z.string().optional().nullable(),
	taxNumber: z.string().optional().nullable(),
	vatNumber: z.string().optional().nullable(),
	isVatRegistered: z.boolean().optional(),
	vatCycle: z.enum(["MONTHLY", "BI_MONTHLY"]).optional().nullable(),
	industry: z.string().optional().nullable(),
	financialYearEnd: z.number().min(1).max(12).optional(),
	email: z.string().email().optional().nullable(),
	phone: z.string().optional().nullable(),
	website: z.string().url().optional().nullable(),
	addressLine1: z.string().optional().nullable(),
	addressLine2: z.string().optional().nullable(),
	city: z.string().optional().nullable(),
	province: z
		.enum([
			"EASTERN_CAPE",
			"FREE_STATE",
			"GAUTENG",
			"KWAZULU_NATAL",
			"LIMPOPO",
			"MPUMALANGA",
			"NORTHERN_CAPE",
			"NORTH_WEST",
			"WESTERN_CAPE",
		])
		.optional()
		.nullable(),
	postalCode: z.string().optional().nullable(),
	logoUrl: z.string().url().optional().nullable(),
	invoicePrefix: z.string().optional(),
	quotePrefix: z.string().optional(),
});

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

// GET /api/businesses/[businessId] - Get a single business
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

		const business = await prisma.business.findUnique({
			where: { id: businessId },
			include: {
				bankAccounts: {
					where: { isActive: true },
					select: {
						id: true,
						name: true,
						bankName: true,
						accountNumber: true,
						currentBalance: true,
					},
				},
				_count: {
					select: {
						customers: true,
						suppliers: true,
						invoices: true,
						transactions: true,
					},
				},
			},
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			business: {
				...business,
				userRole: membership.role,
			},
		});
	} catch (error) {
		console.error("Get business error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId] - Update a business
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

		// Only OWNER and ADMIN can update business
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = updateBusinessSchema.safeParse(body);

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

		const business = await prisma.business.update({
			where: { id: businessId },
			data: parsed.data,
		});

		return NextResponse.json({
			success: true,
			message: "Business updated successfully",
			business,
		});
	} catch (error) {
		console.error("Update business error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId] - Delete a business
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER can delete business
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		await prisma.business.delete({
			where: { id: businessId },
		});

		return NextResponse.json({
			success: true,
			message: "Business deleted successfully",
		});
	} catch (error) {
		console.error("Delete business error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
