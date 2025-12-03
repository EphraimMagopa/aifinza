"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

import { ChatContainer } from "./chat-container";

interface AssistantSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AssistantSheet({ open, onOpenChange }: AssistantSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
				<SheetTitle className="sr-only">AI Assistant</SheetTitle>
				<ChatContainer onClose={() => onOpenChange(false)} />
			</SheetContent>
		</Sheet>
	);
}
