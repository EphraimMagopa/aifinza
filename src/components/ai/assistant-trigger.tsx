"use client";

import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AssistantTriggerProps {
	onClick: () => void;
}

export function AssistantTrigger({ onClick }: AssistantTriggerProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					onClick={onClick}
					className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 lg:hidden"
				>
					<Bot className="h-5 w-5" />
					<span className="sr-only">Open AI Assistant</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent side="left">
				<p>AI Assistant</p>
			</TooltipContent>
		</Tooltip>
	);
}
