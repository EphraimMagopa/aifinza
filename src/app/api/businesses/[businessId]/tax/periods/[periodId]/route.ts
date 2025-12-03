import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaxPeriodSchema } from "@/lib/validations/tax";

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

// GET /api/businesses/[businessId]/tax/periods/[periodId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; periodId: string }> }
) {
	try {
		const { businessId, periodId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const period = await prisma.taxPeriod.findFirst({
			where: { id: periodId, businessId },
		});

		if (!period) {
			return NextResponse.json({ error: "Tax period not found" }, { status: 404 });
		}

		// If it's a VAT period, calculate the VAT from transactions
		let calculatedVat = null;
		if (period.type === "VAT") {
			// Get invoices for output VAT
			const invoices = await prisma.invoice.findMany({
				where: {
					businessId,
					issueDate: { gte: period.startDate, lte: period.endDate },
					status: { notIn: ["DRAFT", "CANCELLED"] },
				},
				include: { lineItems: true },
			});

			// Get expenses for input VAT
			const expenses = await prisma.transaction.findMany({
				where: {
					businessId,
					date: { gte: period.startDate, lte: period.endDate },
					type: "EXPENSE",
				},
			});

			// Calculate output VAT
			let outputVat = 0;
			for (const invoice of invoices) {
				for (const lineItem of invoice.lineItems) {
					outputVat += Number(lineItem.vatAmount);
				}
			}

			// Calculate input VAT (simplified - assumes all expenses are VAT inclusive at 15%)
			let inputVat = 0;
			for (const expense of expenses) {
				const amount = Math.abs(Number(expense.amount));
				inputVat += amount - amount / 1.15;
			}

			calculatedVat = {
				outputVat,
				inputVat,
				netVat: outputVat - inputVat,
			};
		}

		return NextResponse.json({
			success: true,
			period: {
				id: period.id,
				type: period.type,
				startDate: period.startDate.toISOString(),
				endDate: period.endDate.toISOString(),
				dueDate: period.dueDate.toISOString(),
				status: period.status,
				vatOutput: period.outputVat ? Number(period.outputVat) : null,
				vatInput: period.inputVat ? Number(period.inputVat) : null,
				vatPayable: period.vatPayable ? Number(period.vatPayable) : null,
				submittedAt: period.submittedAt?.toISOString() || null,
				referenceNumber: period.reference,
				notes: period.notes,
			},
			calculatedVat,
		});
	} catch (error) {
		console.error("Get tax period error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/tax/periods/[periodId]
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; periodId: string }> }
) {
	try {
		const { businessId, periodId } = await params;
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

		const existing = await prisma.taxPeriod.findFirst({
			where: { id: periodId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Tax period not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateTaxPeriodSchema.safeParse(body);

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

		const { submittedAt, reference, ...data } = parsed.data;

		const updateData: Record<string, unknown> = { ...data };

		if (reference !== undefined) {
			updateData.reference = reference;
		}

		if (submittedAt) {
			updateData.submittedAt = new Date(submittedAt);
		}

		// If status is being set to SUBMITTED, set submittedAt
		if (data.status === "SUBMITTED" && !existing.submittedAt && !submittedAt) {
			updateData.submittedAt = new Date();
		}

		const period = await prisma.taxPeriod.update({
			where: { id: periodId },
			data: updateData,
		});

		return NextResponse.json({
			success: true,
			message: "Tax period updated successfully",
			period: {
				id: period.id,
				type: period.type,
				startDate: period.startDate.toISOString(),
				endDate: period.endDate.toISOString(),
				dueDate: period.dueDate.toISOString(),
				status: period.status,
				vatOutput: period.outputVat ? Number(period.outputVat) : null,
				vatInput: period.inputVat ? Number(period.inputVat) : null,
				vatPayable: period.vatPayable ? Number(period.vatPayable) : null,
				submittedAt: period.submittedAt?.toISOString() || null,
				referenceNumber: period.reference,
			},
		});
	} catch (error) {
		console.error("Update tax period error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/tax/periods/[periodId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; periodId: string }> }
) {
	try {
		const { businessId, periodId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.taxPeriod.findFirst({
			where: { id: periodId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Tax period not found" }, { status: 404 });
		}

		// Don't allow deleting submitted or paid periods
		if (existing.status === "SUBMITTED" || existing.status === "PAID") {
			return NextResponse.json({ error: "Cannot delete a submitted tax period" }, { status: 400 });
		}

		await prisma.taxPeriod.delete({
			where: { id: periodId },
		});

		return NextResponse.json({
			success: true,
			message: "Tax period deleted successfully",
		});
	} catch (error) {
		console.error("Delete tax period error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
