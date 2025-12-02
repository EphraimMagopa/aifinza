import { z } from "zod";

export const quoteStatusOptions = [
	{ value: "DRAFT", label: "Draft" },
	{ value: "SENT", label: "Sent" },
	{ value: "ACCEPTED", label: "Accepted" },
	{ value: "DECLINED", label: "Declined" },
	{ value: "EXPIRED", label: "Expired" },
	{ value: "INVOICED", label: "Invoiced" },
] as const;

export const lineItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	quantity: z.number().positive("Quantity must be positive"),
	unitPrice: z.number().min(0, "Unit price cannot be negative"),
	vatRate: z.number().min(0).max(100),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;

export const createQuoteSchema = z.object({
	customerId: z.string().min(1, "Customer is required"),
	reference: z.string().optional().nullable(),
	expiryDate: z.string().min(1, "Expiry date is required"),
	discount: z.number().min(0),
	notes: z.string().optional().nullable(),
	terms: z.string().optional().nullable(),
	lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const updateQuoteSchema = z.object({
	customerId: z.string().optional(),
	reference: z.string().optional().nullable(),
	expiryDate: z.string().optional(),
	discount: z.number().min(0).optional(),
	notes: z.string().optional().nullable(),
	terms: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED", "INVOICED"]).optional(),
	lineItems: z.array(lineItemSchema).optional(),
});

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
