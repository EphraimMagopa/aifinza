"use client";

import { ArrowLeft, Download, TrendingDown, TrendingUp } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useBusiness } from "@/hooks/use-business";
import { cn, formatCurrency } from "@/lib/utils";

interface CategoryTotal {
	categoryId: string | null;
	categoryName: string;
	amount: number;
}

interface ProfitLossReport {
	income: {
		categories: CategoryTotal[];
		total: number;
	};
	costOfSales: {
		categories: CategoryTotal[];
		total: number;
	};
	expenses: {
		categories: CategoryTotal[];
		total: number;
	};
	grossProfit: number;
	netProfit: number;
	grossProfitMargin: number;
	netProfitMargin: number;
}

export default function ProfitLossPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const [report, setReport] = useState<ProfitLossReport | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [period, setPeriod] = useState("this-month");

	const fetchReport = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const response = await fetch(
				`/api/businesses/${businessId}/reports/profit-loss?period=${period}`
			);
			if (response.ok) {
				const data = await response.json();
				setReport(data.report);
			}
		} catch (err) {
			console.error("Failed to fetch profit & loss report:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, period]);

	useEffect(() => {
		fetchReport();
	}, [fetchReport]);

	if (businessLoading) {
		return <ProfitLossSkeleton />;
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
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/reports">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Profit & Loss Statement</h1>
						<p className="text-muted-foreground">Income and expenses for the selected period</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
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
					<Button variant="outline" disabled>
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
				</div>
			</div>

			{isLoading ? (
				<ProfitLossSkeleton />
			) : report ? (
				<>
					{/* Summary Cards */}
					<div className="grid gap-4 md:grid-cols-4">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Income
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600">
									{formatCurrency(report.income.total)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Total Expenses
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-red-600">
									{formatCurrency(report.expenses.total + report.costOfSales.total)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Gross Profit
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className={cn(
										"text-2xl font-bold",
										report.grossProfit >= 0 ? "text-green-600" : "text-red-600"
									)}
								>
									{formatCurrency(report.grossProfit)}
								</div>
								<p className="text-xs text-muted-foreground">
									{report.grossProfitMargin.toFixed(1)}% margin
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									Net Profit
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div
									className={cn(
										"text-2xl font-bold",
										report.netProfit >= 0 ? "text-green-600" : "text-red-600"
									)}
								>
									{formatCurrency(report.netProfit)}
								</div>
								<p className="text-xs text-muted-foreground">
									{report.netProfitMargin.toFixed(1)}% margin
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Report */}
					<Card>
						<CardHeader>
							<CardTitle>Detailed Breakdown</CardTitle>
							<CardDescription>Income and expenses by category</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{/* Income Section */}
								<div>
									<div className="flex items-center gap-2 mb-3">
										<TrendingUp className="h-5 w-5 text-green-600" />
										<h3 className="font-semibold text-lg">Income</h3>
									</div>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Category</TableHead>
												<TableHead className="text-right">Amount</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{report.income.categories.length === 0 ? (
												<TableRow>
													<TableCell colSpan={2} className="text-center text-muted-foreground">
														No income recorded
													</TableCell>
												</TableRow>
											) : (
												report.income.categories.map((cat) => (
													<TableRow key={cat.categoryId || "uncategorized"}>
														<TableCell>{cat.categoryName}</TableCell>
														<TableCell className="text-right">
															{formatCurrency(cat.amount)}
														</TableCell>
													</TableRow>
												))
											)}
											<TableRow className="font-bold bg-muted/50">
												<TableCell>Total Income</TableCell>
												<TableCell className="text-right text-green-600">
													{formatCurrency(report.income.total)}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>

								{/* Cost of Sales Section */}
								{report.costOfSales.total > 0 && (
									<div>
										<h3 className="font-semibold text-lg mb-3">Cost of Sales</h3>
										<Table>
											<TableBody>
												{report.costOfSales.categories.map((cat) => (
													<TableRow key={cat.categoryId || "uncategorized"}>
														<TableCell>{cat.categoryName}</TableCell>
														<TableCell className="text-right">
															{formatCurrency(cat.amount)}
														</TableCell>
													</TableRow>
												))}
												<TableRow className="font-bold bg-muted/50">
													<TableCell>Total Cost of Sales</TableCell>
													<TableCell className="text-right text-red-600">
														{formatCurrency(report.costOfSales.total)}
													</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</div>
								)}

								{/* Gross Profit */}
								<div className="py-3 px-4 bg-muted rounded-lg">
									<div className="flex justify-between items-center">
										<span className="font-semibold">Gross Profit</span>
										<span
											className={cn(
												"font-bold text-lg",
												report.grossProfit >= 0 ? "text-green-600" : "text-red-600"
											)}
										>
											{formatCurrency(report.grossProfit)}
										</span>
									</div>
								</div>

								<Separator />

								{/* Expenses Section */}
								<div>
									<div className="flex items-center gap-2 mb-3">
										<TrendingDown className="h-5 w-5 text-red-600" />
										<h3 className="font-semibold text-lg">Operating Expenses</h3>
									</div>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Category</TableHead>
												<TableHead className="text-right">Amount</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{report.expenses.categories.length === 0 ? (
												<TableRow>
													<TableCell colSpan={2} className="text-center text-muted-foreground">
														No expenses recorded
													</TableCell>
												</TableRow>
											) : (
												report.expenses.categories.map((cat) => (
													<TableRow key={cat.categoryId || "uncategorized"}>
														<TableCell>{cat.categoryName}</TableCell>
														<TableCell className="text-right">
															{formatCurrency(cat.amount)}
														</TableCell>
													</TableRow>
												))
											)}
											<TableRow className="font-bold bg-muted/50">
												<TableCell>Total Operating Expenses</TableCell>
												<TableCell className="text-right text-red-600">
													{formatCurrency(report.expenses.total)}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>

								{/* Net Profit */}
								<div className="py-4 px-4 bg-primary/10 rounded-lg">
									<div className="flex justify-between items-center">
										<span className="font-bold text-lg">Net Profit / (Loss)</span>
										<span
											className={cn(
												"font-bold text-2xl",
												report.netProfit >= 0 ? "text-green-600" : "text-red-600"
											)}
										>
											{formatCurrency(report.netProfit)}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			) : (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">No data available for this period</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function ProfitLossSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={`summary-${i}`} className="h-24 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
