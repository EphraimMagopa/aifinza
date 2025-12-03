import { z } from "zod";

export const taxPeriodTypeOptions = [
	{ value: "VAT", label: "VAT Return (VAT201)" },
	{ value: "PROVISIONAL_TAX", label: "Provisional Tax (IRP6)" },
	{ value: "ANNUAL_TAX", label: "Annual Tax Return (ITR14)" },
	{ value: "PAYE", label: "PAYE (EMP201)" },
	{ value: "UIF", label: "UIF Contributions" },
	{ value: "SDL", label: "Skills Development Levy" },
] as const;

export const taxPeriodStatusOptions = [
	{ value: "OPEN", label: "Open" },
	{ value: "IN_PROGRESS", label: "In Progress" },
	{ value: "READY_TO_SUBMIT", label: "Ready to Submit" },
	{ value: "SUBMITTED", label: "Submitted" },
	{ value: "PAID", label: "Paid" },
	{ value: "OVERDUE", label: "Overdue" },
] as const;

export const createTaxPeriodSchema = z.object({
	type: z.enum(["VAT", "PROVISIONAL_TAX", "ANNUAL_TAX", "PAYE", "UIF", "SDL"]),
	startDate: z.string().min(1, "Start date is required"),
	endDate: z.string().min(1, "End date is required"),
	dueDate: z.string().min(1, "Due date is required"),
});

export type CreateTaxPeriodInput = z.infer<typeof createTaxPeriodSchema>;

export const updateTaxPeriodSchema = z.object({
	status: z
		.enum(["OPEN", "IN_PROGRESS", "READY_TO_SUBMIT", "SUBMITTED", "PAID", "OVERDUE"])
		.optional(),
	outputVat: z.number().min(0).optional().nullable(),
	inputVat: z.number().min(0).optional().nullable(),
	vatPayable: z.number().optional().nullable(),
	reference: z.string().optional().nullable(),
	submittedAt: z.string().optional().nullable(),
	notes: z.string().optional().nullable(),
});

export type UpdateTaxPeriodInput = z.infer<typeof updateTaxPeriodSchema>;

export const calculateVatSchema = z.object({
	periodId: z.string().min(1, "Period ID is required"),
});

export type CalculateVatInput = z.infer<typeof calculateVatSchema>;
