"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<SessionProvider>
			{children}
			<Toaster position="top-right" richColors closeButton />
		</SessionProvider>
	);
}
