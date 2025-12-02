import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCustomerSchema } from "@/lib/validations/customer";

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

// GET /api/businesses/[businessId]/customers/[customerId]
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
	try {
		const { businessId, customerId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const customer = await prisma.customer.findFirst({
			where: { id: customerId, businessId },
			include: {
				invoices: {
					orderBy: { issueDate: "desc" },
					take: 10,
					select: {
						id: true,
						invoiceNumber: true,
						status: true,
						issueDate: true,
						dueDate: true,
						total: true,
						amountPaid: true,
					},
				},
				_count: {
					select: {
						invoices: true,
						quotes: true,
						transactions: true,
					},
				},
			},
		});

		if (!customer) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		// Calculate outstanding balance
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

		const outstandingBalance =
			Number(outstandingInvoices._sum.total || 0) -
			Number(outstandingInvoices._sum.amountPaid || 0);

		// Calculate total revenue from this customer
		const totalRevenue = await prisma.invoice.aggregate({
			where: {
				customerId: customer.id,
				status: { in: ["PAID", "PARTIALLY_PAID"] },
			},
			_sum: {
				amountPaid: true,
			},
		});

		return NextResponse.json({
			success: true,
			customer: {
				...customer,
				creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
				invoices: customer.invoices.map((inv) => ({
					...inv,
					total: Number(inv.total),
					amountPaid: Number(inv.amountPaid),
				})),
				outstandingBalance,
				totalRevenue: Number(totalRevenue._sum.amountPaid || 0),
			},
		});
	} catch (error) {
		console.error("Get customer error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// PATCH /api/businesses/[businessId]/customers/[customerId]
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
	try {
		const { businessId, customerId } = await params;
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

		const existing = await prisma.customer.findFirst({
			where: { id: customerId, businessId },
		});

		if (!existing) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateCustomerSchema.safeParse(body);

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

		const customer = await prisma.customer.update({
			where: { id: customerId },
			data: {
				...data,
				...(email !== undefined && { email: email || null }),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Customer updated successfully",
			customer: {
				...customer,
				creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
			},
		});
	} catch (error) {
		console.error("Update customer error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/customers/[customerId]
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; customerId: string }> }
) {
	try {
		const { businessId, customerId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const existing = await prisma.customer.findFirst({
			where: { id: customerId, businessId },
			include: {
				_count: {
					select: {
						invoices: true,
						quotes: true,
						transactions: true,
					},
				},
			},
		});

		if (!existing) {
			return NextResponse.json({ error: "Customer not found" }, { status: 404 });
		}

		// Check if customer has related records
		const hasRelatedRecords =
			existing._count.invoices > 0 ||
			existing._count.quotes > 0 ||
			existing._count.transactions > 0;

		if (hasRelatedRecords) {
			// Soft delete - mark as inactive instead
			await prisma.customer.update({
				where: { id: customerId },
				data: { isActive: false },
			});

			return NextResponse.json({
				success: true,
				message: "Customer has related records and was marked as inactive instead of deleted",
				softDeleted: true,
			});
		}

		await prisma.customer.delete({
			where: { id: customerId },
		});

		return NextResponse.json({
			success: true,
			message: "Customer deleted successfully",
		});
	} catch (error) {
		console.error("Delete customer error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
