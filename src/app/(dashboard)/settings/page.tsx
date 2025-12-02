"use client";

import { Building2, CreditCard, Shield, Users } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness } from "@/hooks/use-business";

const settingsLinks = [
	{
		href: "/settings/business",
		icon: Building2,
		title: "Business Profile",
		description: "Update your business name, address, and registration details",
	},
	{
		href: "/settings/team",
		icon: Users,
		title: "Team Members",
		description: "Invite team members and manage their access permissions",
	},
	{
		href: "/accounts",
		icon: CreditCard,
		title: "Bank Accounts",
		description: "Connect and manage your bank accounts",
	},
	{
		href: "/profile",
		icon: Shield,
		title: "Account Security",
		description: "Update your password and security settings",
	},
];

export default function SettingsPage() {
	const { business, isLoading } = useBusiness();

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div>
					<div className="h-8 w-32 bg-muted rounded animate-pulse" />
					<div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={`skeleton-${i}`} className="h-32 bg-muted rounded-lg animate-pulse" />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Manage your business settings and preferences
					{business?.tradingName ? ` for ${business.tradingName}` : ""}
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{settingsLinks.map((item) => (
					<Link key={item.href} href={item.href}>
						<Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
							<CardHeader>
								<div className="flex items-center gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
										<item.icon className="h-5 w-5 text-primary" />
									</div>
									<div>
										<CardTitle className="text-lg">{item.title}</CardTitle>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<CardDescription>{item.description}</CardDescription>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
