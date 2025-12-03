"use client";

import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface CustomerAging {
	customerId: string;
	customerName: string;
	current: number;
	days30: number;
	days60: number;
	days90: number;
	days120Plus: number;
	total: number;
}

interface AgingTotals {
	current: number;
	days30: number;
	days60: number;
	days90: number;
	days120Plus: number;
	total: number;
}

interface AgedReceivablesReport {
	customers: CustomerAging[];
	totals: AgingTotals;
}

export default function AgedReceivablesPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const [report, setReport] = useState<AgedReceivablesReport | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchReport = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/reports/aged-receivables`);
			if (response.ok) {
				const data = await response.json();
				setReport(data.report);
			}
		} catch (err) {
			console.error("Failed to fetch aged receivables report:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchReport();
	}, [fetchReport]);

	if (businessLoading) {
		return <AgedReceivablesSkeleton />;
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
						<h1 className="text-2xl font-bold tracking-tight">Aged Receivables</h1>
						<p className="text-muted-foreground">Outstanding customer invoices by age</p>
					</div>
				</div>
				<Button variant="outline" disabled>
					<Download className="mr-2 h-4 w-4" />
					Export
				</Button>
			</div>

			{isLoading ? (
				<AgedReceivablesSkeleton />
			) : report ? (
				<>
					{/* Summary Cards */}
					<div className="grid gap-4 md:grid-cols-6">
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">Current</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold text-green-600">
									{formatCurrency(report.totals.current)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									1-30 Days
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold text-yellow-600">
									{formatCurrency(report.totals.days30)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									31-60 Days
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold text-orange-600">
									{formatCurrency(report.totals.days60)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									61-90 Days
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold text-red-500">
									{formatCurrency(report.totals.days90)}
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium text-muted-foreground">
									90+ Days
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold text-red-700">
									{formatCurrency(report.totals.days120Plus)}
								</div>
							</CardContent>
						</Card>
						<Card className="bg-muted/50">
							<CardHeader className="pb-2">
								<CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-xl font-bold">{formatCurrency(report.totals.total)}</div>
							</CardContent>
						</Card>
					</div>

					{/* Detailed Table */}
					<Card>
						<CardHeader>
							<CardTitle>Customer Breakdown</CardTitle>
							<CardDescription>Outstanding amounts by customer and age</CardDescription>
						</CardHeader>
						<CardContent>
							{report.customers.length === 0 ? (
								<div className="text-center py-12">
									<p className="text-muted-foreground">No outstanding receivables</p>
								</div>
							) : (
								<div className="rounded-lg border overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Customer</TableHead>
												<TableHead className="text-right">Current</TableHead>
												<TableHead className="text-right">1-30 Days</TableHead>
												<TableHead className="text-right">31-60 Days</TableHead>
												<TableHead className="text-right">61-90 Days</TableHead>
												<TableHead className="text-right">90+ Days</TableHead>
												<TableHead className="text-right">Total</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{report.customers.map((customer) => (
												<TableRow key={customer.customerId}>
													<TableCell>
														<Link
															href={`/customers/${customer.customerId}`}
															className="font-medium hover:underline"
														>
															{customer.customerName}
														</Link>
													</TableCell>
													<TableCell className="text-right">
														{customer.current > 0 ? (
															<span className="text-green-600">
																{formatCurrency(customer.current)}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right">
														{customer.days30 > 0 ? (
															<span className="text-yellow-600">
																{formatCurrency(customer.days30)}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right">
														{customer.days60 > 0 ? (
															<span className="text-orange-600">
																{formatCurrency(customer.days60)}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right">
														{customer.days90 > 0 ? (
															<span className="text-red-500">
																{formatCurrency(customer.days90)}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right">
														{customer.days120Plus > 0 ? (
															<span className="text-red-700">
																{formatCurrency(customer.days120Plus)}
															</span>
														) : (
															"-"
														)}
													</TableCell>
													<TableCell className="text-right font-medium">
														{formatCurrency(customer.total)}
													</TableCell>
												</TableRow>
											))}
											{/* Totals Row */}
											<TableRow className="font-bold bg-muted/50">
												<TableCell>Total</TableCell>
												<TableCell className="text-right text-green-600">
													{formatCurrency(report.totals.current)}
												</TableCell>
												<TableCell className="text-right text-yellow-600">
													{formatCurrency(report.totals.days30)}
												</TableCell>
												<TableCell className="text-right text-orange-600">
													{formatCurrency(report.totals.days60)}
												</TableCell>
												<TableCell className="text-right text-red-500">
													{formatCurrency(report.totals.days90)}
												</TableCell>
												<TableCell className="text-right text-red-700">
													{formatCurrency(report.totals.days120Plus)}
												</TableCell>
												<TableCell className="text-right">
													{formatCurrency(report.totals.total)}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			) : (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Failed to load report</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function AgedReceivablesSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={`aging-${i}`} className="h-20 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
