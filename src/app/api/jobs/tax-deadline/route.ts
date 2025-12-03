import { type NextRequest, NextResponse } from "next/server";

import { captureException } from "@/lib/error-tracking";
import { prisma } from "@/lib/prisma";
import { type TaxDeadlineJob, verifyQStashSignature } from "@/lib/qstash";

/**
 * POST /api/jobs/tax-deadline
 * Background job to send tax deadline notifications
 * Called by QStash or manually for testing
 */
export async function POST(request: NextRequest) {
	// Verify the request is from QStash
	const isValid = await verifyQStashSignature(request);
	if (!isValid) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as TaxDeadlineJob;

		// Validate job payload
		if (body.type !== "tax_deadline" || !body.taxPeriodId || !body.businessId) {
			return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
		}

		// Get the tax period with business details
		const taxPeriod = await prisma.taxPeriod.findUnique({
			where: {
				id: body.taxPeriodId,
				businessId: body.businessId,
			},
			include: {
				business: {
					include: {
						users: {
							where: { role: { in: ["OWNER", "ADMIN", "ACCOUNTANT"] } },
							include: { user: true },
						},
					},
				},
			},
		});

		if (!taxPeriod) {
			return NextResponse.json({ error: "Tax period not found" }, { status: 404 });
		}

		// Skip if tax period is already submitted
		if (["SUBMITTED", "PAID"].includes(taxPeriod.status)) {
			return NextResponse.json({
				success: true,
				message: "Tax period already submitted, skipping notification",
			});
		}

		// Get recipient emails
		const recipients = taxPeriod.business.users
			.map((bu) => bu.user.email)
			.filter((email): email is string => !!email);

		// TODO: Send notification email
		// For now, just log the notification
		console.log(`Tax deadline notification for ${taxPeriod.type}:`, {
			businessName: taxPeriod.business.name,
			dueDate: taxPeriod.dueDate,
			daysUntilDue: body.daysUntilDue,
			recipients,
			taxType: taxPeriod.type,
			status: taxPeriod.status,
		});

		return NextResponse.json({
			success: true,
			taxPeriodId: taxPeriod.id,
			taxType: taxPeriod.type,
			dueDate: taxPeriod.dueDate,
			daysUntilDue: body.daysUntilDue,
			recipientCount: recipients.length,
		});
	} catch (error) {
		console.error("Tax deadline job error:", error);
		captureException(error, {
			tags: { job: "tax_deadline" },
		});
		return NextResponse.json({ error: "Job execution failed" }, { status: 500 });
	}
}
