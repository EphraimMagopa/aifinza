"use client";

import { useCallback, useState } from "react";

import { useBusiness } from "./use-business";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
}

interface UseAIChatOptions {
	conversationId?: string;
	onConversationCreated?: (conversationId: string) => void;
}

export function useAIChat(options: UseAIChatOptions = {}) {
	const { conversationId: initialConversationId, onConversationCreated } = options;
	const { businessId } = useBusiness();

	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);

	const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	}, []);

	const handleSubmit = useCallback(
		async (e?: React.FormEvent<HTMLFormElement>) => {
			e?.preventDefault();

			if (!businessId || !input.trim()) return;

			const userMessage: ChatMessage = {
				id: `user-${Date.now()}`,
				role: "user",
				content: input.trim(),
			};

			setMessages((prev) => [...prev, userMessage]);
			setInput("");
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch("/api/ai/chat", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						message: userMessage.content,
						businessId,
						conversationId,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to get response");
				}

				// Get conversation ID from header
				const newConversationId = response.headers.get("X-Conversation-Id");
				if (newConversationId && newConversationId !== conversationId) {
					setConversationId(newConversationId);
					onConversationCreated?.(newConversationId);
				}

				// Handle streaming response
				const reader = response.body?.getReader();
				if (!reader) throw new Error("No response body");

				const assistantMessage: ChatMessage = {
					id: `assistant-${Date.now()}`,
					role: "assistant",
					content: "",
				};
				setMessages((prev) => [...prev, assistantMessage]);

				const decoder = new TextDecoder();
				let content = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					content += decoder.decode(value, { stream: true });
					setMessages((prev) =>
						prev.map((m) => (m.id === assistantMessage.id ? { ...m, content } : m))
					);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		},
		[businessId, input, conversationId, onConversationCreated]
	);

	const clearChat = useCallback(() => {
		setMessages([]);
		setConversationId(undefined);
		setError(null);
	}, []);

	const loadConversation = useCallback(async (convId: string) => {
		try {
			const response = await fetch(`/api/ai/conversations/${convId}`);
			if (response.ok) {
				const data = await response.json();
				setConversationId(convId);
				setMessages(
					data.conversation.messages.map((m: { id: string; role: string; content: string }) => ({
						id: m.id,
						role: m.role as "user" | "assistant",
						content: m.content,
					}))
				);
			}
		} catch (err) {
			console.error("Failed to load conversation:", err);
		}
	}, []);

	const stop = useCallback(() => {
		// For now, we can't stop an ongoing fetch easily
		// Would need AbortController implementation
	}, []);

	return {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		error,
		conversationId,
		clearChat,
		loadConversation,
		stop,
		setMessages,
		isReady: !!businessId,
	};
}
