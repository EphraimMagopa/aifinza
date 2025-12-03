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

// GET /api/businesses/[businessId]/tax/summary
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

		// Get business details
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			select: {
				isVatRegistered: true,
				vatNumber: true,
				vatCycle: true,
				financialYearEnd: true,
			},
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Get current financial year dates
		const now = new Date();
		const currentYear = now.getFullYear();
		const fyeMonth = business.financialYearEnd || 2; // Default to February

		let yearStart: Date;
		let yearEnd: Date;

		if (now.getMonth() + 1 >= fyeMonth) {
			// We're in the current FY
			yearStart = new Date(currentYear, fyeMonth - 1, 1);
			yearEnd = new Date(currentYear + 1, fyeMonth - 1, 0);
		} else {
			// We're in the previous FY
			yearStart = new Date(currentYear - 1, fyeMonth - 1, 1);
			yearEnd = new Date(currentYear, fyeMonth - 1, 0);
		}

		// Get tax periods for this business
		const taxPeriods = await prisma.taxPeriod.findMany({
			where: {
				businessId,
				startDate: { gte: yearStart },
			},
			orderBy: { endDate: "desc" },
		});

		// Find current open period
		const currentPeriod = taxPeriods.find((p) => p.status === "OPEN" || p.status === "IN_PROGRESS");

		// Calculate year-to-date VAT
		const yearToDateVat = taxPeriods
			.filter((p) => p.status === "SUBMITTED" && p.vatPayable !== null)
			.reduce((sum, p) => sum + Number(p.vatPayable), 0);

		// Generate upcoming deadlines
		const upcomingDeadlines: { type: string; dueDate: string; description: string }[] = [];

		// VAT deadline (25th of month after period end for bi-monthly)
		if (business.isVatRegistered) {
			const vatDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 25);
			if (vatDeadline > now) {
				upcomingDeadlines.push({
					type: "VAT201",
					dueDate: vatDeadline.toISOString(),
					description: "VAT Return Submission",
				});
			}
		}

		// Provisional tax deadlines (31 Aug, 28 Feb for most businesses)
		const provTax1 = new Date(currentYear, 7, 31); // August 31
		const provTax2 = new Date(currentYear + 1, 1, 28); // February 28

		if (provTax1 > now) {
			upcomingDeadlines.push({
				type: "IRP6",
				dueDate: provTax1.toISOString(),
				description: "1st Provisional Tax Payment",
			});
		}

		if (provTax2 > now) {
			upcomingDeadlines.push({
				type: "IRP6",
				dueDate: provTax2.toISOString(),
				description: "2nd Provisional Tax Payment",
			});
		}

		// Annual tax return deadline (typically within 12 months of year end)
		const annualDeadline = new Date(yearEnd);
		annualDeadline.setMonth(annualDeadline.getMonth() + 12);
		if (annualDeadline > now) {
			upcomingDeadlines.push({
				type: "ITR14",
				dueDate: annualDeadline.toISOString(),
				description: "Annual Income Tax Return",
			});
		}

		// Sort by date
		upcomingDeadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

		return NextResponse.json({
			success: true,
			summary: {
				vatRegistered: business.isVatRegistered,
				vatNumber: business.vatNumber,
				vatCycle: business.vatCycle,
				currentPeriod: currentPeriod
					? {
							id: currentPeriod.id,
							type: currentPeriod.type,
							startDate: currentPeriod.startDate.toISOString(),
							endDate: currentPeriod.endDate.toISOString(),
							dueDate: currentPeriod.dueDate.toISOString(),
							status: currentPeriod.status,
						}
					: null,
				upcomingDeadlines: upcomingDeadlines.slice(0, 5),
				yearToDateVat,
				yearToDateIncomeTax: 0, // Would need income tax periods to calculate
			},
		});
	} catch (error) {
		console.error("Get tax summary error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
