"use client";

import { MessageSquare, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDate } from "@/lib/utils";
import type { Conversation } from "@/types/ai";

interface ConversationListProps {
	conversations: Conversation[];
	activeConversationId?: string;
	onSelect: (conversationId: string) => void;
	onNew: () => void;
	onDelete: (conversationId: string) => void;
	isLoading?: boolean;
}

export function ConversationList({
	conversations,
	activeConversationId,
	onSelect,
	onNew,
	onDelete,
	isLoading,
}: ConversationListProps) {
	return (
		<div className="flex flex-col h-full">
			<div className="p-3 border-b">
				<Button onClick={onNew} className="w-full" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					New Chat
				</Button>
			</div>
			<ScrollArea className="flex-1">
				<div className="p-2 space-y-1">
					{isLoading ? (
						<div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
					) : conversations.length === 0 ? (
						<div className="p-4 text-center text-sm text-muted-foreground">
							No conversations yet
						</div>
					) : (
						conversations.map((conversation) => (
							<div
								key={conversation.id}
								className={cn(
									"group flex items-center gap-2 rounded-lg p-2 hover:bg-muted cursor-pointer",
									activeConversationId === conversation.id && "bg-muted"
								)}
							>
								<button
									type="button"
									className="flex-1 flex items-start gap-2 text-left min-w-0"
									onClick={() => onSelect(conversation.id)}
								>
									<MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{conversation.title || "New conversation"}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDate(new Date(conversation.updatedAt), {
												month: "short",
												day: "numeric",
											})}
											{conversation.messageCount ? ` · ${conversation.messageCount} messages` : ""}
										</p>
									</div>
								</button>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(conversation.id);
									}}
								>
									<Trash2 className="h-3 w-3" />
									<span className="sr-only">Delete</span>
								</Button>
							</div>
						))
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
