"use client";

import { Send, Square } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
	isLoading?: boolean;
	onStop?: () => void;
	disabled?: boolean;
	placeholder?: string;
}

export function ChatInput({
	value,
	onChange,
	onSubmit,
	isLoading,
	onStop,
	disabled,
	placeholder = "Ask about your finances...",
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (!disabled && !isLoading && value.trim()) {
				onSubmit();
			}
		}
	};

	return (
		<form onSubmit={onSubmit} className="flex gap-2 items-end">
			<Textarea
				ref={textareaRef}
				value={value}
				onChange={onChange}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled || isLoading}
				className="min-h-[44px] max-h-[200px] resize-none"
				rows={1}
			/>
			{isLoading ? (
				<Button type="button" size="icon" variant="outline" onClick={onStop} className="shrink-0">
					<Square className="h-4 w-4" />
					<span className="sr-only">Stop</span>
				</Button>
			) : (
				<Button type="submit" size="icon" disabled={disabled || !value.trim()} className="shrink-0">
					<Send className="h-4 w-4" />
					<span className="sr-only">Send</span>
				</Button>
			)}
		</form>
	);
}
