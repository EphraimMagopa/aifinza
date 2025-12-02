"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
	bankAccountTypeOptions,
	type CreateBankAccountInput,
	createBankAccountSchema,
	southAfricanBanks,
} from "@/lib/validations/bank-account";

interface AccountFormProps {
	defaultValues?: Partial<CreateBankAccountInput>;
	accountId?: string;
	onSuccess?: () => void;
}

export function AccountForm({ defaultValues, accountId, onSuccess }: AccountFormProps) {
	const router = useRouter();
	const { businessId } = useBusiness();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditing = !!accountId;

	const form = useForm<CreateBankAccountInput>({
		resolver: zodResolver(createBankAccountSchema),
		defaultValues: {
			name: defaultValues?.name || "",
			bankName: defaultValues?.bankName || "",
			accountNumber: defaultValues?.accountNumber || "",
			branchCode: defaultValues?.branchCode || "",
			accountType: defaultValues?.accountType || "CURRENT",
			currency: defaultValues?.currency || "ZAR",
			openingBalance: defaultValues?.openingBalance || 0,
		},
	});

	async function onSubmit(data: CreateBankAccountInput) {
		if (!businessId) return;

		setIsSubmitting(true);
		setError(null);

		try {
			const url = isEditing
				? `/api/businesses/${businessId}/bank-accounts/${accountId}`
				: `/api/businesses/${businessId}/bank-accounts`;

			const response = await fetch(url, {
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save account");
			}

			if (onSuccess) {
				onSuccess();
			} else {
				router.push("/accounts");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isEditing ? "Edit Bank Account" : "Add Bank Account"}</CardTitle>
				<CardDescription>
					{isEditing
						? "Update the details of your bank account"
						: "Connect a new bank account to track your finances"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Account Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g., Business Current Account" {...field} />
										</FormControl>
										<FormDescription>A friendly name to identify this account</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="bankName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select bank" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{southAfricanBanks.map((bank) => (
													<SelectItem key={bank.value} value={bank.label}>
														{bank.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="accountNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Account Number</FormLabel>
										<FormControl>
											<Input placeholder="e.g., 1234567890" {...field} />
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
										<FormLabel>Branch Code (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="e.g., 250655" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<FormField
								control={form.control}
								name="accountType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Account Type</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{bankAccountTypeOptions.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{!isEditing && (
								<FormField
									control={form.control}
									name="openingBalance"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Opening Balance</FormLabel>
											<FormControl>
												<Input
													type="number"
													step="0.01"
													placeholder="0.00"
													{...field}
													onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
												/>
											</FormControl>
											<FormDescription>Current balance in the account</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>

						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="flex justify-end gap-4">
							<Button type="button" variant="outline" onClick={() => router.back()}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isEditing ? "Saving..." : "Creating..."}
									</>
								) : isEditing ? (
									"Save Changes"
								) : (
									"Add Account"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
