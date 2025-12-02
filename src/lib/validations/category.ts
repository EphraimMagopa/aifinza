import { z } from "zod";

export const categoryColors = [
	{ value: "#22c55e", label: "Green" },
	{ value: "#3b82f6", label: "Blue" },
	{ value: "#f59e0b", label: "Amber" },
	{ value: "#ef4444", label: "Red" },
	{ value: "#8b5cf6", label: "Purple" },
	{ value: "#06b6d4", label: "Cyan" },
	{ value: "#f97316", label: "Orange" },
	{ value: "#ec4899", label: "Pink" },
	{ value: "#6b7280", label: "Gray" },
] as const;

export const createCategorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
	type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "JOURNAL"]),
	color: z.string().optional(),
	parentId: z.string().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
