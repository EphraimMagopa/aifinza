"use client";

import { format } from "date-fns";
import { ArrowLeft, CreditCard, FileText, Receipt, Truck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessDetail {
	id: string;
	name: string;
	tradingName: string | null;
	registrationNumber: string | null;
	taxNumber: string | null;
	vatNumber: string | null;
	isVatRegistered: boolean;
	vatCycle: string | null;
	businessType: string;
	industry: string | null;
	financialYearEnd: number;
	email: string | null;
	phone: string | null;
	website: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	province: string | null;
	postalCode: string | null;
	createdAt: string;
	updatedAt: string;
	users: Array<{
		id: string;
		role: string;
		user: {
			id: string;
			name: string | null;
			email: string;
			role: string;
		};
	}>;
	bankAccounts: Array<{
		id: string;
		name: string;
		bankName: string;
		accountType: string;
		isActive: boolean;
	}>;
	stats: {
		transactions: number;
		invoices: number;
		quotes: number;
		customers: number;
		suppliers: number;
		employees: number;
	};
}

export default function AdminBusinessDetailPage() {
	const params = useParams();
	const businessId = params.businessId as string;

	const [business, setBusiness] = useState<BusinessDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchBusiness = useCallback(async () => {
		try {
			const res = await fetch(`/api/admin/businesses/${businessId}`);
			if (!res.ok) throw new Error("Failed to fetch business");
			const data = await res.json();
			setBusiness(data.business);
		} catch (error) {
			console.error("Fetch business error:", error);
			toast.error("Failed to load business");
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchBusiness();
	}, [fetchBusiness]);

	if (isLoading) {
		return <BusinessDetailSkeleton />;
	}

	if (!business) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-muted-foreground mb-4">Business not found</p>
				<Button variant="outline" asChild>
					<Link href="/admin/businesses">Back to Businesses</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/businesses">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">{business.name}</h1>
					{business.tradingName && (
						<p className="text-muted-foreground">t/a {business.tradingName}</p>
					)}
				</div>
				<Badge variant="outline">{formatBusinessType(business.businessType)}</Badge>
				{business.isVatRegistered && <Badge>VAT Registered</Badge>}
			</div>

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
				<StatCard icon={Receipt} label="Transactions" value={business.stats.transactions} />
				<StatCard icon={FileText} label="Invoices" value={business.stats.invoices} />
				<StatCard icon={FileText} label="Quotes" value={business.stats.quotes} />
				<StatCard icon={Users} label="Customers" value={business.stats.customers} />
				<StatCard icon={Truck} label="Suppliers" value={business.stats.suppliers} />
				<StatCard icon={Wallet} label="Employees" value={business.stats.employees} />
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Business Details */}
				<Card>
					<CardHeader>
						<CardTitle>Business Details</CardTitle>
						<CardDescription>Registration and tax information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{business.registrationNumber && (
							<div>
								<p className="text-sm text-muted-foreground">Registration Number</p>
								<p className="font-medium">{business.registrationNumber}</p>
							</div>
						)}
						{business.taxNumber && (
							<div>
								<p className="text-sm text-muted-foreground">SARS Tax Number</p>
								<p className="font-medium">{business.taxNumber}</p>
							</div>
						)}
						{business.vatNumber && (
							<div>
								<p className="text-sm text-muted-foreground">VAT Number</p>
								<p className="font-medium">{business.vatNumber}</p>
							</div>
						)}
						{business.vatCycle && (
							<div>
								<p className="text-sm text-muted-foreground">VAT Cycle</p>
								<p className="font-medium">{formatVatCycle(business.vatCycle)}</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Financial Year End</p>
							<p className="font-medium">{getMonthName(business.financialYearEnd)}</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Created</p>
								<p className="font-medium">{format(new Date(business.createdAt), "MMM d, yyyy")}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Updated</p>
								<p className="font-medium">{format(new Date(business.updatedAt), "MMM d, yyyy")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Contact Details */}
				<Card>
					<CardHeader>
						<CardTitle>Contact Details</CardTitle>
						<CardDescription>Business contact information</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{business.email && (
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="font-medium">{business.email}</p>
							</div>
						)}
						{business.phone && (
							<div>
								<p className="text-sm text-muted-foreground">Phone</p>
								<p className="font-medium">{business.phone}</p>
							</div>
						)}
						{business.website && (
							<div>
								<p className="text-sm text-muted-foreground">Website</p>
								<p className="font-medium">{business.website}</p>
							</div>
						)}
						{(business.addressLine1 || business.city) && (
							<div>
								<p className="text-sm text-muted-foreground">Address</p>
								<p className="font-medium">
									{[
										business.addressLine1,
										business.addressLine2,
										business.city,
										business.province,
										business.postalCode,
									]
										.filter(Boolean)
										.join(", ")}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Team Members */}
			<Card>
				<CardHeader>
					<CardTitle>Team Members</CardTitle>
					<CardDescription>Users with access to this business</CardDescription>
				</CardHeader>
				<CardContent>
					{business.users.length > 0 ? (
						<div className="space-y-4">
							{business.users.map((membership) => (
								<div
									key={membership.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center gap-3">
										<Users className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{membership.user.name || "Unnamed User"}</p>
											<p className="text-sm text-muted-foreground">{membership.user.email}</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant="outline">{membership.role}</Badge>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${membership.user.id}`}>View User</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground">No team members</p>
					)}
				</CardContent>
			</Card>

			{/* Bank Accounts */}
			<Card>
				<CardHeader>
					<CardTitle>Bank Accounts</CardTitle>
					<CardDescription>Connected bank accounts</CardDescription>
				</CardHeader>
				<CardContent>
					{business.bankAccounts.length > 0 ? (
						<div className="space-y-4">
							{business.bankAccounts.map((account) => (
								<div
									key={account.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center gap-3">
										<CreditCard className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{account.name}</p>
											<p className="text-sm text-muted-foreground">
												{account.bankName} - {account.accountType}
											</p>
										</div>
									</div>
									<Badge variant={account.isActive ? "default" : "secondary"}>
										{account.isActive ? "Active" : "Inactive"}
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground">No bank accounts connected</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: number;
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-3 pt-6">
				<Icon className="h-5 w-5 text-muted-foreground" />
				<div>
					<p className="text-2xl font-bold">{value}</p>
					<p className="text-xs text-muted-foreground">{label}</p>
				</div>
			</CardContent>
		</Card>
	);
}

function formatBusinessType(type: string): string {
	const types: Record<string, string> = {
		SOLE_PROPRIETOR: "Sole Proprietor",
		PARTNERSHIP: "Partnership",
		PRIVATE_COMPANY: "(Pty) Ltd",
		PUBLIC_COMPANY: "Public Company",
		CLOSE_CORPORATION: "CC",
		NON_PROFIT: "Non-Profit",
		TRUST: "Trust",
		OTHER: "Other",
	};
	return types[type] || type;
}

function formatVatCycle(cycle: string): string {
	const cycles: Record<string, string> = {
		MONTHLY: "Monthly (Category A)",
		BI_MONTHLY: "Bi-Monthly (Category B)",
		SIX_MONTHLY: "Six-Monthly (Category C)",
	};
	return cycles[cycle] || cycle;
}

function getMonthName(month: number): string {
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	return months[month - 1] || "Unknown";
}

function BusinessDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="flex-1">
					<Skeleton className="h-8 w-48 mb-2" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={`stat-${i}`} className="h-24" />
				))}
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-64" />
				<Skeleton className="h-64" />
			</div>
		</div>
	);
}
