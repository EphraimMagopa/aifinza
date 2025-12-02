"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { formatCurrency } from "@/lib/utils";
import { type CreateQuoteInput, createQuoteSchema } from "@/lib/validations/quote";

interface Customer {
	id: string;
	name: string;
	email: string | null;
}

export default function NewQuotePage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const preselectedCustomerId = searchParams.get("customerId");
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canCreate = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [customers, setCustomers] = useState<Customer[]>([]);
	const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Default expiry is 30 days from now
	const defaultExpiry = new Date();
	defaultExpiry.setDate(defaultExpiry.getDate() + 30);

	const form = useForm<CreateQuoteInput>({
		resolver: zodResolver(createQuoteSchema),
		defaultValues: {
			customerId: preselectedCustomerId || "",
			reference: "",
			expiryDate: defaultExpiry.toISOString().split("T")[0],
			discount: 0,
			notes: "",
			terms: "Valid for 30 days from the date of issue.",
			lineItems: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 15 }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lineItems",
	});

	const fetchCustomers = useCallback(async () => {
		if (!businessId) return;

		setIsLoadingCustomers(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/customers?isActive=true`);
			if (response.ok) {
				const data = await response.json();
				setCustomers(data.customers || []);
			}
		} catch (err) {
			console.error("Failed to fetch customers:", err);
		} finally {
			setIsLoadingCustomers(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	// Watch line items for totals calculation
	const watchedLineItems = form.watch("lineItems");
	const watchedDiscount = form.watch("discount") || 0;

	// Calculate totals
	const subtotal = watchedLineItems.reduce((sum, item) => {
		return sum + (item.quantity || 0) * (item.unitPrice || 0);
	}, 0);

	const vatAmount = watchedLineItems.reduce((sum, item) => {
		const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
		return sum + (lineTotal * (item.vatRate || 0)) / 100;
	}, 0);

	const total = subtotal + vatAmount - watchedDiscount;

	async function onSubmit(data: CreateQuoteInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/quotes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to create quote");
			}

			router.push(`/quotes/${result.quote.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create quote");
		} finally {
			setIsSubmitting(false);
		}
	}

	if (businessLoading) {
		return <NewQuotePageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">Select a business to create quotes.</p>
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		);
	}

	if (!canCreate) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground mb-4">You don't have permission to create quotes.</p>
				<Button asChild>
					<Link href="/quotes">Back to Quotes</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/quotes">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Create Quote</h1>
					<p className="text-muted-foreground">Create a new quotation for your customer</p>
				</div>
			</div>

			{error && (
				<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Customer & Details */}
					<Card>
						<CardHeader>
							<CardTitle>Quote Details</CardTitle>
							<CardDescription>Select a customer and set quote details</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<FormItem className="sm:col-span-2">
											<FormLabel>Customer *</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select a customer" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{isLoadingCustomers ? (
														<SelectItem value="" disabled>
															Loading...
														</SelectItem>
													) : (
														customers.map((customer) => (
															<SelectItem key={customer.id} value={customer.id}>
																{customer.name}
															</SelectItem>
														))
													)}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="reference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reference</FormLabel>
											<FormControl>
												<Input
													placeholder="PO number, project name, etc."
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
									name="expiryDate"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Expiry Date *</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Line Items */}
					<Card>
						<CardHeader>
							<CardTitle>Line Items</CardTitle>
							<CardDescription>Add products or services to the quote</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-4">
								{fields.map((field, index) => (
									<div
										key={field.id}
										className="grid gap-4 sm:grid-cols-12 items-start p-4 border rounded-lg"
									>
										<FormField
											control={form.control}
											name={`lineItems.${index}.description`}
											render={({ field }) => (
												<FormItem className="sm:col-span-4">
													<FormLabel>Description *</FormLabel>
													<FormControl>
														<Input placeholder="Item description" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`lineItems.${index}.quantity`}
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>Qty *</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
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
											name={`lineItems.${index}.unitPrice`}
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>Unit Price *</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
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
											name={`lineItems.${index}.vatRate`}
											render={({ field }) => (
												<FormItem className="sm:col-span-2">
													<FormLabel>VAT %</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															{...field}
															onChange={(e) => field.onChange(Number(e.target.value))}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<div className="sm:col-span-2 flex items-end gap-2">
											<div className="flex-1">
												<FormLabel>Line Total</FormLabel>
												<div className="h-10 flex items-center font-medium">
													{formatCurrency(
														(watchedLineItems[index]?.quantity || 0) *
															(watchedLineItems[index]?.unitPrice || 0)
													)}
												</div>
											</div>
											{fields.length > 1 && (
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() => remove(index)}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											)}
										</div>
									</div>
								))}
							</div>

							<Button
								type="button"
								variant="outline"
								onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 15 })}
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Line Item
							</Button>

							{/* Totals */}
							<div className="flex justify-end">
								<div className="w-full max-w-xs space-y-2">
									<div className="flex justify-between text-sm">
										<span>Subtotal:</span>
										<span>{formatCurrency(subtotal)}</span>
									</div>
									<div className="flex justify-between text-sm">
										<span>VAT:</span>
										<span>{formatCurrency(vatAmount)}</span>
									</div>
									<FormField
										control={form.control}
										name="discount"
										render={({ field }) => (
											<div className="flex justify-between items-center text-sm">
												<span>Discount:</span>
												<div className="w-24">
													<Input
														type="number"
														step="0.01"
														className="h-8 text-right"
														{...field}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</div>
											</div>
										)}
									/>
									<div className="flex justify-between font-semibold text-lg border-t pt-2">
										<span>Total:</span>
										<span>{formatCurrency(total)}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Notes & Terms */}
					<Card>
						<CardHeader>
							<CardTitle>Notes & Terms</CardTitle>
							<CardDescription>Additional information for the customer</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Notes</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Notes to the customer..."
													rows={4}
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
									name="terms"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Terms & Conditions</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Terms and conditions..."
													rows={4}
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="flex justify-end gap-4">
						<Button type="button" variant="outline" asChild disabled={isSubmitting}>
							<Link href="/quotes">Cancel</Link>
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Creating..." : "Create Quote"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

function NewQuotePageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-48" />
				</div>
			</div>
			<Skeleton className="h-48 rounded-lg" />
			<Skeleton className="h-64 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
		</div>
	);
}
