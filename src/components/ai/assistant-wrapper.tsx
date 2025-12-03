"use client";

import { useState } from "react";

import { AssistantSheet } from "./assistant-sheet";
import { AssistantTrigger } from "./assistant-trigger";

export function AssistantWrapper() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<AssistantTrigger onClick={() => setOpen(true)} />
			<AssistantSheet open={open} onOpenChange={setOpen} />
		</>
	);
}
