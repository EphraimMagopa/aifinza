"use client";

import { FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
import { invoiceStatusOptions } from "@/lib/validations/invoice";

interface Invoice {
	id: string;
	invoiceNumber: string;
	reference: string | null;
	status: string;
	issueDate: string;
	dueDate: string;
	subtotal: number;
	vatAmount: number;
	discount: number;
	total: number;
	amountPaid: number;
	customer: {
		id: string;
		name: string;
		email: string | null;
	};
}

export default function InvoicesPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const fetchInvoices = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter !== "all") params.set("status", statusFilter);

			const response = await fetch(`/api/businesses/${businessId}/invoices?${params}`);
			if (response.ok) {
				const data = await response.json();
				setInvoices(data.invoices || []);
				setTotal(data.total || 0);
			}
		} catch (err) {
			console.error("Failed to fetch invoices:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, statusFilter]);

	useEffect(() => {
		fetchInvoices();
	}, [fetchInvoices]);

	async function handleDelete(invoiceId: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete/cancel this invoice?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/invoices/${invoiceId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchInvoices();
			}
		} catch (err) {
			console.error("Failed to delete invoice:", err);
		}
	}

	const statusColors: Record<string, string> = {
		DRAFT: "bg-gray-100 text-gray-800",
		SENT: "bg-blue-100 text-blue-800",
		VIEWED: "bg-purple-100 text-purple-800",
		PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
		PAID: "bg-green-100 text-green-800",
		OVERDUE: "bg-red-100 text-red-800",
		CANCELLED: "bg-gray-100 text-gray-800",
		WRITTEN_OFF: "bg-gray-100 text-gray-800",
	};

	if (businessLoading) {
		return <InvoicesPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage invoices.
				</p>
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
					<h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
					<p className="text-muted-foreground">Create and manage customer invoices</p>
				</div>
				{canManage && (
					<Button asChild>
						<Link href="/invoices/new">
							<Plus className="mr-2 h-4 w-4" />
							Create Invoice
						</Link>
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								{invoiceStatusOptions.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Invoices List */}
			<Card>
				<CardHeader>
					<CardTitle>Invoices</CardTitle>
					<CardDescription>
						{total} invoice{total !== 1 ? "s" : ""} found
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<TableSkeleton />
					) : invoices.length === 0 ? (
						<div className="text-center py-8">
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="font-medium">No invoices found</p>
							<p className="text-sm text-muted-foreground">
								{statusFilter !== "all"
									? "Try a different filter"
									: "Create your first invoice to get started"}
							</p>
						</div>
					) : (
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice #</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Issue Date</TableHead>
										<TableHead>Due Date</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Total</TableHead>
										<TableHead className="text-right">Paid</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoices.map((invoice) => {
										const isOverdue =
											new Date(invoice.dueDate) < new Date() &&
											!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status);
										return (
											<TableRow key={invoice.id}>
												<TableCell>
													<Link
														href={`/invoices/${invoice.id}`}
														className="font-medium hover:underline"
													>
														{invoice.invoiceNumber}
													</Link>
													{invoice.reference && (
														<p className="text-xs text-muted-foreground">
															Ref: {invoice.reference}
														</p>
													)}
												</TableCell>
												<TableCell>
													<Link
														href={`/customers/${invoice.customer.id}`}
														className="hover:underline"
													>
														{invoice.customer.name}
													</Link>
												</TableCell>
												<TableCell className="whitespace-nowrap">
													{formatDate(new Date(invoice.issueDate), {
														day: "2-digit",
														month: "short",
														year: "numeric",
													})}
												</TableCell>
												<TableCell className={cn("whitespace-nowrap", isOverdue && "text-red-600")}>
													{formatDate(new Date(invoice.dueDate), {
														day: "2-digit",
														month: "short",
														year: "numeric",
													})}
												</TableCell>
												<TableCell>
													<Badge
														className={statusColors[isOverdue ? "OVERDUE" : invoice.status] || ""}
													>
														{isOverdue ? "OVERDUE" : invoice.status.replace("_", " ")}
													</Badge>
												</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(invoice.total)}
												</TableCell>
												<TableCell className="text-right">
													<span
														className={cn(invoice.amountPaid > 0 && "text-green-600 font-medium")}
													>
														{formatCurrency(invoice.amountPaid)}
													</span>
												</TableCell>
												<TableCell>
													{canManage && (
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon">
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end">
																<DropdownMenuItem asChild>
																	<Link href={`/invoices/${invoice.id}`}>View Details</Link>
																</DropdownMenuItem>
																{invoice.status === "DRAFT" && (
																	<DropdownMenuItem asChild>
																		<Link href={`/invoices/${invoice.id}/edit`}>Edit</Link>
																	</DropdownMenuItem>
																)}
																{!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status) && (
																	<DropdownMenuItem asChild>
																		<Link href={`/invoices/${invoice.id}?payment=true`}>
																			Record Payment
																		</Link>
																	</DropdownMenuItem>
																)}
																<DropdownMenuSeparator />
																{!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status) &&
																	invoice.amountPaid === 0 && (
																		<DropdownMenuItem
																			onClick={() => handleDelete(invoice.id)}
																			className="text-red-600"
																		>
																			<Trash2 className="mr-2 h-4 w-4" />
																			{invoice.status === "DRAFT" ? "Delete" : "Cancel"}
																		</DropdownMenuItem>
																	)}
															</DropdownMenuContent>
														</DropdownMenu>
													)}
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
		</div>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, i) => (
				<Skeleton key={`row-${i}`} className="h-16 w-full" />
			))}
		</div>
	);
}

function InvoicesPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-4 w-48" />
			</div>
			<Skeleton className="h-20 rounded-lg" />
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
