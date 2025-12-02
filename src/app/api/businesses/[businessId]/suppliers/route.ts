import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupplierSchema } from "@/lib/validations/supplier";

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

// GET /api/businesses/[businessId]/suppliers - Get all suppliers
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
		const search = searchParams.get("search");
		const isActive = searchParams.get("isActive");
		const limit = searchParams.get("limit");
		const offset = searchParams.get("offset");

		const where: {
			businessId: string;
			isActive?: boolean;
			OR?: Array<{
				name?: { contains: string; mode: "insensitive" };
				email?: { contains: string; mode: "insensitive" };
			}>;
		} = {
			businessId,
		};

		if (isActive !== null) {
			where.isActive = isActive === "true";
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		const [suppliers, total] = await Promise.all([
			prisma.supplier.findMany({
				where,
				orderBy: { name: "asc" },
				take: limit ? Number.parseInt(limit, 10) : undefined,
				skip: offset ? Number.parseInt(offset, 10) : undefined,
				include: {
					_count: {
						select: {
							transactions: true,
						},
					},
				},
			}),
			prisma.supplier.count({ where }),
		]);

		// Calculate total paid to each supplier
		const suppliersWithPayments = await Promise.all(
			suppliers.map(async (supplier) => {
				const totalPaid = await prisma.transaction.aggregate({
					where: {
						supplierId: supplier.id,
						type: "EXPENSE",
					},
					_sum: {
						amount: true,
					},
				});

				return {
					...supplier,
					totalPaid: Number(totalPaid._sum.amount || 0),
				};
			})
		);

		return NextResponse.json({
			success: true,
			suppliers: suppliersWithPayments,
			total,
		});
	} catch (error) {
		console.error("Get suppliers error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/suppliers - Create supplier
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
		const parsed = createSupplierSchema.safeParse(body);

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

		const supplier = await prisma.supplier.create({
			data: {
				...data,
				email: email || null,
				businessId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Supplier created successfully",
				supplier,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create supplier error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
