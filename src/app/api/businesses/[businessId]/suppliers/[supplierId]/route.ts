import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSupplierSchema } from "@/lib/validations/supplier";

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

// GET /api/businesses/[businessId]/suppliers/[supplierId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; supplierId: string }> }
) {
	try {
		const { businessId, supplierId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const supplier = await prisma.supplier.findFirst({
			where: { id: supplierId, businessId },
			include: {
				transactions: {
					orderBy: { date: "desc" },
					take: 10,
					select: {
						id: true,
						date: true,
						description: true,
						reference: true,
						amount: true,
						type: true,
						category: {
							select: { name: true },
						},
					},
				},
				_count: {
					select: {
						transactions: true,
					},
				},
			},
		});

		if (!supplier) {
			return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
		}

		// Calculate total paid to this supplier
		const totalPaid = await prisma.transaction.aggregate({
			where: {
				supplierId: supplier.id,
				type: "EXPENSE",
			},
			_sum: {
				amount: true,
			},
		});

		return NextResponse.json({
			success: true,
			supplier: {
				...supplier,
				transactions: supplier.transactions.map((t) => ({
					...t,
					amount: Number(t.amount),
				})),
				totalPaid: Number(totalPaid._sum.amount || 0),
			},
		});
	} catch (error) {
		console.error("Get supplier error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/suppliers/[supplierId]
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; supplierId: string }> }
) {
	try {
		const { businessId, supplierId } = await params;
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

		const existing = await prisma.supplier.findFirst({
			where: { id: supplierId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateSupplierSchema.safeParse(body);

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

		const { email, ...data } = parsed.data;

		const supplier = await prisma.supplier.update({
			where: { id: supplierId },
			data: {
				...data,
				...(email !== undefined && { email: email || null }),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Supplier updated successfully",
			supplier,
		});
	} catch (error) {
		console.error("Update supplier error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/suppliers/[supplierId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; supplierId: string }> }
) {
	try {
		const { businessId, supplierId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.supplier.findFirst({
			where: { id: supplierId, businessId },
			include: {
				_count: {
					select: {
						transactions: true,
					},
				},
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
		}

		// Check if supplier has related records
		if (existing._count.transactions > 0) {
			// Soft delete - mark as inactive instead
			await prisma.supplier.update({
				where: { id: supplierId },
				data: { isActive: false },
			});

			return NextResponse.json({
				success: true,
				message: "Supplier has related transactions and was marked as inactive instead of deleted",
				softDeleted: true,
			});
		}

		await prisma.supplier.delete({
			where: { id: supplierId },
		});

		return NextResponse.json({
			success: true,
			message: "Supplier deleted successfully",
		});
	} catch (error) {
		console.error("Delete supplier error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
