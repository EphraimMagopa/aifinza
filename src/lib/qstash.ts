import { Client, Receiver } from "@upstash/qstash";
import type { NextRequest } from "next/server";

// QStash client for publishing jobs
const qstashClient = process.env.QSTASH_TOKEN
	? new Client({ token: process.env.QSTASH_TOKEN })
	: null;

// QStash receiver for verifying incoming webhooks
const qstashReceiver =
	process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
		? new Receiver({
				currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
				nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
			})
		: null;

/**
 * Get the base URL for job endpoints
 */
function getBaseUrl(): string {
	if (process.env.NEXT_PUBLIC_APP_URL) {
		return process.env.NEXT_PUBLIC_APP_URL;
	}
	if (process.env.VERCEL_URL) {
		return `https://${process.env.VERCEL_URL}`;
	}
	return "http://localhost:3000";
}

/**
 * Verify that a request came from QStash
 */
export async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
	if (!qstashReceiver) {
		console.warn("QStash receiver not configured, skipping verification");
		// In development without QStash, allow requests
		return process.env.NODE_ENV === "development";
	}

	const signature = request.headers.get("upstash-signature");
	if (!signature) {
		return false;
	}

	const body = await request.text();

	try {
		await qstashReceiver.verify({
			signature,
			body,
		});
		return true;
	} catch (error) {
		console.error("QStash signature verification failed:", error);
		return false;
	}
}

/**
 * Schedule a job to run immediately
 */
export async function publishJob<T>(
	endpoint: string,
	data: T,
	options?: {
		delay?: number; // Delay in seconds
		retries?: number;
		deduplicationId?: string;
	}
) {
	if (!qstashClient) {
		console.warn("QStash not configured, job not published:", endpoint);
		return null;
	}

	const url = `${getBaseUrl()}${endpoint}`;

	return qstashClient.publishJSON({
		url,
		body: data,
		delay: options?.delay,
		retries: options?.retries ?? 3,
		deduplicationId: options?.deduplicationId,
	});
}

/**
 * Schedule a recurring job (cron)
 */
export async function scheduleJob<T>(
	endpoint: string,
	data: T,
	cron: string, // Cron expression (e.g., "0 9 * * *" for 9am daily)
	scheduleId: string
) {
	if (!qstashClient) {
		console.warn("QStash not configured, job not scheduled:", endpoint);
		return null;
	}

	const url = `${getBaseUrl()}${endpoint}`;

	return qstashClient.schedules.create({
		scheduleId,
		destination: url,
		cron,
		body: JSON.stringify(data),
		headers: {
			"Content-Type": "application/json",
		},
		retries: 3,
	});
}

/**
 * Delete a scheduled job
 */
export async function deleteSchedule(scheduleId: string) {
	if (!qstashClient) {
		console.warn("QStash not configured");
		return null;
	}

	return qstashClient.schedules.delete(scheduleId);
}

/**
 * List all scheduled jobs
 */
export async function listSchedules() {
	if (!qstashClient) {
		console.warn("QStash not configured");
		return [];
	}

	return qstashClient.schedules.list();
}

// Job types for type safety
export interface InvoiceReminderJob {
	type: "invoice_reminder";
	invoiceId: string;
	businessId: string;
}

export interface TaxDeadlineJob {
	type: "tax_deadline";
	taxPeriodId: string;
	businessId: string;
	daysUntilDue: number;
}

export interface CleanupJob {
	type: "cleanup";
	task: "expired_sessions" | "expired_quotes" | "old_audit_logs";
}

export type JobPayload = InvoiceReminderJob | TaxDeadlineJob | CleanupJob;

// Export client for advanced usage
export { qstashClient };
