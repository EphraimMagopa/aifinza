export type AIProvider = "CLAUDE" | "OPENAI" | "GEMINI" | "DEEPSEEK";
export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string;
	createdAt: Date;
}

export interface Conversation {
	id: string;
	title: string | null;
	businessId: string;
	provider: AIProvider;
	model: string | null;
	createdAt: Date;
	updatedAt: Date;
	messageCount?: number;
}

export interface AISettings {
	id: string;
	userId: string;
	defaultProvider: AIProvider;
	enableAutoCateg: boolean;
	enableInsights: boolean;
}

export interface ConversationWithMessages extends Conversation {
	messages: ChatMessage[];
}
