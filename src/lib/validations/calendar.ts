import { z } from "zod";

export const eventTypeOptions = [
	{ value: "TAX_DEADLINE", label: "Tax Deadline" },
	{ value: "INVOICE_DUE", label: "Invoice Due" },
	{ value: "PAYMENT_DUE", label: "Payment Due" },
	{ value: "MEETING", label: "Meeting" },
	{ value: "REMINDER", label: "Reminder" },
	{ value: "PAYROLL", label: "Payroll" },
	{ value: "CUSTOM", label: "Custom" },
] as const;

export const createEventSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().max(1000).optional(),
	type: z.enum([
		"TAX_DEADLINE",
		"INVOICE_DUE",
		"PAYMENT_DUE",
		"MEETING",
		"REMINDER",
		"PAYROLL",
		"CUSTOM",
	]),
	startDate: z.string().datetime(),
	endDate: z.string().datetime().optional(),
	allDay: z.boolean().default(false),
	isRecurring: z.boolean().default(false),
	recurrenceRule: z.string().optional(),
	reminderMinutes: z.array(z.number()).default([1440, 60]),
	relatedId: z.string().optional(),
	relatedType: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
	completed: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
