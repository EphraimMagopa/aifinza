"use client";

import { ArrowLeft, Download, FileText } from "lucide-react";
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

interface VATReport {
	outputVAT: {
		standardRated: { sales: number; vat: number };
		zeroRated: { sales: number; vat: number };
		exempt: { sales: number; vat: number };
		total: { sales: number; vat: number };
	};
	inputVAT: {
		standardRated: { purchases: number; vat: number };
		zeroRated: { purchases: number; vat: number };
		capital: { purchases: number; vat: number };
		total: { purchases: number; vat: number };
	};
	netVAT: number;
	isPayable: boolean;
}

export default function VATReportPage() {
	const { businessId, business, isLoading: businessLoading } = useBusiness();
	const [report, setReport] = useState<VATReport | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [period, setPeriod] = useState("this-month");

	const fetchReport = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/reports/vat?period=${period}`);
			if (response.ok) {
				const data = await response.json();
				setReport(data.report);
			}
		} catch (err) {
			console.error("Failed to fetch VAT report:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, period]);

	useEffect(() => {
		fetchReport();
	}, [fetchReport]);

	if (businessLoading) {
		return <VATReportSkeleton />;
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
						<h1 className="text-2xl font-bold tracking-tight">VAT Report</h1>
						<p className="text-muted-foreground">VAT201 summary for SARS submission</p>
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

			{/* VAT Registration Status */}
			{business && !business.isVatRegistered && (
				<Card className="border-yellow-200 bg-yellow-50">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
							<div>
								<p className="font-medium text-yellow-800">Not VAT Registered</p>
								<p className="text-sm text-yellow-700">
									This business is not registered for VAT. Update your business settings if you need
									to register for VAT.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{isLoading ? (
				<VATReportSkeleton />
			) : report ? (
				<>
					{/* Summary Card */}
					<Card className={cn(report.isPayable ? "border-red-200" : "border-green-200")}>
						<CardHeader>
							<CardTitle>VAT Summary</CardTitle>
							<CardDescription>
								{report.isPayable
									? "You owe SARS for this period"
									: "SARS owes you a refund for this period"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-3">
								<div className="text-center p-4 bg-muted rounded-lg">
									<p className="text-sm text-muted-foreground">Output VAT (Collected)</p>
									<p className="text-2xl font-bold text-red-600">
										{formatCurrency(report.outputVAT.total.vat)}
									</p>
								</div>
								<div className="text-center p-4 bg-muted rounded-lg">
									<p className="text-sm text-muted-foreground">Input VAT (Paid)</p>
									<p className="text-2xl font-bold text-green-600">
										{formatCurrency(report.inputVAT.total.vat)}
									</p>
								</div>
								<div
									className={cn(
										"text-center p-4 rounded-lg",
										report.isPayable ? "bg-red-100" : "bg-green-100"
									)}
								>
									<p className="text-sm text-muted-foreground">
										{report.isPayable ? "VAT Payable" : "VAT Refundable"}
									</p>
									<p
										className={cn(
											"text-2xl font-bold",
											report.isPayable ? "text-red-600" : "text-green-600"
										)}
									>
										{formatCurrency(Math.abs(report.netVAT))}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Output VAT */}
					<Card>
						<CardHeader>
							<CardTitle>Output VAT (Sales)</CardTitle>
							<CardDescription>VAT collected on sales</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Category</TableHead>
										<TableHead className="text-right">Sales (Excl. VAT)</TableHead>
										<TableHead className="text-right">VAT @ 15%</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>Standard rated (15%)</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.standardRated.sales)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.standardRated.vat)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Zero rated (0%)</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.zeroRated.sales)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.zeroRated.vat)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Exempt</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.exempt.sales)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.exempt.vat)}
										</TableCell>
									</TableRow>
									<TableRow className="font-bold bg-muted/50">
										<TableCell>Total Output VAT</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.outputVAT.total.sales)}
										</TableCell>
										<TableCell className="text-right text-red-600">
											{formatCurrency(report.outputVAT.total.vat)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Input VAT */}
					<Card>
						<CardHeader>
							<CardTitle>Input VAT (Purchases)</CardTitle>
							<CardDescription>VAT paid on purchases (claimable)</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Category</TableHead>
										<TableHead className="text-right">Purchases (Excl. VAT)</TableHead>
										<TableHead className="text-right">VAT @ 15%</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									<TableRow>
										<TableCell>Standard rated (15%)</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.standardRated.purchases)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.standardRated.vat)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Zero rated (0%)</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.zeroRated.purchases)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.zeroRated.vat)}
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell>Capital goods</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.capital.purchases)}
										</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.capital.vat)}
										</TableCell>
									</TableRow>
									<TableRow className="font-bold bg-muted/50">
										<TableCell>Total Input VAT</TableCell>
										<TableCell className="text-right">
											{formatCurrency(report.inputVAT.total.purchases)}
										</TableCell>
										<TableCell className="text-right text-green-600">
											{formatCurrency(report.inputVAT.total.vat)}
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Calculation */}
					<Card>
						<CardHeader>
							<CardTitle>VAT Calculation</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex justify-between py-2">
									<span>Output VAT (A)</span>
									<span className="font-medium">{formatCurrency(report.outputVAT.total.vat)}</span>
								</div>
								<div className="flex justify-between py-2">
									<span>Less: Input VAT (B)</span>
									<span className="font-medium text-green-600">
										-{formatCurrency(report.inputVAT.total.vat)}
									</span>
								</div>
								<Separator />
								<div className="flex justify-between py-2">
									<span className="font-bold">
										{report.isPayable ? "VAT Payable (A - B)" : "VAT Refundable (B - A)"}
									</span>
									<span
										className={cn(
											"font-bold text-lg",
											report.isPayable ? "text-red-600" : "text-green-600"
										)}
									>
										{formatCurrency(Math.abs(report.netVAT))}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			) : (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">No VAT data available for this period</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function VATReportSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-48" />
				</div>
			</div>
			<Skeleton className="h-32 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
