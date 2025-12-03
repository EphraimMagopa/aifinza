import { z } from "zod";

export const aiProviderSchema = z.enum(["CLAUDE", "OPENAI", "GEMINI", "DEEPSEEK"]);

export const chatMessageSchema = z.object({
	message: z.string().min(1, "Message is required").max(10000, "Message is too long"),
	conversationId: z.string().optional(),
	businessId: z.string().min(1, "Business ID is required"),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const createConversationSchema = z.object({
	businessId: z.string().min(1, "Business ID is required"),
	title: z.string().max(100).optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const aiSettingsSchema = z.object({
	defaultProvider: aiProviderSchema.optional(),
	enableAutoCateg: z.boolean().optional(),
	enableInsights: z.boolean().optional(),
});

export type AISettingsInput = z.infer<typeof aiSettingsSchema>;
