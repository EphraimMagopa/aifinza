import { z } from "zod";
import { provinceEnum, provinceOptions } from "./customer";

export { provinceOptions };

export const createSupplierSchema = z.object({
	name: z.string().min(1, "Supplier name is required"),
	email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
	phone: z.string().optional().nullable(),
	vatNumber: z.string().optional().nullable(),
	addressLine1: z.string().optional().nullable(),
	addressLine2: z.string().optional().nullable(),
	city: z.string().optional().nullable(),
	province: provinceEnum.optional().nullable(),
	postalCode: z.string().optional().nullable(),
	country: z.string(),
	bankName: z.string().optional().nullable(),
	accountNumber: z.string().optional().nullable(),
	branchCode: z.string().optional().nullable(),
	paymentTerms: z.number().int().min(0),
	notes: z.string().optional().nullable(),
	isActive: z.boolean(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
