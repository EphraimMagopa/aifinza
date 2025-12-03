import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAI, openai } from "@ai-sdk/openai";

export type AIProviderType = "CLAUDE" | "OPENAI" | "GEMINI" | "DEEPSEEK";

const DEFAULT_PROVIDER: AIProviderType = "CLAUDE";

/**
 * Get an AI language model based on the provider type
 */
export function getModel(provider: AIProviderType = DEFAULT_PROVIDER) {
	switch (provider) {
		case "CLAUDE":
			return anthropic(process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514");
		case "OPENAI":
			return openai(process.env.OPENAI_MODEL || "gpt-4-turbo-preview");
		case "GEMINI":
			return google(process.env.GOOGLE_AI_MODEL || "gemini-pro");
		case "DEEPSEEK": {
			// DeepSeek uses OpenAI-compatible API
			const deepseek = createOpenAI({
				baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
				apiKey: process.env.DEEPSEEK_API_KEY,
			});
			return deepseek(process.env.DEEPSEEK_MODEL || "deepseek-chat");
		}
		default:
			return anthropic("claude-sonnet-4-20250514");
	}
}

/**
 * Get the default AI provider from environment
 */
export function getDefaultProvider(): AIProviderType {
	const envProvider = process.env.AI_DEFAULT_PROVIDER?.toUpperCase();
	if (envProvider && isValidProvider(envProvider)) {
		return envProvider as AIProviderType;
	}
	return DEFAULT_PROVIDER;
}

/**
 * Check if a string is a valid AI provider type
 */
export function isValidProvider(provider: string): provider is AIProviderType {
	return ["CLAUDE", "OPENAI", "GEMINI", "DEEPSEEK"].includes(provider.toUpperCase());
}

/**
 * Get provider display name
 */
export function getProviderName(provider: AIProviderType): string {
	const names: Record<AIProviderType, string> = {
		CLAUDE: "Claude (Anthropic)",
		OPENAI: "GPT-4 (OpenAI)",
		GEMINI: "Gemini (Google)",
		DEEPSEEK: "DeepSeek",
	};
	return names[provider] || provider;
}
