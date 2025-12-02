import { z } from "zod";

export const transactionTypeOptions = [
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
	{ value: "JOURNAL", label: "Journal Entry" },
] as const;

export const vatTypeOptions = [
	{ value: "STANDARD", label: "Standard (15%)" },
	{ value: "ZERO_RATED", label: "Zero Rated (0%)" },
	{ value: "EXEMPT", label: "VAT Exempt" },
	{ value: "NO_VAT", label: "No VAT" },
] as const;

export const createTransactionSchema = z.object({
	date: z.string().min(1, "Date is required"),
	description: z.string().min(1, "Description is required"),
	amount: z.number().min(0.01, "Amount must be greater than 0"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "JOURNAL"]),
	bankAccountId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	customerId: z.string().optional().nullable(),
	supplierId: z.string().optional().nullable(),
	reference: z.string().optional(),
	notes: z.string().optional(),
	vatType: z.enum(["STANDARD", "ZERO_RATED", "EXEMPT", "NO_VAT"]).optional().nullable(),
	vatRate: z.number().optional().nullable(),
	vatAmount: z.number().optional().nullable(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const updateTransactionSchema = createTransactionSchema.partial();
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

export const transactionFiltersSchema = z.object({
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "JOURNAL"]).optional(),
	bankAccountId: z.string().optional(),
	categoryId: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	search: z.string().optional(),
	isReconciled: z.boolean().optional(),
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
