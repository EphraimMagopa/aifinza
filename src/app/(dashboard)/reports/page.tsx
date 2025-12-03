"use client";

import {
	BarChart3,
	Calendar,
	DollarSign,
	Download,
	FileText,
	PieChart,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/hooks/use-business";
import { cn, formatCurrency } from "@/lib/utils";

interface ReportSummary {
	revenue: number;
	expenses: number;
	profit: number;
	profitMargin: number;
	invoicesPaid: number;
	invoicesOutstanding: number;
	cashBalance: number;
	revenueChange: number;
	expenseChange: number;
}

const reportTypes = [
	{
		id: "profit-loss",
		title: "Profit & Loss",
		description: "Income and expenses for a period",
		icon: TrendingUp,
		href: "/reports/profit-loss",
	},
	{
		id: "balance-sheet",
		title: "Balance Sheet",
		description: "Assets, liabilities, and equity",
		icon: BarChart3,
		href: "/reports/balance-sheet",
	},
	{
		id: "cash-flow",
		title: "Cash Flow Statement",
		description: "Cash inflows and outflows",
		icon: DollarSign,
		href: "/reports/cash-flow",
	},
	{
		id: "aged-receivables",
		title: "Aged Receivables",
		description: "Outstanding customer invoices by age",
		icon: Calendar,
		href: "/reports/aged-receivables",
	},
	{
		id: "aged-payables",
		title: "Aged Payables",
		description: "Outstanding supplier invoices by age",
		icon: Calendar,
		href: "/reports/aged-payables",
	},
	{
		id: "vat-report",
		title: "VAT Report",
		description: "VAT collected and paid summary",
		icon: FileText,
		href: "/reports/vat",
	},
	{
		id: "income-by-customer",
		title: "Income by Customer",
		description: "Revenue breakdown by customer",
		icon: PieChart,
		href: "/reports/income-by-customer",
	},
	{
		id: "expenses-by-category",
		title: "Expenses by Category",
		description: "Expense breakdown by category",
		icon: PieChart,
		href: "/reports/expenses-by-category",
	},
];

export default function ReportsPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const [summary, setSummary] = useState<ReportSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [period, setPeriod] = useState("this-month");

	const fetchSummary = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/businesses/${businessId}/reports/summary?period=${period}`
			);
			if (response.ok) {
				const data = await response.json();
				setSummary(data.summary);
			}
		} catch (err) {
			console.error("Failed to fetch report summary:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, period]);

	useEffect(() => {
		fetchSummary();
	}, [fetchSummary]);

	if (businessLoading) {
		return <ReportsPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Create or select a business to view reports.</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Reports</h1>
					<p className="text-muted-foreground">Financial reports and business insights</p>
				</div>
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select period" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="this-month">This Month</SelectItem>
						<SelectItem value="last-month">Last Month</SelectItem>
						<SelectItem value="this-quarter">This Quarter</SelectItem>
						<SelectItem value="last-quarter">Last Quarter</SelectItem>
						<SelectItem value="this-year">This Year</SelectItem>
						<SelectItem value="last-year">Last Year</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Revenue</CardTitle>
						<TrendingUp className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="text-2xl font-bold">{formatCurrency(summary?.revenue || 0)}</div>
								<p
									className={cn(
										"text-xs",
										(summary?.revenueChange || 0) >= 0 ? "text-green-600" : "text-red-600"
									)}
								>
									{(summary?.revenueChange || 0) >= 0 ? "+" : ""}
									{summary?.revenueChange?.toFixed(1) || 0}% from last period
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Expenses</CardTitle>
						<TrendingDown className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="text-2xl font-bold">{formatCurrency(summary?.expenses || 0)}</div>
								<p
									className={cn(
										"text-xs",
										(summary?.expenseChange || 0) <= 0 ? "text-green-600" : "text-red-600"
									)}
								>
									{(summary?.expenseChange || 0) >= 0 ? "+" : ""}
									{summary?.expenseChange?.toFixed(1) || 0}% from last period
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Net Profit</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div
									className={cn(
										"text-2xl font-bold",
										(summary?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"
									)}
								>
									{formatCurrency(summary?.profit || 0)}
								</div>
								<p className="text-xs text-muted-foreground">
									{summary?.profitMargin?.toFixed(1) || 0}% profit margin
								</p>
							</>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="text-2xl font-bold">
									{formatCurrency(summary?.cashBalance || 0)}
								</div>
								<p className="text-xs text-muted-foreground">Across all accounts</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Outstanding Invoices Summary */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Receivables</CardTitle>
						<CardDescription>Outstanding customer invoices</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-12 w-full" />
						) : (
							<div className="flex items-center justify-between">
								<div>
									<p className="text-2xl font-bold text-orange-600">
										{formatCurrency(summary?.invoicesOutstanding || 0)}
									</p>
									<p className="text-sm text-muted-foreground">Outstanding</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold text-green-600">
										{formatCurrency(summary?.invoicesPaid || 0)}
									</p>
									<p className="text-sm text-muted-foreground">Collected</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Quick Actions</CardTitle>
						<CardDescription>Export and download reports</CardDescription>
					</CardHeader>
					<CardContent className="flex gap-2">
						<Button variant="outline" size="sm" disabled>
							<Download className="mr-2 h-4 w-4" />
							Export PDF
						</Button>
						<Button variant="outline" size="sm" disabled>
							<Download className="mr-2 h-4 w-4" />
							Export Excel
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Report Types Grid */}
			<div>
				<h2 className="text-lg font-semibold mb-4">Available Reports</h2>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{reportTypes.map((report) => {
						const Icon = report.icon;
						return (
							<Link key={report.id} href={report.href}>
								<Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
									<CardHeader>
										<div className="flex items-center gap-3">
											<div className="p-2 rounded-lg bg-primary/10">
												<Icon className="h-5 w-5 text-primary" />
											</div>
											<CardTitle className="text-base">{report.title}</CardTitle>
										</div>
									</CardHeader>
									<CardContent>
										<CardDescription>{report.description}</CardDescription>
									</CardContent>
								</Card>
							</Link>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function ReportsPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-4 w-48" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`card-${i}`} className="h-32 rounded-lg" />
				))}
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 8 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`report-${i}`} className="h-32 rounded-lg" />
				))}
			</div>
		</div>
	);
}
