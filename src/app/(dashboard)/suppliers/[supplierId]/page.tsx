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
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBusiness } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface SupplierDetail {
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
	bankName: string | null;
	accountNumber: string | null;
	branchCode: string | null;
	paymentTerms: number;
	notes: string | null;
	isActive: boolean;
	totalPaid: number;
	transactions: Array<{
		id: string;
		date: string;
		description: string;
		reference: string | null;
		amount: number;
		type: string;
		category: { name: string } | null;
	}>;
	_count: {
		transactions: number;
	};
}

export default function SupplierDetailPage() {
	const params = useParams();
	const supplierId = params.supplierId as string;
	const { businessId, isLoading: businessLoading } = useBusiness();

	const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchSupplier = useCallback(async () => {
		if (!businessId || !supplierId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/suppliers/${supplierId}`);
			if (response.ok) {
				const data = await response.json();
				setSupplier(data.supplier);
			}
		} catch (err) {
			console.error("Failed to fetch supplier:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, supplierId]);

	useEffect(() => {
		fetchSupplier();
	}, [fetchSupplier]);

	if (businessLoading || isLoading) {
		return <SupplierDetailSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Select a business to view supplier details.</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		);
	}

	if (!supplier) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Building className="h-12 w-12 text-muted-foreground mb-4" />
				<h2 className="text-xl font-semibold mb-2">Supplier Not Found</h2>
				<p className="text-muted-foreground mb-4">
					The supplier you're looking for doesn't exist or you don't have access.
				</p>
				<Button asChild>
					<Link href="/suppliers">Back to Suppliers</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/suppliers">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
						<Badge variant={supplier.isActive ? "default" : "secondary"}>
							{supplier.isActive ? "Active" : "Inactive"}
						</Badge>
					</div>
					{supplier.vatNumber && <p className="text-muted-foreground">VAT: {supplier.vatNumber}</p>}
				</div>
				<Button variant="outline" asChild>
					<Link href={`/transactions/new?supplierId=${supplier.id}&type=EXPENSE`}>
						<FileText className="mr-2 h-4 w-4" />
						Record Payment
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Paid</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">
							{formatCurrency(supplier.totalPaid)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Transactions</CardTitle>
						<CreditCard className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{supplier._count.transactions}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Payment Terms</CardTitle>
						<Calendar className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{supplier.paymentTerms} days</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="details">
				<TabsList>
					<TabsTrigger value="details">Details</TabsTrigger>
					<TabsTrigger value="transactions">Transactions</TabsTrigger>
				</TabsList>

				<TabsContent value="details" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						{/* Contact Info */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Contact Information</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{supplier.email && (
									<div className="flex items-center gap-2">
										<Mail className="h-4 w-4 text-muted-foreground" />
										<a href={`mailto:${supplier.email}`} className="hover:underline">
											{supplier.email}
										</a>
									</div>
								)}
								{supplier.phone && (
									<div className="flex items-center gap-2">
										<Phone className="h-4 w-4 text-muted-foreground" />
										<a href={`tel:${supplier.phone}`} className="hover:underline">
											{supplier.phone}
										</a>
									</div>
								)}
								{!supplier.email && !supplier.phone && (
									<p className="text-muted-foreground">No contact information</p>
								)}
							</CardContent>
						</Card>

						{/* Address */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Address</CardTitle>
							</CardHeader>
							<CardContent>
								{supplier.addressLine1 || supplier.city || supplier.province ? (
									<div className="flex items-start gap-2">
										<MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
										<div>
											{supplier.addressLine1 && <p>{supplier.addressLine1}</p>}
											{supplier.addressLine2 && <p>{supplier.addressLine2}</p>}
											{(supplier.city || supplier.province || supplier.postalCode) && (
												<p>
													{[supplier.city, supplier.province, supplier.postalCode]
														.filter(Boolean)
														.join(", ")}
												</p>
											)}
											{supplier.country && <p>{supplier.country}</p>}
										</div>
									</div>
								) : (
									<p className="text-muted-foreground">No address on file</p>
								)}
							</CardContent>
						</Card>

						{/* Banking Details */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Banking Details</CardTitle>
							</CardHeader>
							<CardContent>
								{supplier.bankName || supplier.accountNumber ? (
									<div className="space-y-2">
										{supplier.bankName && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Bank:</span>
												<span className="font-medium">{supplier.bankName}</span>
											</div>
										)}
										{supplier.accountNumber && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Account:</span>
												<span className="font-medium font-mono">{supplier.accountNumber}</span>
											</div>
										)}
										{supplier.branchCode && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Branch:</span>
												<span className="font-medium">{supplier.branchCode}</span>
											</div>
										)}
									</div>
								) : (
									<p className="text-muted-foreground">No banking details on file</p>
								)}
							</CardContent>
						</Card>

						{/* Notes */}
						{supplier.notes && (
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Notes</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="whitespace-pre-wrap">{supplier.notes}</p>
								</CardContent>
							</Card>
						)}
					</div>
				</TabsContent>

				<TabsContent value="transactions">
					<Card>
						<CardHeader>
							<CardTitle>Recent Transactions</CardTitle>
							<CardDescription>Last 10 payments to this supplier</CardDescription>
						</CardHeader>
						<CardContent>
							{supplier.transactions.length === 0 ? (
								<div className="text-center py-8">
									<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
									<p className="font-medium">No transactions yet</p>
									<p className="text-sm text-muted-foreground">
										Record your first payment to this supplier
									</p>
									<Button className="mt-4" asChild>
										<Link href={`/transactions/new?supplierId=${supplier.id}&type=EXPENSE`}>
											Record Payment
										</Link>
									</Button>
								</div>
							) : (
								<div className="rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Date</TableHead>
												<TableHead>Description</TableHead>
												<TableHead>Reference</TableHead>
												<TableHead>Category</TableHead>
												<TableHead className="text-right">Amount</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{supplier.transactions.map((transaction) => (
												<TableRow key={transaction.id}>
													<TableCell className="whitespace-nowrap">
														{formatDate(new Date(transaction.date), {
															day: "2-digit",
															month: "short",
															year: "numeric",
														})}
													</TableCell>
													<TableCell className="max-w-xs truncate">
														{transaction.description}
													</TableCell>
													<TableCell>
														{transaction.reference || (
															<span className="text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell>
														{transaction.category ? (
															<Badge variant="secondary">{transaction.category.name}</Badge>
														) : (
															<span className="text-muted-foreground">-</span>
														)}
													</TableCell>
													<TableCell className="text-right">
														<span
															className={cn(
																"font-medium",
																transaction.type === "EXPENSE" ? "text-red-600" : "text-green-600"
															)}
														>
															{transaction.type === "EXPENSE" ? "-" : "+"}
															{formatCurrency(transaction.amount)}
														</span>
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
			</Tabs>
		</div>
	);
}

function SupplierDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<Skeleton key={`stat-${i}`} className="h-24 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
