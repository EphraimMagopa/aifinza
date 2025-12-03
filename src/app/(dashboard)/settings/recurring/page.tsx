"use client";

import { CalendarClock, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
	type CreateRecurringTransactionInput,
	createRecurringTransactionSchema,
	frequencyOptions,
} from "@/lib/validations/recurring-transaction";

interface RecurringTransaction {
	id: string;
	description: string;
	amount: number;
	type: "INCOME" | "EXPENSE";
	frequency: string;
	startDate: string;
	endDate: string | null;
	nextOccurrence: string;
	isActive: boolean;
	category: { id: string; name: string; color: string | null } | null;
	bankAccount: { id: string; name: string; bankName: string } | null;
}

interface Category {
	id: string;
	name: string;
	type: string;
}

interface BankAccount {
	id: string;
	name: string;
	bankName: string;
}

export default function RecurringTransactionsPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);
	const canDelete = hasPermission(["OWNER", "ADMIN"]);

	const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);

	const fetchData = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const [rtRes, categoriesRes, accountsRes] = await Promise.all([
				fetch(`/api/businesses/${businessId}/recurring-transactions`),
				fetch(`/api/businesses/${businessId}/categories`),
				fetch(`/api/businesses/${businessId}/bank-accounts`),
			]);

			if (rtRes.ok) {
				const data = await rtRes.json();
				setRecurringTransactions(data.recurringTransactions || []);
			}

			if (categoriesRes.ok) {
				const data = await categoriesRes.json();
				setCategories(data.categories || []);
			}

			if (accountsRes.ok) {
				const data = await accountsRes.json();
				setBankAccounts(
					(data.bankAccounts || []).filter(
						(a: BankAccount & { isActive?: boolean }) => a.isActive !== false
					)
				);
			}
		} catch (error) {
			console.error("Failed to fetch data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	async function handleDelete(id: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this recurring transaction?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/recurring-transactions/${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const result = await response.json();
				alert(result.error || "Failed to delete");
				return;
			}

			await fetchData();
		} catch (error) {
			console.error("Delete error:", error);
		}
	}

	async function handleToggleActive(id: string, isActive: boolean) {
		if (!businessId) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/recurring-transactions/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isActive }),
			});

			if (response.ok) {
				await fetchData();
			}
		} catch (error) {
			console.error("Toggle error:", error);
		}
	}

	function openEditDialog(transaction: RecurringTransaction) {
		setEditingTransaction(transaction);
		setDialogOpen(true);
	}

	function openCreateDialog() {
		setEditingTransaction(null);
		setDialogOpen(true);
	}

	if (businessLoading) {
		return <RecurringPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage recurring transactions.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	const activeTransactions = recurringTransactions.filter((rt) => rt.isActive);
	const inactiveTransactions = recurringTransactions.filter((rt) => !rt.isActive);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Recurring Transactions</h1>
					<p className="text-muted-foreground">
						Set up automatic transactions that repeat on a schedule
					</p>
				</div>
				{canManage && (
					<Button onClick={openCreateDialog}>
						<Plus className="mr-2 h-4 w-4" />
						Add Recurring
					</Button>
				)}
			</div>

			{isLoading ? (
				<RecurringPageSkeleton showHeaderOnly />
			) : recurringTransactions.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium">No recurring transactions</h3>
					<p className="text-muted-foreground mb-4">
						Create recurring transactions for regular income or expenses.
					</p>
					{canManage && (
						<Button onClick={openCreateDialog}>
							<Plus className="mr-2 h-4 w-4" />
							Create Recurring Transaction
						</Button>
					)}
				</div>
			) : (
				<div className="space-y-6">
					{/* Active Transactions */}
					{activeTransactions.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-green-500" />
									Active ({activeTransactions.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{activeTransactions.map((rt) => (
										<RecurringTransactionItem
											key={rt.id}
											transaction={rt}
											onEdit={openEditDialog}
											onDelete={handleDelete}
											onToggle={handleToggleActive}
											canManage={canManage}
											canDelete={canDelete}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Inactive Transactions */}
					{inactiveTransactions.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-muted-foreground">
									<div className="h-2 w-2 rounded-full bg-gray-400" />
									Paused ({inactiveTransactions.length})
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{inactiveTransactions.map((rt) => (
										<RecurringTransactionItem
											key={rt.id}
											transaction={rt}
											onEdit={openEditDialog}
											onDelete={handleDelete}
											onToggle={handleToggleActive}
											canManage={canManage}
											canDelete={canDelete}
										/>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<RecurringTransactionDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				transaction={editingTransaction}
				businessId={businessId}
				categories={categories}
				bankAccounts={bankAccounts}
				onSuccess={fetchData}
			/>
		</div>
	);
}

function RecurringTransactionItem({
	transaction,
	onEdit,
	onDelete,
	onToggle,
	canManage,
	canDelete,
}: {
	transaction: RecurringTransaction;
	onEdit: (transaction: RecurringTransaction) => void;
	onDelete: (id: string) => void;
	onToggle: (id: string, isActive: boolean) => void;
	canManage: boolean;
	canDelete: boolean;
}) {
	const isIncome = transaction.type === "INCOME";
	const frequencyLabel =
		frequencyOptions.find((f) => f.value === transaction.frequency)?.label || transaction.frequency;

	return (
		<div className="flex items-center justify-between rounded-lg border p-4">
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"h-10 w-10 rounded-full flex items-center justify-center",
						isIncome ? "bg-green-100" : "bg-red-100"
					)}
				>
					<CalendarClock className={cn("h-5 w-5", isIncome ? "text-green-600" : "text-red-600")} />
				</div>
				<div>
					<p className="font-medium">{transaction.description}</p>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>{frequencyLabel}</span>
						<span>•</span>
						<span>
							Next:{" "}
							{formatDate(new Date(transaction.nextOccurrence), { day: "numeric", month: "short" })}
						</span>
						{transaction.category && (
							<>
								<span>•</span>
								<Badge variant="secondary" className="text-xs">
									{transaction.category.name}
								</Badge>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<span className={cn("text-lg font-semibold", isIncome ? "text-green-600" : "text-red-600")}>
					{isIncome ? "+" : "-"}
					{formatCurrency(transaction.amount)}
				</span>

				{canManage && (
					<Switch
						checked={transaction.isActive}
						onCheckedChange={(checked) => onToggle(transaction.id, checked)}
					/>
				)}

				{canManage && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(transaction)}>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							{canDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(transaction.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}

function RecurringTransactionDialog({
	open,
	onOpenChange,
	transaction,
	businessId,
	categories,
	bankAccounts,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: RecurringTransaction | null;
	businessId: string;
	categories: Category[];
	bankAccounts: BankAccount[];
	onSuccess: () => void;
}) {
	const isEditing = !!transaction;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<CreateRecurringTransactionInput>({
		description: "",
		amount: 0,
		type: "EXPENSE",
		frequency: "MONTHLY",
		startDate: new Date().toISOString().split("T")[0],
		endDate: null,
		categoryId: null,
		bankAccountId: null,
		isActive: true,
	});

	useEffect(() => {
		if (transaction) {
			setFormData({
				description: transaction.description,
				amount: transaction.amount,
				type: transaction.type,
				frequency: transaction.frequency as CreateRecurringTransactionInput["frequency"],
				startDate: transaction.startDate.split("T")[0],
				endDate: transaction.endDate ? transaction.endDate.split("T")[0] : null,
				categoryId: transaction.category?.id || null,
				bankAccountId: transaction.bankAccount?.id || null,
				isActive: transaction.isActive,
			});
		} else {
			setFormData({
				description: "",
				amount: 0,
				type: "EXPENSE",
				frequency: "MONTHLY",
				startDate: new Date().toISOString().split("T")[0],
				endDate: null,
				categoryId: null,
				bankAccountId: null,
				isActive: true,
			});
		}
		setError(null);
	}, [transaction]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const parsed = createRecurringTransactionSchema.safeParse(formData);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message || "Invalid input");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const url = isEditing
				? `/api/businesses/${businessId}/recurring-transactions/${transaction.id}`
				: `/api/businesses/${businessId}/recurring-transactions`;

			const response = await fetch(url, {
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save");
			}

			onSuccess();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	const filteredCategories = categories.filter((c) => c.type === formData.type);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Recurring Transaction" : "Create Recurring Transaction"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the recurring transaction details."
							: "Set up a transaction that repeats automatically."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2 sm:col-span-2">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								value={formData.description}
								onChange={(e) => setFormData({ ...formData, description: e.target.value })}
								placeholder="e.g., Monthly rent, Salary"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="type">Type</Label>
							<Select
								value={formData.type}
								onValueChange={(value: "INCOME" | "EXPENSE") =>
									setFormData({ ...formData, type: value, categoryId: null })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INCOME">Income</SelectItem>
									<SelectItem value="EXPENSE">Expense</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="amount">Amount</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0"
								value={formData.amount || ""}
								onChange={(e) =>
									setFormData({ ...formData, amount: Number.parseFloat(e.target.value) || 0 })
								}
								placeholder="0.00"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="frequency">Frequency</Label>
							<Select
								value={formData.frequency}
								onValueChange={(value: CreateRecurringTransactionInput["frequency"]) =>
									setFormData({ ...formData, frequency: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{frequencyOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input
								id="startDate"
								type="date"
								value={formData.startDate}
								onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="endDate">End Date (Optional)</Label>
							<Input
								id="endDate"
								type="date"
								value={formData.endDate || ""}
								onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="category">Category</Label>
							<Select
								value={formData.categoryId || ""}
								onValueChange={(value) => setFormData({ ...formData, categoryId: value || null })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">None</SelectItem>
									{filteredCategories.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bankAccount">Bank Account</Label>
							<Select
								value={formData.bankAccountId || ""}
								onValueChange={(value) =>
									setFormData({ ...formData, bankAccountId: value || null })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select account" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">None</SelectItem>
									{bankAccounts.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
					)}

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function RecurringPageSkeleton({ showHeaderOnly = false }: { showHeaderOnly?: boolean }) {
	if (showHeaderOnly) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-32 rounded-lg" />
				<Skeleton className="h-32 rounded-lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
			<Skeleton className="h-64 rounded-lg" />
		</div>
	);
}
