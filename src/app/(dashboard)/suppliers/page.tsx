"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency } from "@/lib/utils";
import {
	type CreateSupplierInput,
	createSupplierSchema,
	provinceOptions,
} from "@/lib/validations/supplier";

interface Supplier {
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
	_count: {
		transactions: number;
	};
}

export default function SuppliersPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [suppliers, setSuppliers] = useState<Supplier[]>([]);
	const [total, setTotal] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [showInactive, setShowInactive] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<CreateSupplierInput>({
		resolver: zodResolver(createSupplierSchema),
		defaultValues: {
			name: "",
			email: "",
			phone: "",
			vatNumber: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			province: null,
			postalCode: "",
			country: "South Africa",
			bankName: "",
			accountNumber: "",
			branchCode: "",
			paymentTerms: 30,
			notes: "",
			isActive: true,
		},
	});

	const fetchSuppliers = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.set("search", search);
			if (!showInactive) params.set("isActive", "true");

			const response = await fetch(`/api/businesses/${businessId}/suppliers?${params}`);
			if (response.ok) {
				const data = await response.json();
				setSuppliers(data.suppliers || []);
				setTotal(data.total || 0);
			}
		} catch (err) {
			console.error("Failed to fetch suppliers:", err);
		} finally {
			setIsLoading(false);
		}
	}, [businessId, search, showInactive]);

	useEffect(() => {
		fetchSuppliers();
	}, [fetchSuppliers]);

	function handleOpenDialog(supplier?: Supplier) {
		if (supplier) {
			setEditingSupplier(supplier);
			form.reset({
				name: supplier.name,
				email: supplier.email || "",
				phone: supplier.phone || "",
				vatNumber: supplier.vatNumber || "",
				addressLine1: supplier.addressLine1 || "",
				addressLine2: supplier.addressLine2 || "",
				city: supplier.city || "",
				province: supplier.province as CreateSupplierInput["province"],
				postalCode: supplier.postalCode || "",
				country: supplier.country,
				bankName: supplier.bankName || "",
				accountNumber: supplier.accountNumber || "",
				branchCode: supplier.branchCode || "",
				paymentTerms: supplier.paymentTerms,
				notes: supplier.notes || "",
				isActive: supplier.isActive,
			});
		} else {
			setEditingSupplier(null);
			form.reset({
				name: "",
				email: "",
				phone: "",
				vatNumber: "",
				addressLine1: "",
				addressLine2: "",
				city: "",
				province: null,
				postalCode: "",
				country: "South Africa",
				bankName: "",
				accountNumber: "",
				branchCode: "",
				paymentTerms: 30,
				notes: "",
				isActive: true,
			});
		}
		setDialogOpen(true);
	}

	async function onSubmit(data: CreateSupplierInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		try {
			const url = editingSupplier
				? `/api/businesses/${businessId}/suppliers/${editingSupplier.id}`
				: `/api/businesses/${businessId}/suppliers`;

			const response = await fetch(url, {
				method: editingSupplier ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (response.ok) {
				setDialogOpen(false);
				fetchSuppliers();
			}
		} catch (err) {
			console.error("Failed to save supplier:", err);
		} finally {
			setIsSubmitting(false);
		}
	}

	async function handleDelete(supplierId: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this supplier?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/suppliers/${supplierId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchSuppliers();
			}
		} catch (err) {
			console.error("Failed to delete supplier:", err);
		}
	}

	if (businessLoading) {
		return <SuppliersPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage suppliers.
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
					<h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
					<p className="text-muted-foreground">Manage your supplier database</p>
				</div>
				{canManage && (
					<Button onClick={() => handleOpenDialog()}>
						<Plus className="mr-2 h-4 w-4" />
						Add Supplier
					</Button>
				)}
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="pt-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search suppliers..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className="pl-9"
							/>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="showInactive"
								checked={showInactive}
								onChange={(e) => setShowInactive(e.target.checked)}
								className="rounded border-gray-300"
							/>
							<label htmlFor="showInactive" className="text-sm">
								Show inactive
							</label>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Supplier List */}
			<Card>
				<CardHeader>
					<CardTitle>Supplier List</CardTitle>
					<CardDescription>
						{total} supplier{total !== 1 ? "s" : ""} found
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<TableSkeleton />
					) : suppliers.length === 0 ? (
						<div className="text-center py-8">
							<Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<p className="font-medium">No suppliers found</p>
							<p className="text-sm text-muted-foreground">
								{search ? "Try a different search term" : "Add your first supplier to get started"}
							</p>
						</div>
					) : (
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Supplier</TableHead>
										<TableHead>Contact</TableHead>
										<TableHead>Transactions</TableHead>
										<TableHead className="text-right">Total Paid</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{suppliers.map((supplier) => (
										<TableRow key={supplier.id}>
											<TableCell>
												<Link
													href={`/suppliers/${supplier.id}`}
													className="font-medium hover:underline"
												>
													{supplier.name}
												</Link>
												{supplier.vatNumber && (
													<p className="text-xs text-muted-foreground">VAT: {supplier.vatNumber}</p>
												)}
											</TableCell>
											<TableCell>
												{supplier.email && <p className="text-sm">{supplier.email}</p>}
												{supplier.phone && (
													<p className="text-sm text-muted-foreground">{supplier.phone}</p>
												)}
												{!supplier.email && !supplier.phone && (
													<span className="text-muted-foreground">-</span>
												)}
											</TableCell>
											<TableCell>{supplier._count.transactions}</TableCell>
											<TableCell className="text-right">
												<span
													className={cn(
														"font-medium",
														supplier.totalPaid > 0 ? "text-red-600" : "text-muted-foreground"
													)}
												>
													{formatCurrency(supplier.totalPaid)}
												</span>
											</TableCell>
											<TableCell>
												<Badge variant={supplier.isActive ? "default" : "secondary"}>
													{supplier.isActive ? "Active" : "Inactive"}
												</Badge>
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
															<DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
																<Pencil className="mr-2 h-4 w-4" />
																Edit
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={() => handleDelete(supplier.id)}
																className="text-red-600"
															>
																<Trash2 className="mr-2 h-4 w-4" />
																Delete
															</DropdownMenuItem>
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

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
						<DialogDescription>
							{editingSupplier
								? "Update supplier information"
								: "Add a new supplier to your business"}
						</DialogDescription>
					</DialogHeader>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Basic Info */}
							<div className="space-y-4">
								<h3 className="font-medium">Basic Information</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Supplier Name *</FormLabel>
												<FormControl>
													<Input placeholder="Company or individual name" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														placeholder="supplier@example.com"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="phone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Phone</FormLabel>
												<FormControl>
													<Input
														placeholder="+27 12 345 6789"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="vatNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>VAT Number</FormLabel>
												<FormControl>
													<Input placeholder="4000000000" {...field} value={field.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Address */}
							<div className="space-y-4">
								<h3 className="font-medium">Address</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="addressLine1"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Address Line 1</FormLabel>
												<FormControl>
													<Input
														placeholder="Street address"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="addressLine2"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Address Line 2</FormLabel>
												<FormControl>
													<Input
														placeholder="Suite, building, etc."
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="city"
										render={({ field }) => (
											<FormItem>
												<FormLabel>City</FormLabel>
												<FormControl>
													<Input placeholder="City" {...field} value={field.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="province"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Province</FormLabel>
												<Select onValueChange={field.onChange} value={field.value || undefined}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select province" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{provinceOptions.map((option) => (
															<SelectItem key={option.value} value={option.value}>
																{option.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="postalCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Postal Code</FormLabel>
												<FormControl>
													<Input placeholder="0001" {...field} value={field.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Banking Details */}
							<div className="space-y-4">
								<h3 className="font-medium">Banking Details</h3>
								<div className="grid gap-4 sm:grid-cols-3">
									<FormField
										control={form.control}
										name="bankName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Bank Name</FormLabel>
												<FormControl>
													<Input placeholder="Bank name" {...field} value={field.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="accountNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Account Number</FormLabel>
												<FormControl>
													<Input
														placeholder="Account number"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="branchCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Branch Code</FormLabel>
												<FormControl>
													<Input placeholder="Branch code" {...field} value={field.value || ""} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Settings */}
							<div className="space-y-4">
								<h3 className="font-medium">Settings</h3>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="paymentTerms"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Payment Terms (days)</FormLabel>
												<FormControl>
													<Input
														type="number"
														{...field}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="notes"
										render={({ field }) => (
											<FormItem className="sm:col-span-2">
												<FormLabel>Notes</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Internal notes about this supplier"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setDialogOpen(false)}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting
										? "Saving..."
										: editingSupplier
											? "Update Supplier"
											: "Create Supplier"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
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

function SuppliersPageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-32" />
				<Skeleton className="h-4 w-48" />
			</div>
			<Skeleton className="h-20 rounded-lg" />
			<Skeleton className="h-96 rounded-lg" />
		</div>
	);
}
