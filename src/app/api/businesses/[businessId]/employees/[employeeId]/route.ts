import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEmployeeSchema } from "@/lib/validations/payroll";

interface RouteContext {
	params: Promise<{ businessId: string; employeeId: string }>;
}

async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: { userId, businessId },
		},
	});
}

// GET /api/businesses/[businessId]/employees/[employeeId]
export async function GET(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
			include: {
				payslips: {
					orderBy: { payPeriodEnd: "desc" },
					take: 12,
				},
				_count: {
					select: { payslips: true },
				},
			},
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		return NextResponse.json({
			employee: {
				...employee,
				salaryAmount: employee.salaryAmount.toNumber(),
				payslips: employee.payslips.map((p) => ({
					...p,
					basicSalary: p.basicSalary.toNumber(),
					overtime: p.overtime.toNumber(),
					bonus: p.bonus.toNumber(),
					commission: p.commission.toNumber(),
					allowances: p.allowances.toNumber(),
					grossPay: p.grossPay.toNumber(),
					paye: p.paye.toNumber(),
					uif: p.uif.toNumber(),
					pensionEmployee: p.pensionEmployee.toNumber(),
					medicalAid: p.medicalAid.toNumber(),
					otherDeductions: p.otherDeductions.toNumber(),
					totalDeductions: p.totalDeductions.toNumber(),
					uifEmployer: p.uifEmployer.toNumber(),
					sdl: p.sdl.toNumber(),
					pensionEmployer: p.pensionEmployer.toNumber(),
					netPay: p.netPay.toNumber(),
				})),
			},
		});
	} catch (error) {
		console.error("Employee GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// PUT /api/businesses/[businessId]/employees/[employeeId]
export async function PUT(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (membership.role === "VIEWER" || membership.role === "MEMBER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const existing = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateEmployeeSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { startDate, endDate, email, ...rest } = parsed.data;

		const updateData: Record<string, unknown> = { ...rest };
		if (startDate) updateData.startDate = new Date(startDate);
		if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
		if (email !== undefined) updateData.email = email || null;

		const employee = await prisma.employee.update({
			where: { id: employeeId },
			data: updateData,
		});

		return NextResponse.json({
			employee: {
				...employee,
				salaryAmount: employee.salaryAmount.toNumber(),
			},
		});
	} catch (error) {
		console.error("Employee PUT error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/employees/[employeeId]
export async function DELETE(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const existing = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
			include: { _count: { select: { payslips: true } } },
		});

		if (!existing) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		// If employee has payslips, deactivate instead of delete
		if (existing._count.payslips > 0) {
			await prisma.employee.update({
				where: { id: employeeId },
				data: { isActive: false, endDate: new Date() },
			});
			return NextResponse.json({ success: true, deactivated: true });
		}

		await prisma.employee.delete({
			where: { id: employeeId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Employee DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
