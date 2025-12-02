import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations/category";

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

// PATCH /api/businesses/[businessId]/categories/[categoryId] - Update category
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
	try {
		const { businessId, categoryId } = await params;
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

		const existing = await prisma.category.findFirst({
			where: { id: categoryId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Category not found" }, { status: 404 });
		}

		if (existing.isSystem) {
			return NextResponse.json({ error: "Cannot edit system categories" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = updateCategorySchema.safeParse(body);

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

		// Check if new name already exists (if name is being changed)
		if (parsed.data.name && parsed.data.name !== existing.name) {
			const duplicate = await prisma.category.findFirst({
				where: { businessId, name: parsed.data.name },
			});
			if (duplicate) {
				return NextResponse.json(
					{ success: false, error: "A category with this name already exists" },
					{ status: 400 }
				);
			}
		}

		const category = await prisma.category.update({
			where: { id: categoryId },
			data: parsed.data,
		});

		return NextResponse.json({
			success: true,
			message: "Category updated successfully",
			category,
		});
	} catch (error) {
		console.error("Update category error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/categories/[categoryId] - Delete category
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; categoryId: string }> }
) {
	try {
		const { businessId, categoryId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.category.findFirst({
			where: { id: categoryId, businessId },
			include: {
				_count: { select: { transactions: true, children: true } },
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Category not found" }, { status: 404 });
		}

		if (existing.isSystem) {
			return NextResponse.json({ error: "Cannot delete system categories" }, { status: 403 });
		}

		if (existing._count.transactions > 0) {
			return NextResponse.json(
				{
					success: false,
					error: `Cannot delete category with ${existing._count.transactions} transactions. Reassign them first.`,
				},
				{ status: 400 }
			);
		}

		if (existing._count.children > 0) {
			return NextResponse.json(
				{
					success: false,
					error: "Cannot delete category with subcategories. Delete them first.",
				},
				{ status: 400 }
			);
		}

		await prisma.category.delete({
			where: { id: categoryId },
		});

		return NextResponse.json({
			success: true,
			message: "Category deleted successfully",
		});
	} catch (error) {
		console.error("Delete category error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
