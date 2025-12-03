"use client";

import {
	Bot,
	Building2,
	Calculator,
	CalendarDays,
	ChartBar,
	CreditCard,
	FileText,
	FolderTree,
	LayoutDashboard,
	Receipt,
	Settings,
	Truck,
	Users,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Transactions", href: "/transactions", icon: Receipt },
	{ name: "Bank Accounts", href: "/accounts", icon: CreditCard },
	{ name: "Categories", href: "/categories", icon: FolderTree },
	{ name: "Invoices", href: "/invoices", icon: FileText },
	{ name: "Quotes", href: "/quotes", icon: FileText },
	{ name: "Customers", href: "/customers", icon: Users },
	{ name: "Suppliers", href: "/suppliers", icon: Truck },
	{ name: "Reports", href: "/reports", icon: ChartBar },
	{ name: "Tax", href: "/tax", icon: Calculator },
	{ name: "Payroll", href: "/payroll", icon: Wallet },
	{ name: "Calendar", href: "/calendar", icon: CalendarDays },
	{ name: "AI Assistant", href: "/assistant", icon: Bot },
];

const settingsNavigation = [
	{ name: "Business Settings", href: "/settings/business", icon: Building2 },
	{ name: "Team", href: "/settings/team", icon: Users },
	{ name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<div className="flex h-full w-64 flex-col border-r bg-muted/40">
			<div className="flex h-14 items-center border-b px-4">
				<Link href="/dashboard" className="flex items-center gap-2 font-semibold">
					<Building2 className="h-6 w-6" />
					<span>Aifinza</span>
				</Link>
			</div>
			<ScrollArea className="flex-1 px-3 py-4">
				<nav className="flex flex-col gap-1">
					{navigation.map((item) => {
						const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
						Settings
					</h4>
					<nav className="flex flex-col gap-1">
						{settingsNavigation.map((item) => {
							const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
