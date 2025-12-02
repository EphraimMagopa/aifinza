"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { type CreateInvoiceInput, createInvoiceSchema } from "@/lib/validations/invoice";

interface Customer {
	id: string;
	name: string;
	email: string | null;
	paymentTerms: number;
}

export default function NewInvoicePage() {
	const router = useRouter();
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [customers, setCustomers] = useState<Customer[]>([]);
	const [customersLoading, setCustomersLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<CreateInvoiceInput>({
		resolver: zodResolver(createInvoiceSchema),
		defaultValues: {
			customerId: "",
			reference: "",
			dueDate: "",
			discount: 0,
			notes: "",
			terms:
				"Payment is due within the specified payment terms. Late payments may incur interest charges.",
			lineItems: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 15 }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "lineItems",
	});

	const fetchCustomers = useCallback(async () => {
		if (!businessId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/customers?active=true`);
			if (response.ok) {
				const data = await response.json();
				setCustomers(data.customers || []);
			}
		} catch (err) {
			console.error("Failed to fetch customers:", err);
		} finally {
			setCustomersLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	// Auto-set due date when customer is selected
	const selectedCustomerId = form.watch("customerId");
	useEffect(() => {
		const customer = customers.find((c) => c.id === selectedCustomerId);
		if (customer) {
			const dueDate = new Date();
			dueDate.setDate(dueDate.getDate() + customer.paymentTerms);
			form.setValue("dueDate", dueDate.toISOString().split("T")[0]);
		}
	}, [selectedCustomerId, customers, form]);

	// Calculate totals
	const lineItems = form.watch("lineItems");
	const discount = form.watch("discount") || 0;

	const subtotal = lineItems.reduce((sum, item) => {
		return sum + (item.quantity || 0) * (item.unitPrice || 0);
	}, 0);

	const vatAmount = lineItems.reduce((sum, item) => {
		const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
		return sum + (lineTotal * (item.vatRate || 0)) / 100;
	}, 0);

	const total = subtotal + vatAmount - discount;

	async function onSubmit(data: CreateInvoiceInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/invoices`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const result = await response.json();
				router.push(`/invoices/${result.invoice.id}`);
			} else {
				const error = await response.json();
				console.error("Failed to create invoice:", error);
			}
		} catch (err) {
			console.error("Failed to create invoice:", err);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (businessLoading || customersLoading) {
		return <NewInvoicePageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to create invoices.
				</p>
			</div>
		);
	}

	if (!canManage) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground">You don't have permission to create invoices.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Create Invoice</h1>
				<p className="text-muted-foreground">Create a new customer invoice</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Customer & Details */}
					<Card>
						<CardHeader>
							<CardTitle>Invoice Details</CardTitle>
							<CardDescription>Select customer and set invoice terms</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="customerId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Customer *</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select customer" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{customers.map((customer) => (
														<SelectItem key={customer.id} value={customer.id}>
															{customer.name}
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
									name="reference"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Reference</FormLabel>
											<FormControl>
												<Input
													placeholder="PO number, project ref, etc."
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="dueDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Due Date *</FormLabel>
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
									control={form.control}
									name="discount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Discount (R)</FormLabel>
											<FormControl>
												<Input
													type="number"
													min="0"
													step="0.01"
													{...field}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
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
							<CardDescription>Add products or services to the invoice</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{fields.map((field, index) => (
								<div key={field.id} className="grid gap-4 p-4 border rounded-lg">
									<div className="flex items-center justify-between">
										<span className="font-medium">Item {index + 1}</span>
										{fields.length > 1 && (
											<Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
												<Trash2 className="h-4 w-4 text-red-600" />
											</Button>
										)}
									</div>

									<FormField
										control={form.control}
										name={`lineItems.${index}.description`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description *</FormLabel>
												<FormControl>
													<Input placeholder="Product or service description" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="grid gap-4 sm:grid-cols-3">
										<FormField
											control={form.control}
											name={`lineItems.${index}.quantity`}
											render={({ field }) => (
												<FormItem>
													<FormLabel>Quantity *</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="0.01"
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
												<FormItem>
													<FormLabel>Unit Price (R) *</FormLabel>
													<FormControl>
														<Input
															type="number"
															min="0"
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
												<FormItem>
													<FormLabel>VAT Rate (%)</FormLabel>
													<Select
														onValueChange={(v) => field.onChange(Number(v))}
														value={String(field.value)}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="0">0% (Zero-rated)</SelectItem>
															<SelectItem value="15">15% (Standard)</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="text-right text-sm text-muted-foreground">
										Line Total:{" "}
										{formatCurrency(
											(lineItems[index]?.quantity || 0) *
												(lineItems[index]?.unitPrice || 0) *
												(1 + (lineItems[index]?.vatRate || 0) / 100)
										)}
									</div>
								</div>
							))}

							<Button
								type="button"
								variant="outline"
								onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 15 })}
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Line Item
							</Button>
						</CardContent>
					</Card>

					{/* Notes & Terms */}
					<Card>
						<CardHeader>
							<CardTitle>Notes & Terms</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="notes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Notes</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Additional notes for the customer..."
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
										<FormLabel>Payment Terms</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Payment terms and conditions..."
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Summary */}
					<Card>
						<CardHeader>
							<CardTitle>Invoice Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Subtotal</span>
									<span>{formatCurrency(subtotal)}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">VAT</span>
									<span>{formatCurrency(vatAmount)}</span>
								</div>
								{discount > 0 && (
									<div className="flex justify-between text-green-600">
										<span>Discount</span>
										<span>-{formatCurrency(discount)}</span>
									</div>
								)}
								<div className="flex justify-between text-lg font-bold border-t pt-2">
									<span>Total</span>
									<span>{formatCurrency(total)}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="flex gap-4 justify-end">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Create Invoice
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

function NewInvoicePageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-4 w-60" />
			</div>
			<Skeleton className="h-64 rounded-lg" />
			<Skeleton className="h-96 rounded-lg" />
			<Skeleton className="h-32 rounded-lg" />
		</div>
	);
}
