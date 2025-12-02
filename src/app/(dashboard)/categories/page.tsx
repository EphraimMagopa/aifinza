"use client";

import { FolderTree, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import {
	type CreateCategoryInput,
	categoryColors,
	createCategorySchema,
} from "@/lib/validations/category";
import { transactionTypeOptions } from "@/lib/validations/transaction";

interface Category {
	id: string;
	name: string;
	type: string;
	color: string | null;
	isSystem: boolean;
	parentId: string | null;
	transactionCount: number;
	children?: Category[];
}

export default function CategoriesPage() {
	const { businessId, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManage = hasPermission(["OWNER", "ADMIN", "ACCOUNTANT"]);
	const canDelete = hasPermission(["OWNER", "ADMIN"]);

	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);

	const fetchCategories = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/businesses/${businessId}/categories`);
			if (response.ok) {
				const data = await response.json();
				setCategories(data.categories || []);
			}
		} catch (error) {
			console.error("Failed to fetch categories:", error);
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	async function handleDelete(id: string) {
		if (!businessId) return;
		if (!confirm("Are you sure you want to delete this category?")) return;

		try {
			const response = await fetch(`/api/businesses/${businessId}/categories/${id}`, {
				method: "DELETE",
			});

			const result = await response.json();

			if (!response.ok) {
				alert(result.error || "Failed to delete category");
				return;
			}

			await fetchCategories();
		} catch (error) {
			console.error("Delete error:", error);
		}
	}

	function openEditDialog(category: Category) {
		setEditingCategory(category);
		setDialogOpen(true);
	}

	function openCreateDialog() {
		setEditingCategory(null);
		setDialogOpen(true);
	}

	if (businessLoading) {
		return <CategoriesPageSkeleton />;
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage categories.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	const incomeCategories = categories.filter((c) => c.type === "INCOME" && !c.parentId);
	const expenseCategories = categories.filter((c) => c.type === "EXPENSE" && !c.parentId);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Categories</h1>
					<p className="text-muted-foreground">
						Organize your transactions with income and expense categories
					</p>
				</div>
				{canManage && (
					<Button onClick={openCreateDialog}>
						<Plus className="mr-2 h-4 w-4" />
						Add Category
					</Button>
				)}
			</div>

			{isLoading ? (
				<CategoriesPageSkeleton showHeaderOnly />
			) : categories.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-medium">No categories yet</h3>
					<p className="text-muted-foreground mb-4">
						Create categories to organize your transactions.
					</p>
					{canManage && (
						<Button onClick={openCreateDialog}>
							<Plus className="mr-2 h-4 w-4" />
							Create Category
						</Button>
					)}
				</div>
			) : (
				<div className="grid gap-6 lg:grid-cols-2">
					{/* Income Categories */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-green-500" />
								Income Categories
							</CardTitle>
							<CardDescription>Categories for money coming in</CardDescription>
						</CardHeader>
						<CardContent>
							{incomeCategories.length === 0 ? (
								<p className="text-sm text-muted-foreground">No income categories yet.</p>
							) : (
								<div className="space-y-2">
									{incomeCategories.map((category) => (
										<CategoryItem
											key={category.id}
											category={category}
											onEdit={openEditDialog}
											onDelete={handleDelete}
											canManage={canManage}
											canDelete={canDelete}
										/>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Expense Categories */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full bg-red-500" />
								Expense Categories
							</CardTitle>
							<CardDescription>Categories for money going out</CardDescription>
						</CardHeader>
						<CardContent>
							{expenseCategories.length === 0 ? (
								<p className="text-sm text-muted-foreground">No expense categories yet.</p>
							) : (
								<div className="space-y-2">
									{expenseCategories.map((category) => (
										<CategoryItem
											key={category.id}
											category={category}
											onEdit={openEditDialog}
											onDelete={handleDelete}
											canManage={canManage}
											canDelete={canDelete}
										/>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}

			{/* Create/Edit Dialog */}
			<CategoryDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				category={editingCategory}
				businessId={businessId}
				onSuccess={fetchCategories}
			/>
		</div>
	);
}

function CategoryItem({
	category,
	onEdit,
	onDelete,
	canManage,
	canDelete,
}: {
	category: Category;
	onEdit: (category: Category) => void;
	onDelete: (id: string) => void;
	canManage: boolean;
	canDelete: boolean;
}) {
	return (
		<div className="flex items-center justify-between rounded-lg border p-3">
			<div className="flex items-center gap-3">
				<div
					className="h-4 w-4 rounded-full"
					style={{ backgroundColor: category.color || "#6b7280" }}
				/>
				<div>
					<p className="font-medium">{category.name}</p>
					<p className="text-xs text-muted-foreground">
						{category.transactionCount} transaction{category.transactionCount !== 1 ? "s" : ""}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{category.isSystem && <Badge variant="secondary">System</Badge>}
				{canManage && !category.isSystem && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(category)}>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							{canDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive focus:text-destructive"
										onClick={() => onDelete(category.id)}
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

function CategoryDialog({
	open,
	onOpenChange,
	category,
	businessId,
	onSuccess,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category | null;
	businessId: string;
	onSuccess: () => void;
}) {
	const isEditing = !!category;
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState<CreateCategoryInput>({
		name: "",
		type: "EXPENSE",
		color: categoryColors[0].value,
	});

	useEffect(() => {
		if (category) {
			setFormData({
				name: category.name,
				type: category.type as CreateCategoryInput["type"],
				color: category.color || categoryColors[0].value,
			});
		} else {
			setFormData({
				name: "",
				type: "EXPENSE",
				color: categoryColors[0].value,
			});
		}
		setError(null);
	}, [category, open]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const parsed = createCategorySchema.safeParse(formData);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message || "Invalid input");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const url = isEditing
				? `/api/businesses/${businessId}/categories/${category.id}`
				: `/api/businesses/${businessId}/categories`;

			const response = await fetch(url, {
				method: isEditing ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save category");
			}

			onSuccess();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Category" : "Create Category"}</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the category details."
							: "Add a new category to organize transactions."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							placeholder="e.g., Sales, Office Supplies"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="type">Type</Label>
						<Select
							value={formData.type}
							onValueChange={(value: CreateCategoryInput["type"]) =>
								setFormData({ ...formData, type: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{transactionTypeOptions
									.filter((t) => t.value !== "TRANSFER" && t.value !== "JOURNAL")
									.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2">
							{categoryColors.map((color) => (
								<button
									key={color.value}
									type="button"
									className={`h-8 w-8 rounded-full border-2 transition-all ${
										formData.color === color.value
											? "border-primary ring-2 ring-primary ring-offset-2"
											: "border-transparent"
									}`}
									style={{ backgroundColor: color.value }}
									onClick={() => setFormData({ ...formData, color: color.value })}
									title={color.label}
								/>
							))}
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
							{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function CategoriesPageSkeleton({ showHeaderOnly = false }: { showHeaderOnly?: boolean }) {
	if (showHeaderOnly) {
		return (
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-64 rounded-lg" />
				<Skeleton className="h-64 rounded-lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<Skeleton className="h-64 rounded-lg" />
				<Skeleton className="h-64 rounded-lg" />
			</div>
		</div>
	);
}
