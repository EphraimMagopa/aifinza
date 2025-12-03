"use client";

import { AlertCircle, Calendar, CheckCircle2, Clock, FileText, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface TaxPeriod {
	id: string;
	type: string;
	startDate: string;
	endDate: string;
	dueDate: string;
	status: string;
	vatOutput: number | null;
	vatInput: number | null;
	vatPayable: number | null;
	submittedAt: string | null;
	referenceNumber: string | null;
}

interface TaxSummary {
	vatRegistered: boolean;
	vatNumber: string | null;
	vatCycle: string | null;
	currentPeriod: TaxPeriod | null;
	upcomingDeadlines: { type: string; dueDate: string; description: string }[];
	yearToDateVat: number;
	yearToDateIncomeTax: number;
}

export default function TaxPage() {
	const { businessId, business, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [taxPeriods, setTaxPeriods] = useState<TaxPeriod[]>([]);
	const [summary, setSummary] = useState<TaxSummary | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchTaxData = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const [periodsRes, summaryRes] = await Promise.all([
				fetch(`/api/businesses/${businessId}/tax/periods`),
				fetch(`/api/businesses/${businessId}/tax/summary`),
			]);

			if (periodsRes.ok) {
				const data = await periodsRes.json();
				setTaxPeriods(data.periods || []);
			}

			if (summaryRes.ok) {
				const data = await summaryRes.json();
				setSummary(data.summary);
			}
		} catch (err) {
			console.error("Failed to fetch tax data:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchTaxData();
	}, [fetchTaxData]);

	const statusColors: Record<string, string> = {
		OPEN: "bg-blue-100 text-blue-800",
		IN_PROGRESS: "bg-yellow-100 text-yellow-800",
		READY_TO_SUBMIT: "bg-orange-100 text-orange-800",
		SUBMITTED: "bg-green-100 text-green-800",
		PAID: "bg-purple-100 text-purple-800",
		OVERDUE: "bg-red-100 text-red-800",
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "SUBMITTED":
			case "PAID":
				return <CheckCircle2 className="h-4 w-4 text-green-600" />;
			case "OVERDUE":
				return <AlertCircle className="h-4 w-4 text-red-600" />;
			case "IN_PROGRESS":
			case "READY_TO_SUBMIT":
				return <Clock className="h-4 w-4 text-yellow-600" />;
			default:
				return <FileText className="h-4 w-4 text-blue-600" />;
		}
	};

	if (businessLoading) {
		return <TaxPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Create or select a business to manage taxes.</p>
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
					<h1 className="text-2xl font-bold tracking-tight">Tax Management</h1>
					<p className="text-muted-foreground">
						Manage VAT returns, tax periods, and SARS compliance
					</p>
				</div>
				{canManage && (
					<Button asChild>
						<Link href="/tax/periods/new">
							<Plus className="mr-2 h-4 w-4" />
							New Tax Period
						</Link>
					</Button>
				)}
			</div>

			{/* VAT Registration Status */}
			{business && !business.isVatRegistered && (
				<Card className="border-yellow-200 bg-yellow-50">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
							<div>
								<p className="font-medium text-yellow-800">Not VAT Registered</p>
								<p className="text-sm text-yellow-700">
									Your business is not registered for VAT. If your turnover exceeds R1 million per
									year, you must register for VAT with SARS.
								</p>
								<Button variant="outline" size="sm" className="mt-2" asChild>
									<Link href="/settings/business">Update Business Settings</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{isLoading ? (
				<TaxPageSkeleton />
			) : (
				<>
					{/* Summary Cards */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">VAT Status</CardTitle>
								<Receipt className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{summary?.vatRegistered ? "Registered" : "Not Registered"}
								</div>
								{summary?.vatNumber && (
									<p className="text-xs text-muted-foreground">VAT No: {summary.vatNumber}</p>
								)}
								{summary?.vatCycle && (
									<p className="text-xs text-muted-foreground">
										Filing: {summary.vatCycle.replace("_", " ")}
									</p>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Current Period</CardTitle>
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								{summary?.currentPeriod ? (
									<>
										<div className="text-2xl font-bold">
											{formatDate(new Date(summary.currentPeriod.endDate), {
												month: "short",
												year: "numeric",
											})}
										</div>
										<p className="text-xs text-muted-foreground">
											Due:{" "}
											{formatDate(new Date(summary.currentPeriod.dueDate), {
												day: "2-digit",
												month: "short",
												year: "numeric",
											})}
										</p>
									</>
								) : (
									<div className="text-2xl font-bold text-muted-foreground">-</div>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">YTD VAT Paid</CardTitle>
								<FileText className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div
									className={cn(
										"text-2xl font-bold",
										(summary?.yearToDateVat || 0) > 0 ? "text-red-600" : "text-green-600"
									)}
								>
									{formatCurrency(Math.abs(summary?.yearToDateVat || 0))}
								</div>
								<p className="text-xs text-muted-foreground">
									{(summary?.yearToDateVat || 0) > 0 ? "Payable" : "Refundable"}
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Next Deadline</CardTitle>
								<Clock className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								{summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0 ? (
									<>
										<div className="text-2xl font-bold">
											{formatDate(new Date(summary.upcomingDeadlines[0].dueDate), {
												day: "2-digit",
												month: "short",
											})}
										</div>
										<p className="text-xs text-muted-foreground">
											{summary.upcomingDeadlines[0].description}
										</p>
									</>
								) : (
									<div className="text-2xl font-bold text-muted-foreground">No deadlines</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Upcoming Deadlines */}
					{summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Upcoming Tax Deadlines</CardTitle>
								<CardDescription>Important dates for SARS submissions</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{summary.upcomingDeadlines.map((deadline, index) => {
										const daysUntil = Math.ceil(
											(new Date(deadline.dueDate).getTime() - new Date().getTime()) /
												(1000 * 60 * 60 * 24)
										);
										const isUrgent = daysUntil <= 7;

										return (
											<div
												key={`deadline-${deadline.type}-${index}`}
												className={cn(
													"flex items-center justify-between p-3 rounded-lg border",
													isUrgent && "border-red-200 bg-red-50"
												)}
											>
												<div className="flex items-center gap-3">
													{isUrgent ? (
														<AlertCircle className="h-5 w-5 text-red-600" />
													) : (
														<Calendar className="h-5 w-5 text-muted-foreground" />
													)}
													<div>
														<p className="font-medium">{deadline.description}</p>
														<p className="text-sm text-muted-foreground">{deadline.type}</p>
													</div>
												</div>
												<div className="text-right">
													<p className="font-medium">
														{formatDate(new Date(deadline.dueDate), {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</p>
													<p
														className={cn(
															"text-sm",
															isUrgent ? "text-red-600 font-medium" : "text-muted-foreground"
														)}
													>
														{daysUntil <= 0
															? "Overdue!"
															: daysUntil === 1
																? "Tomorrow"
																: `${daysUntil} days`}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Tax Periods Table */}
					<Card>
						<CardHeader>
							<CardTitle>Tax Periods</CardTitle>
							<CardDescription>VAT and income tax filing periods</CardDescription>
						</CardHeader>
						<CardContent>
							{taxPeriods.length === 0 ? (
								<div className="text-center py-12">
									<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="font-medium">No tax periods found</p>
									<p className="text-sm text-muted-foreground mb-4">
										Create your first tax period to start tracking submissions
									</p>
									{canManage && (
										<Button asChild>
											<Link href="/tax/periods/new">
												<Plus className="mr-2 h-4 w-4" />
												Create Tax Period
											</Link>
										</Button>
									)}
								</div>
							) : (
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Period</TableHead>
												<TableHead>Type</TableHead>
												<TableHead>Due Date</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">VAT Payable</TableHead>
												<TableHead>Reference</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{taxPeriods.map((period) => {
												const isOverdue =
													new Date(period.dueDate) < new Date() && period.status !== "SUBMITTED";

												return (
													<TableRow key={period.id}>
														<TableCell>
															<Link
																href={`/tax/periods/${period.id}`}
																className="font-medium hover:underline"
															>
																{formatDate(new Date(period.startDate), {
																	month: "short",
																	year: "numeric",
																})}{" "}
																-{" "}
																{formatDate(new Date(period.endDate), {
																	month: "short",
																	year: "numeric",
																})}
															</Link>
														</TableCell>
														<TableCell>{period.type.replace("_", " ")}</TableCell>
														<TableCell className={cn(isOverdue && "text-red-600 font-medium")}>
															{formatDate(new Date(period.dueDate), {
																day: "2-digit",
																month: "short",
																year: "numeric",
															})}
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																{getStatusIcon(isOverdue ? "OVERDUE" : period.status)}
																<Badge
																	className={
																		statusColors[isOverdue ? "OVERDUE" : period.status] || ""
																	}
																>
																	{isOverdue ? "OVERDUE" : period.status}
																</Badge>
															</div>
														</TableCell>
														<TableCell className="text-right">
															{period.vatPayable !== null ? (
																<span
																	className={cn(
																		"font-medium",
																		period.vatPayable > 0 ? "text-red-600" : "text-green-600"
																	)}
																>
																	{formatCurrency(Math.abs(period.vatPayable))}
																	{period.vatPayable < 0 && " (Refund)"}
																</span>
															) : (
																"-"
															)}
														</TableCell>
														<TableCell className="text-muted-foreground">
															{period.referenceNumber || "-"}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Quick Links */}
					<div className="grid gap-4 md:grid-cols-3">
						<Link href="/reports/vat">
							<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2">
										<Receipt className="h-5 w-5" />
										VAT Report
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>View detailed VAT calculations for any period</CardDescription>
								</CardContent>
							</Card>
						</Link>

						<Link href="/settings/business">
							<Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
								<CardHeader>
									<CardTitle className="text-base flex items-center gap-2">
										<FileText className="h-5 w-5" />
										Tax Settings
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription>Update VAT registration and tax numbers</CardDescription>
								</CardContent>
							</Card>
						</Link>

						<Card className="opacity-60">
							<CardHeader>
								<CardTitle className="text-base flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									SARS eFiling
								</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription>Direct integration coming soon</CardDescription>
							</CardContent>
						</Card>
					</div>
				</>
			)}
		</div>
	);
}

function TaxPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={`card-${i}`} className="h-28 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-48 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
