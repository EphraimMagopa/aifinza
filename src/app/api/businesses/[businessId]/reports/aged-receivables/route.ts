import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to check if user has access to business
async function checkBusinessAccess(userId: string, businessId: string) {
	const membership = await prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});

	return membership;
}

// GET /api/businesses/[businessId]/reports/aged-receivables
export async function GET(
	_request: Request,
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

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get all unpaid/partially paid invoices
		const invoices = await prisma.invoice.findMany({
			where: {
				businessId,
				status: {
					notIn: ["PAID", "CANCELLED", "WRITTEN_OFF", "DRAFT"],
				},
			},
			include: {
				customer: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		// Group by customer and calculate aging buckets
		const customerAgingMap = new Map<
			string,
			{
				customerId: string;
				customerName: string;
				current: number;
				days30: number;
				days60: number;
				days90: number;
				days120Plus: number;
				total: number;
			}
		>();

		for (const invoice of invoices) {
			const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
			if (outstanding <= 0) continue;

			const dueDate = new Date(invoice.dueDate);
			dueDate.setHours(0, 0, 0, 0);
			const daysPastDue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

			const customerId = invoice.customer.id;
			const customerName = invoice.customer.name;

			let existing = customerAgingMap.get(customerId);
			if (!existing) {
				existing = {
					customerId,
					customerName,
					current: 0,
					days30: 0,
					days60: 0,
					days90: 0,
					days120Plus: 0,
					total: 0,
				};
				customerAgingMap.set(customerId, existing);
			}

			// Categorize by days past due
			if (daysPastDue <= 0) {
				existing.current += outstanding;
			} else if (daysPastDue <= 30) {
				existing.days30 += outstanding;
			} else if (daysPastDue <= 60) {
				existing.days60 += outstanding;
			} else if (daysPastDue <= 90) {
				existing.days90 += outstanding;
			} else {
				existing.days120Plus += outstanding;
			}

			existing.total += outstanding;
		}

		// Convert to array and sort by total descending
		const customers = Array.from(customerAgingMap.values()).sort((a, b) => b.total - a.total);

		// Calculate totals
		const totals = customers.reduce(
			(acc, customer) => {
				acc.current += customer.current;
				acc.days30 += customer.days30;
				acc.days60 += customer.days60;
				acc.days90 += customer.days90;
				acc.days120Plus += customer.days120Plus;
				acc.total += customer.total;
				return acc;
			},
			{
				current: 0,
				days30: 0,
				days60: 0,
				days90: 0,
				days120Plus: 0,
				total: 0,
			}
		);

		return NextResponse.json({
			success: true,
			report: {
				customers,
				totals,
			},
			asOf: today.toISOString(),
		});
	} catch (error) {
		console.error("Get aged receivables report error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
