"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
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
import { useBusiness } from "@/hooks/use-business";
import {
	businessTypeOptions,
	provinceOptions,
	type UpdateBusinessInput,
	updateBusinessSchema,
	vatCycleOptions,
} from "@/lib/validations/business";

export function BusinessForm() {
	const { businessId, business, refreshBusinesses } = useBusiness();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const form = useForm<UpdateBusinessInput>({
		resolver: zodResolver(updateBusinessSchema),
		defaultValues: {
			name: business?.name || "",
			tradingName: business?.tradingName || "",
			businessType:
				(business?.businessType as UpdateBusinessInput["businessType"]) || "PRIVATE_COMPANY",
			industry: business?.industry || "",
			registrationNumber: business?.registrationNumber || "",
			taxNumber: business?.taxNumber || "",
			vatNumber: business?.vatNumber || "",
			isVatRegistered: business?.isVatRegistered || false,
			vatCycle: (business?.vatCycle as UpdateBusinessInput["vatCycle"]) || null,
			financialYearEnd: business?.financialYearEnd || 2,
			email: business?.email || "",
			phone: business?.phone || "",
			website: business?.website || "",
			addressLine1: business?.addressLine1 || "",
			addressLine2: business?.addressLine2 || "",
			city: business?.city || "",
			province: (business?.province as UpdateBusinessInput["province"]) || null,
			postalCode: business?.postalCode || "",
		},
	});

	const isVatRegistered = form.watch("isVatRegistered");

	async function onSubmit(data: UpdateBusinessInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await fetch(`/api/businesses/${businessId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to update business");
			}

			await refreshBusinesses();
			setSuccess(true);
			setTimeout(() => setSuccess(false), 3000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>Your business identity and registration details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Business Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="tradingName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Trading As</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="businessType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Business Type</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{businessTypeOptions.map((option) => (
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
								name="industry"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Industry</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="registrationNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>CIPC Registration Number</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{/* Contact Information */}
				<Card>
					<CardHeader>
						<CardTitle>Contact Information</CardTitle>
						<CardDescription>How customers and suppliers can reach you</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
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
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="website"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Website</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine1"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Street Address</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="addressLine2"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address Line 2</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid gap-4 sm:grid-cols-3">
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem>
										<FormLabel>City</FormLabel>
										<FormControl>
											<Input {...field} />
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
													<SelectValue placeholder="Select" />
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
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Tax Information */}
				<Card>
					<CardHeader>
						<CardTitle>Tax Information</CardTitle>
						<CardDescription>SARS tax registration details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="taxNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>SARS Tax Number</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="isVatRegistered"
							render={({ field }) => (
								<FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
									<FormControl>
										<Checkbox checked={field.value} onCheckedChange={field.onChange} />
									</FormControl>
									<div className="space-y-1 leading-none">
										<FormLabel>VAT Registered</FormLabel>
										<FormDescription>Is your business registered for VAT?</FormDescription>
									</div>
								</FormItem>
							)}
						/>

						{isVatRegistered && (
							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="vatNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>VAT Number</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="vatCycle"
									render={({ field }) => (
										<FormItem>
											<FormLabel>VAT Cycle</FormLabel>
											<Select onValueChange={field.onChange} value={field.value || undefined}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{vatCycleOptions.map((option) => (
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
							</div>
						)}

						<FormField
							control={form.control}
							name="financialYearEnd"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Financial Year End</FormLabel>
									<Select
										onValueChange={(value) => field.onChange(Number.parseInt(value, 10))}
										value={field.value?.toString()}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{[
												"January",
												"February",
												"March",
												"April",
												"May",
												"June",
												"July",
												"August",
												"September",
												"October",
												"November",
												"December",
											].map((month, index) => (
												<SelectItem key={month} value={(index + 1).toString()}>
													{month}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				{error && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				)}

				{success && (
					<div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
						Business settings updated successfully.
					</div>
				)}

				<div className="flex justify-end">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Save Changes"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
