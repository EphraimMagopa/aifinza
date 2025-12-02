import { z } from "zod";

export const bankAccountTypeOptions = [
	{ value: "CURRENT", label: "Current Account" },
	{ value: "SAVINGS", label: "Savings Account" },
	{ value: "CREDIT_CARD", label: "Credit Card" },
	{ value: "LOAN", label: "Loan Account" },
	{ value: "CASH", label: "Cash / Petty Cash" },
	{ value: "OTHER", label: "Other" },
] as const;

export const southAfricanBanks = [
	{ value: "ABSA", label: "ABSA" },
	{ value: "CAPITEC", label: "Capitec Bank" },
	{ value: "FNB", label: "First National Bank (FNB)" },
	{ value: "NEDBANK", label: "Nedbank" },
	{ value: "STANDARD_BANK", label: "Standard Bank" },
	{ value: "INVESTEC", label: "Investec" },
	{ value: "AFRICAN_BANK", label: "African Bank" },
	{ value: "BIDVEST", label: "Bidvest Bank" },
	{ value: "DISCOVERY", label: "Discovery Bank" },
	{ value: "TYME_BANK", label: "TymeBank" },
	{ value: "OTHER", label: "Other" },
] as const;

export const createBankAccountSchema = z.object({
	name: z.string().min(1, "Account name is required"),
	bankName: z.string().min(1, "Bank name is required"),
	accountNumber: z.string().min(1, "Account number is required"),
	branchCode: z.string().optional(),
	accountType: z.enum(["CURRENT", "SAVINGS", "CREDIT_CARD", "LOAN", "CASH", "OTHER"]),
	currency: z.string(),
	openingBalance: z.number(),
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

export const updateBankAccountSchema = createBankAccountSchema.partial().extend({
	isActive: z.boolean().optional(),
});

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;
