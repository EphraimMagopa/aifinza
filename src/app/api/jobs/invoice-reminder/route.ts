import { type NextRequest, NextResponse } from "next/server";

import { captureException } from "@/lib/error-tracking";
import { prisma } from "@/lib/prisma";
import { type InvoiceReminderJob, verifyQStashSignature } from "@/lib/qstash";

/**
 * POST /api/jobs/invoice-reminder
 * Background job to send invoice payment reminders
 * Called by QStash or manually for testing
 */
export async function POST(request: NextRequest) {
	// Verify the request is from QStash
	const isValid = await verifyQStashSignature(request);
	if (!isValid) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as InvoiceReminderJob;

		// Validate job payload
		if (body.type !== "invoice_reminder" || !body.invoiceId || !body.businessId) {
			return NextResponse.json({ error: "Invalid job payload" }, { status: 400 });
		}

		// Get the invoice with customer details
		const invoice = await prisma.invoice.findUnique({
			where: {
				id: body.invoiceId,
				businessId: body.businessId,
			},
			include: {
				customer: true,
				business: true,
			},
		});

		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Skip if invoice is already paid or cancelled
		if (["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status)) {
			return NextResponse.json({
				success: true,
				message: "Invoice already settled, skipping reminder",
			});
		}

		// Calculate days overdue
		const now = new Date();
		const dueDate = new Date(invoice.dueDate);
		const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

		// TODO: Send reminder email
		// For now, just log the reminder
		console.log(`Invoice reminder for ${invoice.invoiceNumber}:`, {
			customerEmail: invoice.customer.email,
			amount: invoice.total.toString(),
			daysOverdue,
			businessName: invoice.business.name,
		});

		// Update invoice status to overdue if applicable
		if (invoice.status === "SENT" && daysOverdue > 0) {
			await prisma.invoice.update({
				where: { id: invoice.id },
				data: { status: "OVERDUE" },
			});
		}

		return NextResponse.json({
			success: true,
			invoiceId: invoice.id,
			invoiceNumber: invoice.invoiceNumber,
			daysOverdue,
			customerEmail: invoice.customer.email,
		});
	} catch (error) {
		console.error("Invoice reminder job error:", error);
		captureException(error, {
			tags: { job: "invoice_reminder" },
		});
		return NextResponse.json({ error: "Job execution failed" }, { status: 500 });
	}
}
