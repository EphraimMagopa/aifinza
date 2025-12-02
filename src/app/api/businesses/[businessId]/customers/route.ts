import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCustomerSchema } from "@/lib/validations/customer";

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

// GET /api/businesses/[businessId]/customers - Get all customers
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

		const [customers, total] = await Promise.all([
			prisma.customer.findMany({
				where,
				orderBy: { name: "asc" },
				take: limit ? Number.parseInt(limit, 10) : undefined,
				skip: offset ? Number.parseInt(offset, 10) : undefined,
				include: {
					_count: {
						select: {
							invoices: true,
							transactions: true,
						},
					},
				},
			}),
			prisma.customer.count({ where }),
		]);

		// Calculate outstanding balance for each customer
		const customersWithBalance = await Promise.all(
			customers.map(async (customer) => {
				const outstandingInvoices = await prisma.invoice.aggregate({
					where: {
						customerId: customer.id,
						status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
					},
					_sum: {
						total: true,
						amountPaid: true,
					},
				});

				const totalOutstanding =
					Number(outstandingInvoices._sum.total || 0) -
					Number(outstandingInvoices._sum.amountPaid || 0);

				return {
					...customer,
					creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
					outstandingBalance: totalOutstanding,
				};
			})
		);

		return NextResponse.json({
			success: true,
			customers: customersWithBalance,
			total,
		});
	} catch (error) {
		console.error("Get customers error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/customers - Create customer
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
		const parsed = createCustomerSchema.safeParse(body);

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

		const customer = await prisma.customer.create({
			data: {
				...data,
				email: email || null,
				businessId,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Customer created successfully",
				customer: {
					...customer,
					creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create customer error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
