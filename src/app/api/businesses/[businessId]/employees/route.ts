import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEmployeeSchema } from "@/lib/validations/payroll";

interface RouteContext {
	params: Promise<{ businessId: string }>;
}

async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: { userId, businessId },
		},
	});
}

// GET /api/businesses/[businessId]/employees - List employees
export async function GET(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search");
		const activeOnly = searchParams.get("activeOnly") === "true";
		const department = searchParams.get("department");

		const where: {
			businessId: string;
			isActive?: boolean;
			department?: string;
			OR?: Array<{
				firstName?: { contains: string; mode: "insensitive" };
				lastName?: { contains: string; mode: "insensitive" };
				email?: { contains: string; mode: "insensitive" };
				employeeNumber?: { contains: string; mode: "insensitive" };
			}>;
		} = { businessId };

		if (activeOnly) {
			where.isActive = true;
		}

		if (department) {
			where.department = department;
		}

		if (search) {
			where.OR = [
				{ firstName: { contains: search, mode: "insensitive" } },
				{ lastName: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
				{ employeeNumber: { contains: search, mode: "insensitive" } },
			];
		}

		const employees = await prisma.employee.findMany({
			where,
			orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
			include: {
				_count: {
					select: { payslips: true },
				},
			},
		});

		// Convert Decimal to number for JSON serialization
		const serializedEmployees = employees.map((emp) => ({
			...emp,
			salaryAmount: emp.salaryAmount.toNumber(),
		}));

		return NextResponse.json({ employees: serializedEmployees });
	} catch (error) {
		console.error("Employees GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/employees - Create employee
export async function POST(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Check permissions
		if (membership.role === "VIEWER" || membership.role === "MEMBER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createEmployeeSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { startDate, endDate, email, ...rest } = parsed.data;

		const employee = await prisma.employee.create({
			data: {
				...rest,
				businessId,
				email: email || null,
				startDate: new Date(startDate),
				endDate: endDate ? new Date(endDate) : null,
			},
		});

		return NextResponse.json(
			{
				employee: {
					...employee,
					salaryAmount: employee.salaryAmount.toNumber(),
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Employee POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
