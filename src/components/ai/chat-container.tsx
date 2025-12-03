"use client";

import { History, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAIChat } from "@/hooks/use-ai-chat";
import { useConversations } from "@/hooks/use-conversations";

import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ConversationList } from "./conversation-list";

interface ChatContainerProps {
	onClose?: () => void;
	showCloseButton?: boolean;
	className?: string;
}

export function ChatContainer({ onClose, showCloseButton = true, className }: ChatContainerProps) {
	const [showHistory, setShowHistory] = useState(false);

	const {
		conversations,
		isLoading: conversationsLoading,
		deleteConversation,
		refreshConversations,
	} = useConversations();

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		conversationId,
		clearChat,
		loadConversation,
		stop,
		isReady,
	} = useAIChat({
		onConversationCreated: () => {
			refreshConversations();
		},
	});

	const handleSelectConversation = (id: string) => {
		loadConversation(id);
		setShowHistory(false);
	};

	const handleNewChat = () => {
		clearChat();
		setShowHistory(false);
	};

	const handleDeleteConversation = async (id: string) => {
		const success = await deleteConversation(id);
		if (success && id === conversationId) {
			clearChat();
		}
	};

	if (!isReady) {
		return (
			<div className="flex flex-col h-full items-center justify-center p-6 text-center">
				<p className="text-muted-foreground">Please select a business to use the AI assistant.</p>
			</div>
		);
	}

	return (
		<div className={`flex flex-col h-full ${className || ""}`}>
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShowHistory(!showHistory)}
						className="h-8 w-8"
					>
						<History className="h-4 w-4" />
						<span className="sr-only">Toggle history</span>
					</Button>
					<h2 className="font-semibold">Finza Assistant</h2>
				</div>
				{showCloseButton && onClose && (
					<Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
						<X className="h-4 w-4" />
						<span className="sr-only">Close</span>
					</Button>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* History sidebar */}
				{showHistory && (
					<div className="w-64 border-r bg-muted/30">
						<ConversationList
							conversations={conversations}
							activeConversationId={conversationId}
							onSelect={handleSelectConversation}
							onNew={handleNewChat}
							onDelete={handleDeleteConversation}
							isLoading={conversationsLoading}
						/>
					</div>
				)}

				{/* Chat area */}
				<div className="flex-1 flex flex-col min-w-0">
					<ChatMessages messages={messages} isLoading={isLoading} />

					{/* Input */}
					<div className="p-4 border-t">
						<ChatInput
							value={input}
							onChange={handleInputChange}
							onSubmit={handleSubmit}
							isLoading={isLoading}
							onStop={stop}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
