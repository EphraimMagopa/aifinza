"use client";

import {
	Building2,
	ChartBar,
	CreditCard,
	FileText,
	LayoutDashboard,
	LogOut,
	Shield,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Dashboard", href: "/admin", icon: LayoutDashboard },
	{ name: "Users", href: "/admin/users", icon: Users },
	{ name: "Businesses", href: "/admin/businesses", icon: Building2 },
	{ name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
	{ name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
];

const quickLinks = [
	{ name: "Analytics", href: "/admin/analytics", icon: ChartBar },
	{ name: "Back to App", href: "/dashboard", icon: LogOut },
];

export function AdminSidebar() {
	const pathname = usePathname();

	return (
		<div className="flex h-full w-64 flex-col border-r bg-muted/40">
			<div className="flex h-14 items-center border-b px-4">
				<Link href="/admin" className="flex items-center gap-2 font-semibold">
					<Shield className="h-6 w-6 text-primary" />
					<span>Admin Panel</span>
				</Link>
			</div>
			<ScrollArea className="flex-1 px-3 py-4">
				<nav className="flex flex-col gap-1">
					{navigation.map((item) => {
						const isActive =
							item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
						return (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "text-muted-foreground hover:bg-muted hover:text-foreground"
								)}
							>
								<item.icon className="h-4 w-4" />
								{item.name}
							</Link>
						);
					})}
				</nav>
				<div className="mt-6">
					<h4 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
						Quick Links
					</h4>
					<nav className="flex flex-col gap-1">
						{quickLinks.map((item) => {
							const isActive = pathname.startsWith(item.href);
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									)}
								>
									<item.icon className="h-4 w-4" />
									{item.name}
								</Link>
							);
						})}
					</nav>
				</div>
			</ScrollArea>
		</div>
	);
}
