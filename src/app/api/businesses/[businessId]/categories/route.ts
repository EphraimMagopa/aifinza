import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations/category";

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

// GET /api/businesses/[businessId]/categories - Get all categories
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

		const categories = await prisma.category.findMany({
			where: {
				businessId,
				...(type && { type: type as "INCOME" | "EXPENSE" | "TRANSFER" | "JOURNAL" }),
			},
			include: {
				_count: { select: { transactions: true } },
				children: {
					include: { _count: { select: { transactions: true } } },
				},
			},
			orderBy: { name: "asc" },
		});

		// Flatten for list view while preserving hierarchy info
		return NextResponse.json({
			success: true,
			categories: categories.map((c) => ({
				id: c.id,
				name: c.name,
				type: c.type,
				color: c.color,
				isSystem: c.isSystem,
				parentId: c.parentId,
				transactionCount: c._count.transactions,
				children: c.children.map((child) => ({
					id: child.id,
					name: child.name,
					type: child.type,
					color: child.color,
					parentId: child.parentId,
					transactionCount: child._count.transactions,
				})),
			})),
		});
	} catch (error) {
		console.error("Get categories error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/categories - Create a category
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
		const parsed = createCategorySchema.safeParse(body);

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

		// Check if category name already exists
		const existing = await prisma.category.findFirst({
			where: { businessId, name: parsed.data.name },
		});

		if (existing) {
			return NextResponse.json(
				{ success: false, error: "A category with this name already exists" },
				{ status: 400 }
			);
		}

		const category = await prisma.category.create({
			data: {
				...parsed.data,
				businessId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Category created successfully",
				category,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create category error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
