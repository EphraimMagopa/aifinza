"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
	type CreateBusinessFormInput,
	createBusinessFormSchema,
	provinceOptions,
	vatCycleOptions,
} from "@/lib/validations/business";

const steps = [
	{ id: 1, name: "Business Details" },
	{ id: 2, name: "Contact & Address" },
	{ id: 3, name: "Tax Information" },
];

export default function OnboardingPage() {
	const router = useRouter();
	const { refreshBusinesses, setBusinessId } = useBusiness();
	const [currentStep, setCurrentStep] = useState(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<CreateBusinessFormInput>({
		resolver: zodResolver(createBusinessFormSchema),
		defaultValues: {
			name: "",
			tradingName: "",
			businessType: "PRIVATE_COMPANY",
			industry: "",
			registrationNumber: "",
			taxNumber: "",
			vatNumber: "",
			isVatRegistered: false,
			vatCycle: null,
			financialYearEnd: 2,
			email: "",
			phone: "",
			website: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			province: null,
			postalCode: "",
		},
	});

	const isVatRegistered = form.watch("isVatRegistered");

	async function onSubmit(data: CreateBusinessFormInput) {
		setIsSubmitting(true);
		setError(null);

		try {
			// Clean up empty strings
			const cleanedData = {
				...data,
				email: data.email || undefined,
				website: data.website || undefined,
				tradingName: data.tradingName || undefined,
				industry: data.industry || undefined,
				registrationNumber: data.registrationNumber || undefined,
				taxNumber: data.taxNumber || undefined,
				vatNumber: data.vatNumber || undefined,
				phone: data.phone || undefined,
				addressLine1: data.addressLine1 || undefined,
				addressLine2: data.addressLine2 || undefined,
				city: data.city || undefined,
				postalCode: data.postalCode || undefined,
			};

			const response = await fetch("/api/businesses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(cleanedData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to create business");
			}

			// Refresh businesses and select the new one
			await refreshBusinesses();
			setBusinessId(result.business.id);

			router.push("/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	function nextStep() {
		if (currentStep < 3) {
			setCurrentStep(currentStep + 1);
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	}

	return (
		<div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
							<Building2 className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl">Create Your Business</CardTitle>
					<CardDescription>
						Let&apos;s set up your business profile. You can always update these details later.
					</CardDescription>
				</CardHeader>

				{/* Progress Steps */}
				<div className="px-6 pb-4">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => (
							<div key={step.id} className="flex items-center">
								<div
									className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
										currentStep > step.id
											? "bg-primary text-primary-foreground"
											: currentStep === step.id
												? "bg-primary text-primary-foreground"
												: "bg-muted text-muted-foreground"
									}`}
								>
									{currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
								</div>
								<span
									className={`ml-2 text-sm ${
										currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
									}`}
								>
									{step.name}
								</span>
								{index < steps.length - 1 && (
									<div
										className={`mx-4 h-0.5 w-12 ${
											currentStep > step.id ? "bg-primary" : "bg-muted"
										}`}
									/>
								)}
							</div>
						))}
					</div>
				</div>

				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Step 1: Business Details */}
							{currentStep === 1 && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Business Name *</FormLabel>
												<FormControl>
													<Input placeholder="e.g., ABC Trading (Pty) Ltd" {...field} />
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
												<FormLabel>Trading As (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="e.g., ABC Store" {...field} />
												</FormControl>
												<FormDescription>
													If your business operates under a different name
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="businessType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Business Type *</FormLabel>
												<Select onValueChange={field.onChange} defaultValue={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select business type" />
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
												<FormLabel>Industry (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="e.g., Retail, Technology, Construction" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* Step 2: Contact & Address */}
							{currentStep === 2 && (
								<div className="space-y-4">
									<div className="grid gap-4 sm:grid-cols-2">
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Business Email</FormLabel>
													<FormControl>
														<Input type="email" placeholder="info@yourbusiness.co.za" {...field} />
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
													<FormLabel>Phone Number</FormLabel>
													<FormControl>
														<Input placeholder="012 345 6789" {...field} />
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
												<FormLabel>Website (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="https://yourbusiness.co.za" {...field} />
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
													<Input placeholder="123 Main Street" {...field} />
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
												<FormLabel>Address Line 2 (Optional)</FormLabel>
												<FormControl>
													<Input placeholder="Suite 101" {...field} />
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
														<Input placeholder="Johannesburg" {...field} />
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
														<Input placeholder="2000" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{/* Step 3: Tax Information */}
							{currentStep === 3 && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="registrationNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>CIPC Registration Number</FormLabel>
												<FormControl>
													<Input placeholder="e.g., 2023/123456/07" {...field} />
												</FormControl>
												<FormDescription>
													Your company registration number from CIPC
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="taxNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>SARS Tax Number</FormLabel>
												<FormControl>
													<Input placeholder="e.g., 9123456789" {...field} />
												</FormControl>
												<FormDescription>
													Your income tax reference number from SARS
												</FormDescription>
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
													<FormDescription>
														Is your business registered for VAT with SARS?
													</FormDescription>
												</div>
											</FormItem>
										)}
									/>

									{isVatRegistered && (
										<>
											<FormField
												control={form.control}
												name="vatNumber"
												render={({ field }) => (
													<FormItem>
														<FormLabel>VAT Number</FormLabel>
														<FormControl>
															<Input placeholder="e.g., 4123456789" {...field} />
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
														<FormLabel>VAT Submission Cycle</FormLabel>
														<Select onValueChange={field.onChange} value={field.value || undefined}>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select VAT cycle" />
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
														<FormDescription>
															Based on your annual turnover category
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</>
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
															<SelectValue placeholder="Select month" />
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
												<FormDescription>
													The month your financial year ends (default is February)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}

							{/* Navigation Buttons */}
							<div className="flex justify-between pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={prevStep}
									disabled={currentStep === 1}
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back
								</Button>

								{currentStep < 3 ? (
									<Button type="button" onClick={nextStep}>
										Next
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								) : (
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											"Create Business"
										)}
									</Button>
								)}
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
