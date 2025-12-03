import { z } from "zod";

export const createCheckoutSchema = z.object({
	plan: z.enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"]),
});

export const createPortalSchema = z.object({
	returnUrl: z.string().url().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
