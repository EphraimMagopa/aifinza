"use client";

import { Bot, User } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
	role: "user" | "assistant" | "system";
	content: string;
	isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
	const isUser = role === "user";

	return (
		<div className={cn("flex gap-3 py-4", isUser && "flex-row-reverse")}>
			<Avatar className="h-8 w-8 shrink-0">
				<AvatarFallback className={cn(isUser ? "bg-primary" : "bg-muted")}>
					{isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
				</AvatarFallback>
			</Avatar>
			<div className={cn("flex-1 space-y-2 overflow-hidden", isUser && "flex flex-col items-end")}>
				<div
					className={cn(
						"rounded-lg px-4 py-2 max-w-[85%]",
						isUser ? "bg-primary text-primary-foreground" : "bg-muted"
					)}
				>
					{isLoading ? (
						<div className="flex gap-1">
							<span className="animate-bounce">.</span>
							<span className="animate-bounce [animation-delay:0.2s]">.</span>
							<span className="animate-bounce [animation-delay:0.4s]">.</span>
						</div>
					) : (
						<div className="prose prose-sm dark:prose-invert max-w-none">
							{content.split("\n").map((line, i) => (
								<p key={i} className="mb-1 last:mb-0">
									{line || "\u00A0"}
								</p>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
