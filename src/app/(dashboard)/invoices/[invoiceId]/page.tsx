"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	Building2,
	CalendarIcon,
	CheckCircle2,
	CreditCard,
	FileText,
	Loader2,
	Mail,
	MoreHorizontal,
	Phone,
	Send,
} from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type RecordPaymentInput, recordPaymentSchema } from "@/lib/validations/invoice";

interface LineItem {
	id: string;
	description: string;
	quantity: number;
	unitPrice: number;
	vatRate: number;
	vatAmount: number;
	lineTotal: number;
}

interface Payment {
	id: string;
	date: string;
	description: string;
	reference: string | null;
	amount: number;
}

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
	paidDate: string | null;
	notes: string | null;
	terms: string | null;
	customer: {
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
	};
	business: {
		name: string;
		tradingName: string | null;
		email: string | null;
		phone: string | null;
		addressLine1: string | null;
		addressLine2: string | null;
		city: string | null;
		province: string | null;
		postalCode: string | null;
		vatNumber: string | null;
		logoUrl: string | null;
	};
	lineItems: LineItem[];
	transactions: Payment[];
	quote?: {
		id: string;
		quoteNumber: string;
	} | null;
}

interface BankAccount {
	id: string;
	accountName: string;
	bankName: string;
}

export default function InvoiceDetailPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const invoiceId = params.invoiceId as string;
	const showPaymentOnLoad = searchParams.get("payment") === "true";

	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [invoice, setInvoice] = useState<Invoice | null>(null);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const fetchInvoice = useCallback(async () => {
		if (!businessId || !invoiceId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/invoices/${invoiceId}`);
			if (response.ok) {
				const data = await response.json();
				setInvoice(data.invoice);
			}
		} catch (err) {
			console.error("Failed to fetch invoice:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, invoiceId]);

	const fetchBankAccounts = useCallback(async () => {
		if (!businessId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/bank-accounts`);
			if (response.ok) {
				const data = await response.json();
				setBankAccounts(data.accounts || []);
			}
		} catch (err) {
			console.error("Failed to fetch bank accounts:", err);
		}
	}, [businessId]);

	useEffect(() => {
		fetchInvoice();
		fetchBankAccounts();
	}, [fetchInvoice, fetchBankAccounts]);

	useEffect(() => {
		if (showPaymentOnLoad && invoice && canManage) {
			setPaymentDialogOpen(true);
		}
	}, [showPaymentOnLoad, invoice, canManage]);

	const paymentForm = useForm<RecordPaymentInput>({
		resolver: zodResolver(recordPaymentSchema),
		defaultValues: {
			amount: 0,
			date: new Date().toISOString().split("T")[0],
			reference: "",
			notes: "",
			bankAccountId: "",
		},
	});

	// Set default payment amount to outstanding when dialog opens
	useEffect(() => {
		if (paymentDialogOpen && invoice) {
			const outstanding = invoice.total - invoice.amountPaid;
			paymentForm.setValue("amount", outstanding);
		}
	}, [paymentDialogOpen, invoice, paymentForm]);

	async function handleRecordPayment(data: RecordPaymentInput) {
		if (!businessId || !invoiceId) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/invoices/${invoiceId}/payment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (response.ok) {
				setPaymentDialogOpen(false);
				paymentForm.reset();
				fetchInvoice();
			} else {
				const error = await response.json();
				console.error("Failed to record payment:", error);
			}
		} catch (err) {
			console.error("Failed to record payment:", err);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleStatusChange(newStatus: string) {
		if (!businessId || !invoiceId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/invoices/${invoiceId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				fetchInvoice();
			}
		} catch (err) {
			console.error("Failed to update invoice:", err);
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

	if (businessLoading || isLoading) {
		return <InvoiceDetailSkeleton />;
	}

	if (!invoice) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<FileText className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
				<p className="text-muted-foreground mb-4">The invoice you're looking for doesn't exist.</p>
				<Button asChild>
					<Link href="/invoices">Back to Invoices</Link>
				</Button>
			</div>
		);
	}

	const outstanding = invoice.total - invoice.amountPaid;
	const isOverdue =
		new Date(invoice.dueDate) < new Date() &&
		!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status);
	const displayStatus = isOverdue ? "OVERDUE" : invoice.status;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="/invoices">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
							<Badge className={statusColors[displayStatus] || ""}>
								{displayStatus.replace("_", " ")}
							</Badge>
						</div>
						<p className="text-muted-foreground">
							{invoice.customer.name}
							{invoice.reference && ` • Ref: ${invoice.reference}`}
						</p>
					</div>
				</div>

				{canManage && (
					<div className="flex items-center gap-2">
						{!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status) && (
							<Button onClick={() => setPaymentDialogOpen(true)}>
								<CreditCard className="mr-2 h-4 w-4" />
								Record Payment
							</Button>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{invoice.status === "DRAFT" && (
									<>
										<DropdownMenuItem asChild>
											<Link href={`/invoices/${invoiceId}/edit`}>Edit Invoice</Link>
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => handleStatusChange("SENT")}>
											<Send className="mr-2 h-4 w-4" />
											Mark as Sent
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</>
								)}
								{invoice.status === "SENT" && (
									<DropdownMenuItem onClick={() => handleStatusChange("VIEWED")}>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Mark as Viewed
									</DropdownMenuItem>
								)}
								{!["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status) && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => handleStatusChange("CANCELLED")}
											className="text-red-600"
										>
											Cancel Invoice
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => handleStatusChange("WRITTEN_OFF")}
											className="text-red-600"
										>
											Write Off
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</div>

			<Tabs defaultValue="details">
				<TabsList>
					<TabsTrigger value="details">Details</TabsTrigger>
					<TabsTrigger value="payments">Payments ({invoice.transactions.length})</TabsTrigger>
				</TabsList>

				<TabsContent value="details" className="space-y-6">
					{/* Invoice Overview */}
					<div className="grid gap-6 md:grid-cols-2">
						{/* Business Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									From
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<p className="font-medium">
									{invoice.business.tradingName || invoice.business.name}
								</p>
								{invoice.business.addressLine1 && (
									<p className="text-sm text-muted-foreground">
										{invoice.business.addressLine1}
										{invoice.business.addressLine2 && <>, {invoice.business.addressLine2}</>}
									</p>
								)}
								{(invoice.business.city || invoice.business.province) && (
									<p className="text-sm text-muted-foreground">
										{[invoice.business.city, invoice.business.province, invoice.business.postalCode]
											.filter(Boolean)
											.join(", ")}
									</p>
								)}
								{invoice.business.vatNumber && (
									<p className="text-sm text-muted-foreground">VAT: {invoice.business.vatNumber}</p>
								)}
								{invoice.business.email && (
									<p className="text-sm text-muted-foreground flex items-center gap-1">
										<Mail className="h-3 w-3" />
										{invoice.business.email}
									</p>
								)}
								{invoice.business.phone && (
									<p className="text-sm text-muted-foreground flex items-center gap-1">
										<Phone className="h-3 w-3" />
										{invoice.business.phone}
									</p>
								)}
							</CardContent>
						</Card>

						{/* Customer Info */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Building2 className="h-4 w-4" />
									Bill To
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<Link
									href={`/customers/${invoice.customer.id}`}
									className="font-medium hover:underline"
								>
									{invoice.customer.name}
								</Link>
								{invoice.customer.addressLine1 && (
									<p className="text-sm text-muted-foreground">
										{invoice.customer.addressLine1}
										{invoice.customer.addressLine2 && <>, {invoice.customer.addressLine2}</>}
									</p>
								)}
								{(invoice.customer.city || invoice.customer.province) && (
									<p className="text-sm text-muted-foreground">
										{[invoice.customer.city, invoice.customer.province, invoice.customer.postalCode]
											.filter(Boolean)
											.join(", ")}
									</p>
								)}
								{invoice.customer.vatNumber && (
									<p className="text-sm text-muted-foreground">VAT: {invoice.customer.vatNumber}</p>
								)}
								{invoice.customer.email && (
									<p className="text-sm text-muted-foreground flex items-center gap-1">
										<Mail className="h-3 w-3" />
										{invoice.customer.email}
									</p>
								)}
								{invoice.customer.phone && (
									<p className="text-sm text-muted-foreground flex items-center gap-1">
										<Phone className="h-3 w-3" />
										{invoice.customer.phone}
									</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Dates & Amounts */}
					<Card>
						<CardContent className="pt-6">
							<div className="grid gap-4 sm:grid-cols-4">
								<div>
									<p className="text-sm text-muted-foreground">Issue Date</p>
									<p className="font-medium">
										{formatDate(new Date(invoice.issueDate), {
											day: "2-digit",
											month: "short",
											year: "numeric",
										})}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Due Date</p>
									<p className={cn("font-medium", isOverdue && "text-red-600")}>
										{formatDate(new Date(invoice.dueDate), {
											day: "2-digit",
											month: "short",
											year: "numeric",
										})}
									</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Amount Paid</p>
									<p className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">Outstanding</p>
									<p
										className={cn(
											"font-medium",
											outstanding > 0 ? "text-red-600" : "text-green-600"
										)}
									>
										{formatCurrency(outstanding)}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Line Items */}
					<Card>
						<CardHeader>
							<CardTitle>Line Items</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="rounded-lg border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Description</TableHead>
											<TableHead className="text-right">Qty</TableHead>
											<TableHead className="text-right">Unit Price</TableHead>
											<TableHead className="text-right">VAT</TableHead>
											<TableHead className="text-right">Total</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoice.lineItems.map((item) => (
											<TableRow key={item.id}>
												<TableCell>{item.description}</TableCell>
												<TableCell className="text-right">{item.quantity}</TableCell>
												<TableCell className="text-right">
													{formatCurrency(item.unitPrice)}
												</TableCell>
												<TableCell className="text-right">{item.vatRate}%</TableCell>
												<TableCell className="text-right font-medium">
													{formatCurrency(item.lineTotal + item.vatAmount)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							<div className="mt-4 flex justify-end">
								<div className="w-64 space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Subtotal</span>
										<span>{formatCurrency(invoice.subtotal)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">VAT</span>
										<span>{formatCurrency(invoice.vatAmount)}</span>
									</div>
									{invoice.discount > 0 && (
										<div className="flex justify-between text-sm text-green-600">
											<span>Discount</span>
											<span>-{formatCurrency(invoice.discount)}</span>
										</div>
									)}
									<Separator />
									<div className="flex justify-between font-bold">
										<span>Total</span>
										<span>{formatCurrency(invoice.total)}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Notes & Terms */}
					{(invoice.notes || invoice.terms) && (
						<Card>
							<CardContent className="pt-6 space-y-4">
								{invoice.notes && (
									<div>
										<p className="text-sm font-medium mb-1">Notes</p>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap">
											{invoice.notes}
										</p>
									</div>
								)}
								{invoice.terms && (
									<div>
										<p className="text-sm font-medium mb-1">Terms & Conditions</p>
										<p className="text-sm text-muted-foreground whitespace-pre-wrap">
											{invoice.terms}
										</p>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Related Quote */}
					{invoice.quote && (
						<Card>
							<CardContent className="pt-6">
								<p className="text-sm text-muted-foreground">
									Created from quote:{" "}
									<Link
										href={`/quotes/${invoice.quote.id}`}
										className="text-primary hover:underline"
									>
										{invoice.quote.quoteNumber}
									</Link>
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				<TabsContent value="payments" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Payment History</CardTitle>
							<CardDescription>All payments recorded against this invoice</CardDescription>
						</CardHeader>
						<CardContent>
							{invoice.transactions.length === 0 ? (
								<div className="text-center py-8">
									<CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="font-medium">No payments recorded</p>
									<p className="text-sm text-muted-foreground">
										{canManage && !["PAID", "CANCELLED", "WRITTEN_OFF"].includes(invoice.status)
											? "Record a payment to track income"
											: "No payments have been made yet"}
									</p>
								</div>
							) : (
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Date</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Reference</TableHead>
												<TableHead className="text-right">Amount</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoice.transactions.map((payment) => (
												<TableRow key={payment.id}>
													<TableCell>
														{formatDate(new Date(payment.date), {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</TableCell>
													<TableCell>{payment.description}</TableCell>
													<TableCell className="text-muted-foreground">
														{payment.reference || "-"}
													</TableCell>
													<TableCell className="text-right font-medium text-green-600">
														{formatCurrency(payment.amount)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}

							<div className="mt-4 flex justify-end">
								<div className="w-64 space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Invoice Total</span>
										<span>{formatCurrency(invoice.total)}</span>
									</div>
									<div className="flex justify-between text-sm text-green-600">
										<span>Total Paid</span>
										<span>{formatCurrency(invoice.amountPaid)}</span>
									</div>
									<Separator />
									<div
										className={cn(
											"flex justify-between font-bold",
											outstanding > 0 ? "text-red-600" : "text-green-600"
										)}
									>
										<span>Outstanding</span>
										<span>{formatCurrency(outstanding)}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Record Payment Dialog */}
			<Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Record Payment</DialogTitle>
						<DialogDescription>
							Record a payment against invoice {invoice.invoiceNumber}
						</DialogDescription>
					</DialogHeader>
					<Form {...paymentForm}>
						<form onSubmit={paymentForm.handleSubmit(handleRecordPayment)} className="space-y-4">
							<FormField
								control={paymentForm.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount (R) *</FormLabel>
										<FormControl>
											<Input
												type="number"
												min="0.01"
												max={outstanding}
												step="0.01"
												{...field}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<p className="text-xs text-muted-foreground">
											Outstanding: {formatCurrency(outstanding)}
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={paymentForm.control}
								name="date"
								render={({ field }) => (
									<FormItem className="flex flex-col">
										<FormLabel>Payment Date *</FormLabel>
										<Popover>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														className={cn(
															"w-full pl-3 text-left font-normal",
															!field.value && "text-muted-foreground"
														)}
													>
														{field.value ? (
															formatDate(new Date(field.value), {
																day: "2-digit",
																month: "short",
																year: "numeric",
															})
														) : (
															<span>Pick a date</span>
														)}
														<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent className="w-auto p-0" align="start">
												<Calendar
													mode="single"
													selected={field.value ? new Date(field.value) : undefined}
													onSelect={(date) => {
														if (date) {
															field.onChange(date.toISOString().split("T")[0]);
														}
													}}
													initialFocus
												/>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={paymentForm.control}
								name="bankAccountId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Account</FormLabel>
										<Select onValueChange={field.onChange} value={field.value || ""}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select bank account (optional)" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{bankAccounts.map((account) => (
													<SelectItem key={account.id} value={account.id}>
														{account.accountName} ({account.bankName})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={paymentForm.control}
								name="reference"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Reference</FormLabel>
										<FormControl>
											<Input
												placeholder="Bank ref, EFT number, etc."
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={paymentForm.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Additional notes..."
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setPaymentDialogOpen(false)}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Record Payment
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function InvoiceDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-60" />
				</div>
			</div>
			<Skeleton className="h-10 w-64" />
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-48 rounded-lg" />
				<Skeleton className="h-48 rounded-lg" />
			</div>
			<Skeleton className="h-24 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
