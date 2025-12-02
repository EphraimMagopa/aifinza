import { z } from "zod";

export const businessTypeOptions = [
	{ value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
	{ value: "PARTNERSHIP", label: "Partnership" },
	{ value: "PRIVATE_COMPANY", label: "Private Company (Pty) Ltd" },
	{ value: "PUBLIC_COMPANY", label: "Public Company" },
	{ value: "CLOSE_CORPORATION", label: "Close Corporation (CC)" },
	{ value: "NON_PROFIT", label: "Non-Profit Organisation" },
	{ value: "TRUST", label: "Trust" },
	{ value: "OTHER", label: "Other" },
] as const;

export const provinceOptions = [
	{ value: "EASTERN_CAPE", label: "Eastern Cape" },
	{ value: "FREE_STATE", label: "Free State" },
	{ value: "GAUTENG", label: "Gauteng" },
	{ value: "KWAZULU_NATAL", label: "KwaZulu-Natal" },
	{ value: "LIMPOPO", label: "Limpopo" },
	{ value: "MPUMALANGA", label: "Mpumalanga" },
	{ value: "NORTHERN_CAPE", label: "Northern Cape" },
	{ value: "NORTH_WEST", label: "North West" },
	{ value: "WESTERN_CAPE", label: "Western Cape" },
] as const;

export const vatCycleOptions = [
	{ value: "MONTHLY", label: "Monthly (Category A: >R30m turnover)" },
	{ value: "BI_MONTHLY", label: "Bi-Monthly (Category B: R1.5m - R30m)" },
	{ value: "SIX_MONTHLY", label: "Six-Monthly (Category C: <R1.5m)" },
] as const;

// Schema for form input (what react-hook-form uses)
export const createBusinessFormSchema = z.object({
	name: z.string().min(2, "Business name must be at least 2 characters"),
	tradingName: z.string().optional(),
	businessType: z.enum([
		"SOLE_PROPRIETOR",
		"PARTNERSHIP",
		"PRIVATE_COMPANY",
		"PUBLIC_COMPANY",
		"CLOSE_CORPORATION",
		"NON_PROFIT",
		"TRUST",
		"OTHER",
	]),
	industry: z.string().optional(),
	registrationNumber: z.string().optional(),
	taxNumber: z.string().optional(),
	vatNumber: z.string().optional(),
	isVatRegistered: z.boolean(),
	vatCycle: z.enum(["MONTHLY", "BI_MONTHLY", "SIX_MONTHLY"]).optional().nullable(),
	financialYearEnd: z.number().min(1).max(12),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
	phone: z.string().optional(),
	website: z.string().url("Invalid URL").optional().or(z.literal("")),
	addressLine1: z.string().optional(),
	addressLine2: z.string().optional(),
	city: z.string().optional(),
	province: z
		.enum([
			"EASTERN_CAPE",
			"FREE_STATE",
			"GAUTENG",
			"KWAZULU_NATAL",
			"LIMPOPO",
			"MPUMALANGA",
			"NORTHERN_CAPE",
			"NORTH_WEST",
			"WESTERN_CAPE",
		])
		.optional()
		.nullable(),
	postalCode: z.string().optional(),
});

export type CreateBusinessFormInput = z.infer<typeof createBusinessFormSchema>;

// Schema for API input (with defaults applied server-side)
export const createBusinessSchema = createBusinessFormSchema;
export type CreateBusinessInput = CreateBusinessFormInput;

export const updateBusinessSchema = createBusinessFormSchema.partial();
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
