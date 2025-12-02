import { z } from "zod";

export const invoiceStatusOptions = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SENT", label: "Sent" },
	{ value: "VIEWED", label: "Viewed" },
	{ value: "PARTIALLY_PAID", label: "Partially Paid" },
	{ value: "PAID", label: "Paid" },
	{ value: "OVERDUE", label: "Overdue" },
	{ value: "CANCELLED", label: "Cancelled" },
	{ value: "WRITTEN_OFF", label: "Written Off" },
] as const;

export const invoiceLineItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unitPrice: z.number().min(0, "Unit price cannot be negative"),
	vatRate: z.number().min(0).max(100),
});

export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>;

export const createInvoiceSchema = z.object({
	customerId: z.string().min(1, "Customer is required"),
	reference: z.string().optional().nullable(),
	dueDate: z.string().min(1, "Due date is required"),
	discount: z.number().min(0),
	notes: z.string().optional().nullable(),
	terms: z.string().optional().nullable(),
	lineItems: z.array(invoiceLineItemSchema).min(1, "At least one line item is required"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
	customerId: z.string().optional(),
	reference: z.string().optional().nullable(),
	dueDate: z.string().optional(),
	discount: z.number().min(0).optional(),
	notes: z.string().optional().nullable(),
	terms: z.string().optional().nullable(),
	status: z
		.enum([
			"DRAFT",
			"SENT",
			"VIEWED",
			"PARTIALLY_PAID",
			"PAID",
			"OVERDUE",
			"CANCELLED",
			"WRITTEN_OFF",
		])
		.optional(),
	lineItems: z.array(invoiceLineItemSchema).optional(),
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const recordPaymentSchema = z.object({
	amount: z.number().positive("Payment amount must be positive"),
	date: z.string().min(1, "Payment date is required"),
	reference: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
	bankAccountId: z.string().optional().nullable(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
