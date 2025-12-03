import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
	params: Promise<{ businessId: string }>;
}

// Helper to check business access
async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});
}

// POST /api/businesses/[businessId]/calendar/sync-tax
// Syncs tax period deadlines to calendar events
export async function POST(_request: Request, context: RouteContext) {
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

		// Get all tax periods for this business that are not yet submitted/paid
		const taxPeriods = await prisma.taxPeriod.findMany({
			where: {
				businessId,
				status: {
					in: ["OPEN", "IN_PROGRESS", "READY_TO_SUBMIT"],
				},
			},
		});

		let created = 0;
		let skipped = 0;

		for (const period of taxPeriods) {
			// Check if calendar event already exists for this tax period
			const existingEvent = await prisma.calendarEvent.findFirst({
				where: {
					businessId,
					relatedId: period.id,
					relatedType: "TaxPeriod",
				},
			});

			if (existingEvent) {
				skipped++;
				continue;
			}

			// Create calendar event for the tax deadline
			const typeLabel =
				period.type === "VAT"
					? "VAT201"
					: period.type === "PAYE"
						? "EMP201"
						: period.type === "PROVISIONAL_TAX"
							? "IRP6"
							: period.type;

			await prisma.calendarEvent.create({
				data: {
					businessId,
					userId: session.user.id,
					title: `${typeLabel} Due`,
					description: `Tax period: ${period.startDate.toLocaleDateString()} - ${period.endDate.toLocaleDateString()}`,
					type: "TAX_DEADLINE",
					startDate: period.dueDate,
					allDay: true,
					reminderMinutes: [10080, 4320, 1440], // 7 days, 3 days, 1 day
					relatedId: period.id,
					relatedType: "TaxPeriod",
				},
			});
			created++;
		}

		return NextResponse.json({
			success: true,
			created,
			skipped,
			message: `Created ${created} calendar events, skipped ${skipped} existing`,
		});
	} catch (error) {
		console.error("Sync tax deadlines error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
