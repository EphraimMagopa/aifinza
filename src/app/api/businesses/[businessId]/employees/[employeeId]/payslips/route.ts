import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { calculatePayslipAmounts } from "@/lib/payroll";
import { prisma } from "@/lib/prisma";
import { createPayslipSchema } from "@/lib/validations/payroll";

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

// GET /api/businesses/[businessId]/employees/[employeeId]/payslips
export async function GET(_request: Request, context: RouteContext) {
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

		// Verify employee belongs to business
		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const payslips = await prisma.payslip.findMany({
			where: { employeeId },
			orderBy: { payPeriodEnd: "desc" },
		});

		const serializedPayslips = payslips.map((p) => ({
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
		}));

		return NextResponse.json({ payslips: serializedPayslips });
	} catch (error) {
		console.error("Payslips GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/employees/[employeeId]/payslips
export async function POST(request: Request, context: RouteContext) {
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

		const employee = await prisma.employee.findFirst({
			where: { id: employeeId, businessId },
		});

		if (!employee) {
			return NextResponse.json({ error: "Employee not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = createPayslipSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const {
			payPeriodStart,
			payPeriodEnd,
			payDate,
			basicSalary,
			overtime = 0,
			bonus = 0,
			commission = 0,
			allowances = 0,
			pensionEmployee = 0,
			medicalAid = 0,
			otherDeductions = 0,
			pensionEmployer = 0,
		} = parsed.data;

		// Calculate payroll amounts
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

		const payslip = await prisma.payslip.create({
			data: {
				employeeId,
				payPeriodStart: new Date(payPeriodStart),
				payPeriodEnd: new Date(payPeriodEnd),
				payDate: new Date(payDate),
				basicSalary,
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
				status: "DRAFT",
			},
		});

		return NextResponse.json(
			{
				payslip: {
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
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Payslip POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
