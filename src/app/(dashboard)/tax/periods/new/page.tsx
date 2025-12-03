"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatDate } from "@/lib/utils";
import {
	type CreateTaxPeriodInput,
	createTaxPeriodSchema,
	taxPeriodTypeOptions,
} from "@/lib/validations/tax";

export default function NewTaxPeriodPage() {
	const router = useRouter();
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<CreateTaxPeriodInput>({
		resolver: zodResolver(createTaxPeriodSchema),
		defaultValues: {
			type: "VAT",
			startDate: "",
			endDate: "",
			dueDate: "",
		},
	});

	function setDefaultDates(type: string) {
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();

		let start: Date;
		let end: Date;
		let due: Date;

		switch (type) {
			case "VAT": {
				// Bi-monthly VAT period
				const biMonthStart = currentMonth % 2 === 0 ? currentMonth : currentMonth - 1;
				start = new Date(currentYear, biMonthStart, 1);
				end = new Date(currentYear, biMonthStart + 2, 0); // Last day of 2nd month
				due = new Date(currentYear, biMonthStart + 2, 25); // 25th of month after period
				break;
			}
			case "PROVISIONAL_TAX":
				// 6-month provisional periods
				if (currentMonth < 2) {
					// Feb year end, first provisional due Aug
					start = new Date(currentYear - 1, 2, 1);
					end = new Date(currentYear - 1, 7, 31);
					due = new Date(currentYear - 1, 7, 31);
				} else if (currentMonth < 8) {
					start = new Date(currentYear, 2, 1);
					end = new Date(currentYear, 7, 31);
					due = new Date(currentYear, 7, 31);
				} else {
					start = new Date(currentYear, 2, 1);
					end = new Date(currentYear + 1, 1, 28);
					due = new Date(currentYear + 1, 1, 28);
				}
				break;
			case "ANNUAL_TAX":
				// Annual tax return (Feb year end typical)
				start = new Date(currentYear - 1, 2, 1);
				end = new Date(currentYear, 1, 28);
				due = new Date(currentYear, 11, 31); // End of calendar year typically
				break;
			case "PAYE":
			case "UIF":
			case "SDL":
				// Monthly payroll-related
				start = new Date(currentYear, currentMonth - 1, 1);
				end = new Date(currentYear, currentMonth, 0);
				due = new Date(currentYear, currentMonth, 7); // 7th of following month
				break;
			default:
				return;
		}

		form.setValue("startDate", start.toISOString().split("T")[0]);
		form.setValue("endDate", end.toISOString().split("T")[0]);
		form.setValue("dueDate", due.toISOString().split("T")[0]);
	}

	async function onSubmit(data: CreateTaxPeriodInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/tax/periods`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (response.ok) {
				const result = await response.json();
				router.push(`/tax/periods/${result.period.id}`);
			} else {
				const error = await response.json();
				console.error("Failed to create tax period:", error);
			}
		} catch (err) {
			console.error("Failed to create tax period:", err);
		} finally {
			setIsSubmitting(false);
		}
	}

	if (businessLoading) {
		return <NewTaxPeriodSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to create tax periods.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	if (!canManage) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">Access Denied</h2>
				<p className="text-muted-foreground">You don't have permission to create tax periods.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/tax">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">New Tax Period</h1>
					<p className="text-muted-foreground">Create a new tax filing period</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Period Details</CardTitle>
							<CardDescription>Select the type and dates for this tax period</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tax Type *</FormLabel>
										<Select
											onValueChange={(value) => {
												field.onChange(value);
												setDefaultDates(value);
											}}
											value={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select tax type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{taxPeriodTypeOptions.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>The type of tax return this period is for</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="startDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>Start Date *</FormLabel>
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
									name="endDate"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>End Date *</FormLabel>
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
											<FormDescription>SARS submission deadline</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
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
							Create Tax Period
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}

function NewTaxPeriodSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="space-y-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-60" />
				</div>
			</div>
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
