import { z } from "zod";

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

export const provinceEnum = z.enum([
	"EASTERN_CAPE",
	"FREE_STATE",
	"GAUTENG",
	"KWAZULU_NATAL",
	"LIMPOPO",
	"MPUMALANGA",
	"NORTHERN_CAPE",
	"NORTH_WEST",
	"WESTERN_CAPE",
]);

export const createCustomerSchema = z.object({
	name: z.string().min(1, "Customer name is required"),
	email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
	phone: z.string().optional().nullable(),
	vatNumber: z.string().optional().nullable(),
	addressLine1: z.string().optional().nullable(),
	addressLine2: z.string().optional().nullable(),
	city: z.string().optional().nullable(),
	province: provinceEnum.optional().nullable(),
	postalCode: z.string().optional().nullable(),
	country: z.string(),
	paymentTerms: z.number().int().min(0),
	creditLimit: z.number().min(0).optional().nullable(),
	notes: z.string().optional().nullable(),
	isActive: z.boolean(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
