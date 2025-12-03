"use client";

import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "@/types/ai";
import { useBusiness } from "./use-business";

export function useConversations() {
	const { businessId } = useBusiness();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchConversations = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/ai/conversations?businessId=${businessId}`);
			if (response.ok) {
				const data = await response.json();
				setConversations(data.conversations);
			} else {
				setError("Failed to load conversations");
			}
		} catch (err) {
			console.error("Failed to fetch conversations:", err);
			setError("Failed to load conversations");
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchConversations();
	}, [fetchConversations]);

	const createConversation = useCallback(
		async (title?: string): Promise<Conversation | null> => {
			if (!businessId) return null;

			try {
				const response = await fetch("/api/ai/conversations", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ businessId, title }),
				});

				if (response.ok) {
					const data = await response.json();
					setConversations((prev) => [data.conversation, ...prev]);
					return data.conversation;
				}
			} catch (err) {
				console.error("Failed to create conversation:", err);
			}
			return null;
		},
		[businessId]
	);

	const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
		try {
			const response = await fetch(`/api/ai/conversations/${conversationId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setConversations((prev) => prev.filter((c) => c.id !== conversationId));
				return true;
			}
		} catch (err) {
			console.error("Failed to delete conversation:", err);
		}
		return false;
	}, []);

	const refreshConversations = useCallback(() => {
		fetchConversations();
	}, [fetchConversations]);

	return {
		conversations,
		isLoading,
		error,
		createConversation,
		deleteConversation,
		refreshConversations,
	};
}
