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
import { formatCurrency, formatDate } from "@/lib/utils";
import { quoteStatusOptions } from "@/lib/validations/quote";

interface Quote {
	id: string;
	quoteNumber: string;
	reference: string | null;
	status: string;
	issueDate: string;
	expiryDate: string;
	subtotal: number;
	vatAmount: number;
	discount: number;
	total: number;
	customer: {
		id: string;
		name: string;
		email: string | null;
	};
}

export default function QuotesPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [quotes, setQuotes] = useState<Quote[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const fetchQuotes = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (statusFilter !== "all") params.set("status", statusFilter);

			const response = await fetch(`/api/businesses/${businessId}/quotes?${params}`);
			if (response.ok) {
				const data = await response.json();
				setQuotes(data.quotes || []);
				setTotal(data.total || 0);
			}
		} catch (err) {
			console.error("Failed to fetch quotes:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, statusFilter]);

	useEffect(() => {
		fetchQuotes();
	}, [fetchQuotes]);

	async function handleDelete(quoteId: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this quote?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes/${quoteId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchQuotes();
			}
		} catch (err) {
			console.error("Failed to delete quote:", err);
		}
	}

	async function handleConvert(quoteId: string) {
		if (!businessId) return;
		if (!confirm("Convert this quote to an invoice?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes/${quoteId}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			if (response.ok) {
				const data = await response.json();
				// Redirect to the new invoice
				window.location.href = `/invoices/${data.invoice.id}`;
			}
		} catch (err) {
			console.error("Failed to convert quote:", err);
		}
	}

	const statusColors: Record<string, string> = {
		DRAFT: "bg-gray-100 text-gray-800",
		SENT: "bg-blue-100 text-blue-800",
		ACCEPTED: "bg-green-100 text-green-800",
		DECLINED: "bg-red-100 text-red-800",
		EXPIRED: "bg-yellow-100 text-yellow-800",
		INVOICED: "bg-purple-100 text-purple-800",
	};

	if (businessLoading) {
		return <QuotesPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Create or select a business to manage quotes.</p>
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
					<h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
					<p className="text-muted-foreground">Create and manage customer quotations</p>
				</div>
				{canManage && (
					<Button asChild>
						<Link href="/quotes/new">
							<Plus className="mr-2 h-4 w-4" />
							Create Quote
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
								{quoteStatusOptions.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Quotes List */}
			<Card>
				<CardHeader>
					<CardTitle>Quotes</CardTitle>
					<CardDescription>
						{total} quote{total !== 1 ? "s" : ""} found
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<TableSkeleton />
					) : quotes.length === 0 ? (
						<div className="text-center py-8">
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="font-medium">No quotes found</p>
							<p className="text-sm text-muted-foreground">
								{statusFilter !== "all"
									? "Try a different filter"
									: "Create your first quote to get started"}
							</p>
						</div>
					) : (
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Quote #</TableHead>
										<TableHead>Customer</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Expires</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="text-right">Total</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{quotes.map((quote) => (
										<TableRow key={quote.id}>
											<TableCell>
												<Link href={`/quotes/${quote.id}`} className="font-medium hover:underline">
													{quote.quoteNumber}
												</Link>
												{quote.reference && (
													<p className="text-xs text-muted-foreground">Ref: {quote.reference}</p>
												)}
											</TableCell>
											<TableCell>
												<Link href={`/customers/${quote.customer.id}`} className="hover:underline">
													{quote.customer.name}
												</Link>
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{formatDate(new Date(quote.issueDate), {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}
											</TableCell>
											<TableCell className="whitespace-nowrap">
												{formatDate(new Date(quote.expiryDate), {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}
											</TableCell>
											<TableCell>
												<Badge className={statusColors[quote.status] || ""}>{quote.status}</Badge>
											</TableCell>
											<TableCell className="text-right font-medium">
												{formatCurrency(quote.total)}
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
																<Link href={`/quotes/${quote.id}`}>View Details</Link>
															</DropdownMenuItem>
															{quote.status !== "INVOICED" && (
																<>
																	<DropdownMenuItem asChild>
																		<Link href={`/quotes/${quote.id}/edit`}>Edit</Link>
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => handleConvert(quote.id)}>
																		Convert to Invoice
																	</DropdownMenuItem>
																</>
															)}
															<DropdownMenuSeparator />
															{quote.status !== "INVOICED" && (
																<DropdownMenuItem
																	onClick={() => handleDelete(quote.id)}
																	className="text-red-600"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	Delete
																</DropdownMenuItem>
															)}
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</TableCell>
										</TableRow>
									))}
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
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
				<Skeleton key={`row-${i}`} className="h-16 w-full" />
			))}
		</div>
	);
}

function QuotesPageSkeleton() {
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
