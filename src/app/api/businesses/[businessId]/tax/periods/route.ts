import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaxPeriodSchema } from "@/lib/validations/tax";

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

// GET /api/businesses/[businessId]/tax/periods
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

		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const status = searchParams.get("status");
		const year = searchParams.get("year");

		type TaxType = "VAT" | "PAYE" | "PROVISIONAL_TAX" | "ANNUAL_TAX" | "EMP501" | "SDL" | "UIF";
		type TaxStatus = "OPEN" | "IN_PROGRESS" | "READY_TO_SUBMIT" | "SUBMITTED" | "PAID" | "OVERDUE";

		const where: {
			businessId: string;
			type?: TaxType;
			status?: TaxStatus;
			startDate?: { gte: Date };
			endDate?: { lte: Date };
		} = { businessId };

		const validTypes: TaxType[] = [
			"VAT",
			"PAYE",
			"PROVISIONAL_TAX",
			"ANNUAL_TAX",
			"EMP501",
			"SDL",
			"UIF",
		];
		const validStatuses: TaxStatus[] = [
			"OPEN",
			"IN_PROGRESS",
			"READY_TO_SUBMIT",
			"SUBMITTED",
			"PAID",
			"OVERDUE",
		];

		if (type && validTypes.includes(type as TaxType)) where.type = type as TaxType;
		if (status && validStatuses.includes(status as TaxStatus)) where.status = status as TaxStatus;
		if (year) {
			const yearNum = Number.parseInt(year, 10);
			where.startDate = { gte: new Date(yearNum, 0, 1) };
			where.endDate = { lte: new Date(yearNum, 11, 31) };
		}

		const periods = await prisma.taxPeriod.findMany({
			where,
			orderBy: { endDate: "desc" },
		});

		return NextResponse.json({
			success: true,
			periods: periods.map((p) => ({
				id: p.id,
				type: p.type,
				startDate: p.startDate.toISOString(),
				endDate: p.endDate.toISOString(),
				dueDate: p.dueDate.toISOString(),
				status: p.status,
				vatOutput: p.outputVat ? Number(p.outputVat) : null,
				vatInput: p.inputVat ? Number(p.inputVat) : null,
				vatPayable: p.vatPayable ? Number(p.vatPayable) : null,
				submittedAt: p.submittedAt?.toISOString() || null,
				referenceNumber: p.reference,
			})),
		});
	} catch (error) {
		console.error("Get tax periods error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/tax/periods
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
		const parsed = createTaxPeriodSchema.safeParse(body);

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

		const { type, startDate, endDate, dueDate } = parsed.data;

		// Check for overlapping periods
		const existing = await prisma.taxPeriod.findFirst({
			where: {
				businessId,
				type,
				OR: [
					{
						startDate: { lte: new Date(endDate) },
						endDate: { gte: new Date(startDate) },
					},
				],
			},
		});

		if (existing) {
			return NextResponse.json(
				{ error: "A tax period already exists for this date range" },
				{ status: 400 }
			);
		}

		const period = await prisma.taxPeriod.create({
			data: {
				businessId,
				type,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				dueDate: new Date(dueDate),
				status: "OPEN",
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Tax period created successfully",
				period: {
					id: period.id,
					type: period.type,
					startDate: period.startDate.toISOString(),
					endDate: period.endDate.toISOString(),
					dueDate: period.dueDate.toISOString(),
					status: period.status,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create tax period error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
