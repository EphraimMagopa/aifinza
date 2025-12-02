import { z } from "zod";

export const frequencyOptions = [
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "FORTNIGHTLY", label: "Fortnightly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "QUARTERLY", label: "Quarterly" },
	{ value: "ANNUALLY", label: "Annually" },
] as const;

export const createRecurringTransactionSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be positive"),
	type: z.enum(["INCOME", "EXPENSE"]),
	frequency: z.enum(["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "ANNUALLY"]),
	startDate: z.string().min(1, "Start date is required"),
	endDate: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	bankAccountId: z.string().optional().nullable(),
	isActive: z.boolean().default(true),
});

export type CreateRecurringTransactionInput = z.infer<typeof createRecurringTransactionSchema>;

export const updateRecurringTransactionSchema = createRecurringTransactionSchema.partial();
export type UpdateRecurringTransactionInput = z.infer<typeof updateRecurringTransactionSchema>;
