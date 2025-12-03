import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { calculatePayslipAmounts } from "@/lib/payroll";
import { prisma } from "@/lib/prisma";
import { updatePayslipSchema } from "@/lib/validations/payroll";

interface RouteContext {
	params: Promise<{ businessId: string; employeeId: string; payslipId: string }>;
}

async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: { userId, businessId },
		},
	});
}

function serializePayslip(payslip: {
	basicSalary: { toNumber: () => number };
	overtime: { toNumber: () => number };
	bonus: { toNumber: () => number };
	commission: { toNumber: () => number };
	allowances: { toNumber: () => number };
	grossPay: { toNumber: () => number };
	paye: { toNumber: () => number };
	uif: { toNumber: () => number };
	pensionEmployee: { toNumber: () => number };
	medicalAid: { toNumber: () => number };
	otherDeductions: { toNumber: () => number };
	totalDeductions: { toNumber: () => number };
	uifEmployer: { toNumber: () => number };
	sdl: { toNumber: () => number };
	pensionEmployer: { toNumber: () => number };
	netPay: { toNumber: () => number };
	[key: string]: unknown;
}) {
	return {
		...payslip,
		basicSalary: payslip.basicSalary.toNumber(),
		overtime: payslip.overtime.toNumber(),
		bonus: payslip.bonus.toNumber(),
		commission: payslip.commission.toNumber(),
		allowances: payslip.allowances.toNumber(),
		grossPay: payslip.grossPay.toNumber(),
		paye: payslip.paye.toNumber(),
		uif: payslip.uif.toNumber(),
		pensionEmployee: payslip.pensionEmployee.toNumber(),
		medicalAid: payslip.medicalAid.toNumber(),
		otherDeductions: payslip.otherDeductions.toNumber(),
		totalDeductions: payslip.totalDeductions.toNumber(),
		uifEmployer: payslip.uifEmployer.toNumber(),
		sdl: payslip.sdl.toNumber(),
		pensionEmployer: payslip.pensionEmployer.toNumber(),
		netPay: payslip.netPay.toNumber(),
	};
}

// GET /api/businesses/[businessId]/employees/[employeeId]/payslips/[payslipId]
export async function GET(_request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId, payslipId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const payslip = await prisma.payslip.findFirst({
			where: { id: payslipId, employeeId },
			include: {
				employee: true,
			},
		});

		if (!payslip) {
			return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
		}

		return NextResponse.json({
			payslip: {
				...serializePayslip(payslip),
				employee: {
					...payslip.employee,
					salaryAmount: payslip.employee.salaryAmount.toNumber(),
				},
			},
		});
	} catch (error) {
		console.error("Payslip GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// PUT /api/businesses/[businessId]/employees/[employeeId]/payslips/[payslipId]
export async function PUT(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId, payslipId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (membership.role === "VIEWER" || membership.role === "MEMBER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const existing = await prisma.payslip.findFirst({
			where: { id: payslipId, employeeId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
		}

		// Can't modify paid payslips
		if (existing.status === "PAID") {
			return NextResponse.json({ error: "Cannot modify paid payslip" }, { status: 400 });
		}

		const body = await request.json();
		const parsed = updatePayslipSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { payDate, status, ...deductions } = parsed.data;

		// If any amounts changed, recalculate
		const hasAmountChanges = Object.keys(deductions).length > 0;
		let updateData: Record<string, unknown> = {};

		if (hasAmountChanges) {
			const basicSalary = existing.basicSalary.toNumber();
			const overtime = deductions.overtime ?? existing.overtime.toNumber();
			const bonus = deductions.bonus ?? existing.bonus.toNumber();
			const commission = deductions.commission ?? existing.commission.toNumber();
			const allowances = deductions.allowances ?? existing.allowances.toNumber();
			const pensionEmployee = deductions.pensionEmployee ?? existing.pensionEmployee.toNumber();
			const medicalAid = deductions.medicalAid ?? existing.medicalAid.toNumber();
			const otherDeductions = deductions.otherDeductions ?? existing.otherDeductions.toNumber();
			const pensionEmployer = deductions.pensionEmployer ?? existing.pensionEmployer.toNumber();

			const calculated = calculatePayslipAmounts({
				basicSalary,
				overtime,
				bonus,
				commission,
				allowances,
				pensionEmployee,
				medicalAid,
				otherDeductions,
				pensionEmployer,
			});

			updateData = {
				overtime,
				bonus,
				commission,
				allowances,
				grossPay: calculated.grossPay,
				paye: calculated.paye,
				uif: calculated.uif,
				pensionEmployee,
				medicalAid,
				otherDeductions,
				totalDeductions: calculated.totalDeductions,
				uifEmployer: calculated.uifEmployer,
				sdl: calculated.sdl,
				pensionEmployer,
				netPay: calculated.netPay,
			};
		}

		if (payDate) updateData.payDate = new Date(payDate);
		if (status) updateData.status = status;

		const payslip = await prisma.payslip.update({
			where: { id: payslipId },
			data: updateData,
		});

		return NextResponse.json({ payslip: serializePayslip(payslip) });
	} catch (error) {
		console.error("Payslip PUT error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/employees/[employeeId]/payslips/[payslipId]
export async function DELETE(_request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, employeeId, payslipId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const existing = await prisma.payslip.findFirst({
			where: { id: payslipId, employeeId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Payslip not found" }, { status: 404 });
		}

		// Can only delete draft payslips
		if (existing.status !== "DRAFT") {
			return NextResponse.json({ error: "Can only delete draft payslips" }, { status: 400 });
		}

		await prisma.payslip.delete({
			where: { id: payslipId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Payslip DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
