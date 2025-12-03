import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AssistantWrapper } from "@/components/ai";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { BusinessProvider } from "@/components/providers/business-provider";
import { auth } from "@/lib/auth";

async function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
	const session = await auth();

	if (!session?.user) {
		redirect("/signin");
	}

	return (
		<BusinessProvider>
			<div className="flex h-screen">
				{/* Desktop sidebar */}
				<div className="hidden lg:block">
					<Sidebar />
				</div>

				{/* Main content */}
				<div className="flex flex-1 flex-col overflow-hidden">
					<Header />
					<main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
				</div>
			</div>

			{/* AI Assistant (floating trigger + sheet) */}
			<AssistantWrapper />
		</BusinessProvider>
	);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			}
		>
			<DashboardLayoutContent>{children}</DashboardLayoutContent>
		</Suspense>
	);
}
