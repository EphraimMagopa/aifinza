import { type NextRequest, NextResponse } from "next/server";

import { captureException } from "@/lib/error-tracking";
import { prisma } from "@/lib/prisma";
import { type CleanupJob, verifyQStashSignature } from "@/lib/qstash";

/**
 * POST /api/jobs/cleanup
 * Background job for periodic cleanup tasks
 * Called by QStash on a schedule
 */
export async function POST(request: NextRequest) {
	// Verify the request is from QStash
	const isValid = await verifyQStashSignature(request);
	if (!isValid) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as CleanupJob;

		// Validate job payload
		if (body.type !== "cleanup" || !body.task) {
			return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
		}

		let result: { deleted: number; task: string };

		switch (body.task) {
			case "expired_sessions": {
				// Delete expired sessions (older than 30 days)
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

				const deleteResult = await prisma.session.deleteMany({
					where: {
						expires: { lt: thirtyDaysAgo },
					},
				});

				result = { deleted: deleteResult.count, task: "expired_sessions" };
				break;
			}

			case "expired_quotes": {
				// Mark expired quotes (past expiry date and still SENT status)
				const now = new Date();

				const updateResult = await prisma.quote.updateMany({
					where: {
						status: "SENT",
						expiryDate: { lt: now },
					},
					data: {
						status: "EXPIRED",
					},
				});

				result = { deleted: updateResult.count, task: "expired_quotes" };
				break;
			}

			case "old_audit_logs": {
				// Delete audit logs older than 1 year (configurable)
				const retentionDays = Number.parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || "365", 10);
				const cutoffDate = new Date();
				cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

				const deleteResult = await prisma.auditLog.deleteMany({
					where: {
						createdAt: { lt: cutoffDate },
					},
				});

				result = { deleted: deleteResult.count, task: "old_audit_logs" };
				break;
			}

			default:
				return NextResponse.json({ error: `Unknown cleanup task: ${body.task}` }, { status: 400 });
		}

		console.log(`Cleanup job completed:`, result);

		return NextResponse.json({
			success: true,
			...result,
		});
	} catch (error) {
		console.error("Cleanup job error:", error);
		captureException(error, {
			tags: { job: "cleanup" },
		});
		return NextResponse.json({ error: "Job execution failed" }, { status: 500 });
	}
}
