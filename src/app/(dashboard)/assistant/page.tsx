"use client";

import { Bot } from "lucide-react";
import Link from "next/link";

import { ChatContainer } from "@/components/ai";
import { Button } from "@/components/ui/button";
import { useBusiness } from "@/hooks/use-business";

export default function AssistantPage() {
	const { businessId, isLoading } = useBusiness();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-[calc(100vh-8rem)]">
				<div className="animate-pulse text-muted-foreground">Loading...</div>
			</div>
		);
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4">
				<div className="rounded-full bg-muted p-4 mb-4">
					<Bot className="h-8 w-8 text-muted-foreground" />
				</div>
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Please select or create a business to use the AI assistant.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-8rem)] flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
					<p className="text-muted-foreground">
						Ask questions about your finances and get insights
					</p>
				</div>
			</div>
			<div className="flex-1 border rounded-lg overflow-hidden bg-card">
				<ChatContainer showCloseButton={false} />
			</div>
		</div>
	);
}
