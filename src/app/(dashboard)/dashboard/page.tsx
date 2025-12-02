"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { StatsCard, StatsCardSkeleton } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
	totalBalance: number;
	incomeThisMonth: number;
	expensesThisMonth: number;
	incomeTrend: number;
	expensesTrend: number;
	outstandingInvoices: number;
	unpaidInvoicesCount: number;
	accountsCount: number;
	customersCount: number;
}

interface Transaction {
	id: string;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE" | "TRANSFER" | "JOURNAL";
	date: string;
	category?: {
		name: string;
		color?: string;
	} | null;
}

interface DashboardData {
	stats: DashboardStats;
	recentTransactions: Transaction[];
}

export default function DashboardPage() {
	const { businessId, business, isLoading: businessLoading } = useBusiness();
	const [data, setData] = useState<DashboardData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchDashboardData() {
			if (!businessId) return;

			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(`/api/businesses/${businessId}/dashboard`);
				if (!response.ok) {
					throw new Error("Failed to fetch dashboard data");
				}
				const result = await response.json();
				setData(result);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		}

		fetchDashboardData();
	}, [businessId]);

	if (businessLoading) {
		return <DashboardSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to view your dashboard.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2 text-destructive">Error</h2>
				<p className="text-muted-foreground mb-4">{error}</p>
				<Button onClick={() => window.location.reload()}>Retry</Button>
			</div>
		);
	}

	const stats = data?.stats;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Welcome back{business?.tradingName ? `, ${business.tradingName}` : ""}
					</h1>
					<p className="text-muted-foreground">
						Here&apos;s an overview of your business finances.
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href="/transactions/new">Add Transaction</Link>
					</Button>
					<Button asChild>
						<Link href="/invoices/new">Create Invoice</Link>
					</Button>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{isLoading ? (
					<>
						<StatsCardSkeleton />
						<StatsCardSkeleton />
						<StatsCardSkeleton />
						<StatsCardSkeleton />
					</>
				) : (
					<>
						<StatsCard
							title="Total Balance"
							value={formatCurrency(stats?.totalBalance || 0)}
							description="Across all accounts"
							icon={Banknote}
						/>
						<StatsCard
							title="Income This Month"
							value={formatCurrency(stats?.incomeThisMonth || 0)}
							icon={ArrowDownLeft}
							trend={
								stats?.incomeTrend
									? { value: stats.incomeTrend, isPositive: stats.incomeTrend > 0 }
									: undefined
							}
							description="vs last month"
						/>
						<StatsCard
							title="Expenses This Month"
							value={formatCurrency(stats?.expensesThisMonth || 0)}
							icon={ArrowUpRight}
							trend={
								stats?.expensesTrend
									? { value: stats.expensesTrend, isPositive: stats.expensesTrend < 0 }
									: undefined
							}
							description="vs last month"
						/>
						<StatsCard
							title="Outstanding Invoices"
							value={formatCurrency(stats?.outstandingInvoices || 0)}
							description={`${stats?.unpaidInvoicesCount || 0} unpaid invoices`}
							icon={FileText}
						/>
					</>
				)}
			</div>

			{/* Content Grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Recent Transactions */}
				<RecentTransactions transactions={data?.recentTransactions || []} isLoading={isLoading} />

				{/* Quick Links */}
				<Card>
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-3">
						<QuickAction
							href="/accounts"
							icon={CreditCard}
							title="Bank Accounts"
							description={`${stats?.accountsCount || 0} active accounts`}
						/>
						<QuickAction
							href="/customers"
							icon={Users}
							title="Customers"
							description={`${stats?.customersCount || 0} customers`}
						/>
						<QuickAction
							href="/transactions/import"
							icon={ArrowDownLeft}
							title="Import Transactions"
							description="Import from CSV or bank statement"
						/>
						<QuickAction
							href="/invoices"
							icon={FileText}
							title="Invoices"
							description="View and manage invoices"
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function QuickAction({
	href,
	icon: Icon,
	title,
	description,
}: {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
}) {
	return (
		<Link
			href={href}
			className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Icon className="h-5 w-5 text-primary" />
			</div>
			<div>
				<p className="text-sm font-medium">{title}</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
		</Link>
	);
}

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="h-8 w-64 bg-muted rounded animate-pulse" />
					<div className="h-4 w-48 bg-muted rounded animate-pulse" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatsCardSkeleton />
				<StatsCardSkeleton />
				<StatsCardSkeleton />
				<StatsCardSkeleton />
			</div>
		</div>
	);
}
