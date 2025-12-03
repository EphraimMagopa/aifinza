"use client";

import {
	ArrowLeft,
	Building,
	Calendar,
	CreditCard,
	DollarSign,
	FileText,
	Mail,
	MapPin,
	Phone,
	User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusiness } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface CustomerDetail {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
	vatNumber: string | null;
	addressLine1: string | null;
	addressLine2: string | null;
	city: string | null;
	province: string | null;
	postalCode: string | null;
	country: string;
	paymentTerms: number;
	creditLimit: number | null;
	notes: string | null;
	isActive: boolean;
	outstandingBalance: number;
	totalRevenue: number;
	invoices: Array<{
		id: string;
		invoiceNumber: string;
		status: string;
		issueDate: string;
		dueDate: string;
		total: number;
		amountPaid: number;
	}>;
	_count: {
		invoices: number;
		quotes: number;
		transactions: number;
	};
}

interface StatementLine {
	id: string;
	date: string;
	type: "INVOICE" | "PAYMENT" | "CREDIT";
	reference: string;
	description: string;
	debit: number;
	credit: number;
	balance: number;
}

interface Statement {
	lines: StatementLine[];
	summary: {
		totalDebits: number;
		totalCredits: number;
		closingBalance: number;
	};
	aging: {
		current: number;
		days30: number;
		days60: number;
		days90: number;
		over90: number;
	};
}

export default function CustomerDetailPage() {
	const params = useParams();
	const customerId = params.customerId as string;
	const { businessId, isLoading: businessLoading } = useBusiness();

	const [customer, setCustomer] = useState<CustomerDetail | null>(null);
	const [statement, setStatement] = useState<Statement | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingStatement, setIsLoadingStatement] = useState(false);
	const [statementFrom, setStatementFrom] = useState("");
	const [statementTo, setStatementTo] = useState("");

	const fetchCustomer = useCallback(async () => {
		if (!businessId || !customerId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/customers/${customerId}`);
			if (response.ok) {
				const data = await response.json();
				setCustomer(data.customer);
			}
		} catch (err) {
			console.error("Failed to fetch customer:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, customerId]);

	const fetchStatement = useCallback(async () => {
		if (!businessId || !customerId) return;

		setIsLoadingStatement(true);
		try {
			const params = new URLSearchParams();
			if (statementFrom) params.set("from", statementFrom);
			if (statementTo) params.set("to", statementTo);

			const response = await fetch(
				`/api/businesses/${businessId}/customers/${customerId}/statement?${params}`
			);
			if (response.ok) {
				const data = await response.json();
				setStatement(data.statement);
			}
		} catch (err) {
			console.error("Failed to fetch statement:", err);
		} finally {
			setIsLoadingStatement(false);
		}
	}, [businessId, customerId, statementFrom, statementTo]);

	useEffect(() => {
		fetchCustomer();
	}, [fetchCustomer]);

	useEffect(() => {
		if (businessId && customerId) {
			fetchStatement();
		}
	}, [fetchStatement, businessId, customerId]);

	if (businessLoading || isLoading) {
		return <CustomerDetailSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Select a business to view customer details.</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<User className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The customer you're looking for doesn't exist or you don't have access.
				</p>
				<Button asChild>
					<Link href="/customers">Back to Customers</Link>
				</Button>
			</div>
		);
	}

	const statusColors: Record<string, string> = {
		DRAFT: "bg-gray-100 text-gray-800",
		SENT: "bg-blue-100 text-blue-800",
		VIEWED: "bg-purple-100 text-purple-800",
		PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
		PAID: "bg-green-100 text-green-800",
		OVERDUE: "bg-red-100 text-red-800",
		CANCELLED: "bg-gray-100 text-gray-800",
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/customers">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
						<Badge variant={customer.isActive ? "default" : "secondary"}>
							{customer.isActive ? "Active" : "Inactive"}
						</Badge>
					</div>
					{customer.vatNumber && <p className="text-muted-foreground">VAT: {customer.vatNumber}</p>}
				</div>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href={`/invoices/new?customerId=${customer.id}`}>
							<FileText className="mr-2 h-4 w-4" />
							New Invoice
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href={`/quotes/new?customerId=${customer.id}`}>New Quote</Link>
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div
							className={cn(
								"text-2xl font-bold",
								customer.outstandingBalance > 0 ? "text-orange-600" : ""
							)}
						>
							{formatCurrency(customer.outstandingBalance)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<CreditCard className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">
							{formatCurrency(customer.totalRevenue)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Invoices</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{customer._count.invoices}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{customer.paymentTerms} days</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="details">
				<TabsList>
					<TabsTrigger value="details">Details</TabsTrigger>
					<TabsTrigger value="invoices">Invoices</TabsTrigger>
					<TabsTrigger value="statement">Statement</TabsTrigger>
				</TabsList>

				<TabsContent value="details" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Contact Info */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Contact Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{customer.email && (
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<a href={`mailto:${customer.email}`} className="hover:underline">
											{customer.email}
										</a>
									</div>
								)}
								{customer.phone && (
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<a href={`tel:${customer.phone}`} className="hover:underline">
											{customer.phone}
										</a>
									</div>
								)}
								{!customer.email && !customer.phone && (
									<p className="text-muted-foreground">No contact information</p>
								)}
							</CardContent>
						</Card>

						{/* Address */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Billing Address</CardTitle>
							</CardHeader>
							<CardContent>
								{customer.addressLine1 || customer.city || customer.province ? (
									<div className="flex items-start gap-2">
										<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
										<div>
											{customer.addressLine1 && <p>{customer.addressLine1}</p>}
											{customer.addressLine2 && <p>{customer.addressLine2}</p>}
											{(customer.city || customer.province || customer.postalCode) && (
												<p>
													{[customer.city, customer.province, customer.postalCode]
														.filter(Boolean)
														.join(", ")}
												</p>
											)}
											{customer.country && <p>{customer.country}</p>}
										</div>
									</div>
								) : (
									<p className="text-muted-foreground">No address on file</p>
								)}
							</CardContent>
						</Card>

						{/* Settings */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Account Settings</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-2">
									<Building className="h-4 w-4 text-muted-foreground" />
									<span>Credit Limit: </span>
									<span className="font-medium">
										{customer.creditLimit ? formatCurrency(customer.creditLimit) : "No limit"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span>Payment Terms: </span>
									<span className="font-medium">{customer.paymentTerms} days</span>
								</div>
							</CardContent>
						</Card>

						{/* Notes */}
						{customer.notes && (
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Notes</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="whitespace-pre-wrap">{customer.notes}</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="invoices">
					<Card>
						<CardHeader>
							<CardTitle>Recent Invoices</CardTitle>
							<CardDescription>Last 10 invoices for this customer</CardDescription>
						</CardHeader>
						<CardContent>
							{customer.invoices.length === 0 ? (
								<div className="text-center py-8">
									<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="font-medium">No invoices yet</p>
									<p className="text-sm text-muted-foreground">
										Create your first invoice for this customer
									</p>
									<Button className="mt-4" asChild>
										<Link href={`/invoices/new?customerId=${customer.id}`}>Create Invoice</Link>
									</Button>
								</div>
							) : (
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Invoice #</TableHead>
												<TableHead>Issue Date</TableHead>
												<TableHead>Due Date</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Total</TableHead>
												<TableHead className="text-right">Paid</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{customer.invoices.map((invoice) => (
												<TableRow key={invoice.id}>
													<TableCell>
														<Link
															href={`/invoices/${invoice.id}`}
															className="font-medium hover:underline"
														>
															{invoice.invoiceNumber}
														</Link>
													</TableCell>
													<TableCell>
														{formatDate(new Date(invoice.issueDate), {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</TableCell>
													<TableCell>
														{formatDate(new Date(invoice.dueDate), {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</TableCell>
													<TableCell>
														<Badge className={statusColors[invoice.status] || ""}>
															{invoice.status.replace("_", " ")}
														</Badge>
													</TableCell>
													<TableCell className="text-right font-medium">
														{formatCurrency(invoice.total)}
													</TableCell>
													<TableCell className="text-right">
														{formatCurrency(invoice.amountPaid)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="statement">
					<Card>
						<CardHeader>
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
								<div>
									<CardTitle>Customer Statement</CardTitle>
									<CardDescription>Account activity and aging analysis</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<div className="space-y-1">
										<Label htmlFor="from" className="text-xs">
											From
										</Label>
										<Input
											id="from"
											type="date"
											value={statementFrom}
											onChange={(e) => setStatementFrom(e.target.value)}
											className="w-36"
										/>
									</div>
									<div className="space-y-1">
										<Label htmlFor="to" className="text-xs">
											To
										</Label>
										<Input
											id="to"
											type="date"
											value={statementTo}
											onChange={(e) => setStatementTo(e.target.value)}
											className="w-36"
										/>
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{isLoadingStatement ? (
								<div className="space-y-3">
									<Skeleton className="h-20 w-full" />
									<Skeleton className="h-40 w-full" />
								</div>
							) : statement ? (
								<>
									{/* Aging Analysis */}
									<div className="grid gap-4 sm:grid-cols-5">
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">Current</p>
												<p className="text-lg font-semibold">
													{formatCurrency(statement.aging.current)}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">30 Days</p>
												<p className="text-lg font-semibold">
													{formatCurrency(statement.aging.days30)}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">60 Days</p>
												<p className="text-lg font-semibold text-yellow-600">
													{formatCurrency(statement.aging.days60)}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">90 Days</p>
												<p className="text-lg font-semibold text-orange-600">
													{formatCurrency(statement.aging.days90)}
												</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-4">
												<p className="text-xs text-muted-foreground">90+ Days</p>
												<p className="text-lg font-semibold text-red-600">
													{formatCurrency(statement.aging.over90)}
												</p>
											</CardContent>
										</Card>
									</div>

									{/* Statement Lines */}
									{statement.lines.length === 0 ? (
										<div className="text-center py-8">
											<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
											<p className="font-medium">No transactions found</p>
											<p className="text-sm text-muted-foreground">
												{statementFrom || statementTo
													? "Try adjusting the date range"
													: "No invoices or payments recorded for this customer"}
											</p>
										</div>
									) : (
										<div className="rounded-lg border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Date</TableHead>
														<TableHead>Type</TableHead>
														<TableHead>Reference</TableHead>
														<TableHead>Description</TableHead>
														<TableHead className="text-right">Debit</TableHead>
														<TableHead className="text-right">Credit</TableHead>
														<TableHead className="text-right">Balance</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{statement.lines.map((line) => (
														<TableRow key={line.id}>
															<TableCell className="whitespace-nowrap">
																{formatDate(new Date(line.date), {
																	day: "2-digit",
																	month: "short",
																	year: "numeric",
																})}
															</TableCell>
															<TableCell>
																<Badge variant={line.type === "INVOICE" ? "default" : "secondary"}>
																	{line.type}
																</Badge>
															</TableCell>
															<TableCell>{line.reference}</TableCell>
															<TableCell className="max-w-xs truncate">
																{line.description}
															</TableCell>
															<TableCell className="text-right">
																{line.debit > 0 ? formatCurrency(line.debit) : "-"}
															</TableCell>
															<TableCell className="text-right">
																{line.credit > 0 ? formatCurrency(line.credit) : "-"}
															</TableCell>
															<TableCell className="text-right font-medium">
																{formatCurrency(line.balance)}
															</TableCell>
														</TableRow>
													))}
													{/* Summary Row */}
													<TableRow className="bg-muted/50 font-medium">
														<TableCell colSpan={4} className="text-right">
															Totals
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(statement.summary.totalDebits)}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(statement.summary.totalCredits)}
														</TableCell>
														<TableCell className="text-right">
															{formatCurrency(statement.summary.closingBalance)}
														</TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</div>
									)}
								</>
							) : (
								<p className="text-center text-muted-foreground py-8">Failed to load statement</p>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

function CustomerDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`stat-${i}`} className="h-24 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
