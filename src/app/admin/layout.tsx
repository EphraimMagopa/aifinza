import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { isAdminRole } from "@/lib/admin";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();

	// Redirect if not authenticated
	if (!session?.user) {
		redirect("/signin");
	}

	// Redirect if not admin
	if (!isAdminRole(session.user.role)) {
		redirect("/dashboard");
	}

	return (
		<div className="flex h-screen">
			{/* Sidebar - hidden on mobile */}
			<div className="hidden lg:block">
				<AdminSidebar />
			</div>

			{/* Main content */}
			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Header */}
				<header className="flex h-14 items-center border-b px-6">
					<div className="flex items-center gap-4">
						<h1 className="text-lg font-semibold">Aifinza Admin</h1>
						<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
							{session.user.role}
						</span>
					</div>
					<div className="ml-auto flex items-center gap-4">
						<span className="text-sm text-muted-foreground">{session.user.email}</span>
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto p-6">{children}</main>
			</div>
		</div>
	);
}
