"use client";

import {
	ArrowLeft,
	ArrowRight,
	Calendar,
	Download,
	FileText,
	Mail,
	Pencil,
	User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

interface QuoteDetail {
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
	notes: string | null;
	terms: string | null;
	customer: {
		id: string;
		name: string;
		email: string | null;
		phone: string | null;
		addressLine1: string | null;
		addressLine2: string | null;
		city: string | null;
		province: string | null;
		postalCode: string | null;
		vatNumber: string | null;
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
	lineItems: Array<{
		id: string;
		description: string;
		quantity: number;
		unitPrice: number;
		vatRate: number;
		vatAmount: number;
		lineTotal: number;
	}>;
}

export default function QuoteDetailPage() {
	const params = useParams();
	const router = useRouter();
	const quoteId = params.quoteId as string;
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [quote, setQuote] = useState<QuoteDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isConverting, setIsConverting] = useState(false);

	const fetchQuote = useCallback(async () => {
		if (!businessId || !quoteId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes/${quoteId}`);
			if (response.ok) {
				const data = await response.json();
				setQuote(data.quote);
			}
		} catch (err) {
			console.error("Failed to fetch quote:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, quoteId]);

	useEffect(() => {
		fetchQuote();
	}, [fetchQuote]);

	async function handleConvert() {
		if (!businessId || !quoteId) return;
		if (!confirm("Convert this quote to an invoice?")) return;

		setIsConverting(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes/${quoteId}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			if (response.ok) {
				const data = await response.json();
				router.push(`/invoices/${data.invoice.id}`);
			}
		} catch (err) {
			console.error("Failed to convert quote:", err);
		} finally {
			setIsConverting(false);
		}
	}

	async function handleStatusChange(newStatus: string) {
		if (!businessId || !quoteId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes/${quoteId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});

			if (response.ok) {
				fetchQuote();
			}
		} catch (err) {
			console.error("Failed to update quote status:", err);
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

	if (businessLoading || isLoading) {
		return <QuoteDetailSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Select a business to view quote details.</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		);
	}

	if (!quote) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<FileText className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The quote you're looking for doesn't exist or you don't have access.
				</p>
				<Button asChild>
					<Link href="/quotes">Back to Quotes</Link>
				</Button>
			</div>
		);
	}

	const isExpired = new Date(quote.expiryDate) < new Date() && quote.status === "SENT";

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/quotes">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">{quote.quoteNumber}</h1>
						<Badge className={statusColors[quote.status] || ""}>
							{isExpired ? "EXPIRED" : quote.status}
						</Badge>
					</div>
					{quote.reference && <p className="text-muted-foreground">Reference: {quote.reference}</p>}
				</div>
				<div className="flex gap-2">
					{canManage && quote.status !== "INVOICED" && (
						<>
							<Button variant="outline" asChild>
								<Link href={`/quotes/${quote.id}/edit`}>
									<Pencil className="mr-2 h-4 w-4" />
									Edit
								</Link>
							</Button>
							{quote.status === "DRAFT" && (
								<Button variant="outline" onClick={() => handleStatusChange("SENT")}>
									<Mail className="mr-2 h-4 w-4" />
									Mark as Sent
								</Button>
							)}
							{(quote.status === "SENT" || quote.status === "ACCEPTED") && (
								<Button onClick={handleConvert} disabled={isConverting}>
									<ArrowRight className="mr-2 h-4 w-4" />
									{isConverting ? "Converting..." : "Convert to Invoice"}
								</Button>
							)}
						</>
					)}
				</div>
			</div>

			{/* Status Actions for Sent Quotes */}
			{canManage && quote.status === "SENT" && (
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">
								Waiting for customer response. Mark as:
							</p>
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									className="text-green-600"
									onClick={() => handleStatusChange("ACCEPTED")}
								>
									Accepted
								</Button>
								<Button
									size="sm"
									variant="outline"
									className="text-red-600"
									onClick={() => handleStatusChange("DECLINED")}
								>
									Declined
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Quote Info Grid */}
			<div className="grid gap-4 md:grid-cols-3">
				{/* From */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-semibold">{quote.business.tradingName || quote.business.name}</p>
						{quote.business.addressLine1 && (
							<p className="text-sm">{quote.business.addressLine1}</p>
						)}
						{quote.business.city && (
							<p className="text-sm">
								{[quote.business.city, quote.business.province, quote.business.postalCode]
									.filter(Boolean)
									.join(", ")}
							</p>
						)}
						{quote.business.vatNumber && (
							<p className="text-sm text-muted-foreground">VAT: {quote.business.vatNumber}</p>
						)}
					</CardContent>
				</Card>

				{/* To */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">To</CardTitle>
					</CardHeader>
					<CardContent>
						<Link
							href={`/customers/${quote.customer.id}`}
							className="font-semibold hover:underline"
						>
							{quote.customer.name}
						</Link>
						{quote.customer.addressLine1 && (
							<p className="text-sm">{quote.customer.addressLine1}</p>
						)}
						{quote.customer.city && (
							<p className="text-sm">
								{[quote.customer.city, quote.customer.province, quote.customer.postalCode]
									.filter(Boolean)
									.join(", ")}
							</p>
						)}
						{quote.customer.vatNumber && (
							<p className="text-sm text-muted-foreground">VAT: {quote.customer.vatNumber}</p>
						)}
					</CardContent>
				</Card>

				{/* Dates */}
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">Dates</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm">
								Issued:{" "}
								{formatDate(new Date(quote.issueDate), {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<span className={cn("text-sm", isExpired && "text-red-600")}>
								Expires:{" "}
								{formatDate(new Date(quote.expiryDate), {
									day: "2-digit",
									month: "short",
									year: "numeric",
								})}
								{isExpired && " (Expired)"}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

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
									<TableHead className="w-[50%]">Description</TableHead>
									<TableHead className="text-right">Qty</TableHead>
									<TableHead className="text-right">Unit Price</TableHead>
									<TableHead className="text-right">VAT</TableHead>
									<TableHead className="text-right">Total</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{quote.lineItems.map((item) => (
									<TableRow key={item.id}>
										<TableCell>{item.description}</TableCell>
										<TableCell className="text-right">{item.quantity}</TableCell>
										<TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
										<TableCell className="text-right">{item.vatRate}%</TableCell>
										<TableCell className="text-right font-medium">
											{formatCurrency(item.lineTotal)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Totals */}
					<div className="flex justify-end mt-4">
						<div className="w-full max-w-xs space-y-2">
							<div className="flex justify-between text-sm">
								<span>Subtotal:</span>
								<span>{formatCurrency(quote.subtotal)}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>VAT:</span>
								<span>{formatCurrency(quote.vatAmount)}</span>
							</div>
							{quote.discount > 0 && (
								<div className="flex justify-between text-sm text-red-600">
									<span>Discount:</span>
									<span>-{formatCurrency(quote.discount)}</span>
								</div>
							)}
							<div className="flex justify-between font-semibold text-lg border-t pt-2">
								<span>Total:</span>
								<span>{formatCurrency(quote.total)}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Notes & Terms */}
			{(quote.notes || quote.terms) && (
				<div className="grid gap-4 md:grid-cols-2">
					{quote.notes && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Notes</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap text-sm">{quote.notes}</p>
							</CardContent>
						</Card>
					)}
					{quote.terms && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Terms & Conditions</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="whitespace-pre-wrap text-sm">{quote.terms}</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}
		</div>
	);
}

function QuoteDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={`card-${i}`} className="h-32 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
