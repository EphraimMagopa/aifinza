"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";
import { WELCOME_MESSAGE } from "@/lib/ai";

import { ChatMessage } from "./chat-message";

interface ChatMessagesProps {
	messages: ChatMessageType[];
	isLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
	"What was my revenue this month?",
	"Which invoices are overdue?",
	"How much VAT do I owe?",
	"What are my top expense categories?",
];

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
				<div className="rounded-full bg-primary/10 p-4 mb-4">
					<Bot className="h-8 w-8 text-primary" />
				</div>
				<h3 className="font-semibold text-lg mb-2">Finza Assistant</h3>
				<p className="text-muted-foreground text-sm max-w-md mb-6">
					{WELCOME_MESSAGE.split("\n")[0]}
				</p>
				<div className="grid gap-2 w-full max-w-sm">
					{SUGGESTED_PROMPTS.map((prompt) => (
						<button
							key={prompt}
							type="button"
							className="flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg border hover:bg-muted transition-colors"
						>
							<Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
							<span>{prompt}</span>
						</button>
					))}
				</div>
			</div>
		);
	}

	return (
		<ScrollArea className="flex-1 px-4" ref={scrollRef}>
			<div className="py-4 space-y-2">
				{messages.map((message) => (
					<ChatMessage
						key={message.id}
						role={message.role as "user" | "assistant"}
						content={message.content}
					/>
				))}
				{isLoading && messages[messages.length - 1]?.role === "user" && (
					// biome-ignore lint/a11y/useValidAriaRole: role is component prop, not ARIA role
					<ChatMessage role="assistant" content="" isLoading />
				)}
				<div ref={bottomRef} />
			</div>
		</ScrollArea>
	);
}
