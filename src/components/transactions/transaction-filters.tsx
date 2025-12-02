"use client";

import { Filter, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { transactionTypeOptions } from "@/lib/validations/transaction";

interface Category {
	id: string;
	name: string;
}

interface BankAccount {
	id: string;
	name: string;
}

interface TransactionFiltersProps {
	filters: {
		type?: string;
		categoryId?: string;
		bankAccountId?: string;
		startDate?: string;
		endDate?: string;
		search?: string;
	};
	onFiltersChange: (filters: TransactionFiltersProps["filters"]) => void;
	categories: Category[];
	bankAccounts: BankAccount[];
}

export function TransactionFilters({
	filters,
	onFiltersChange,
	categories,
	bankAccounts,
}: TransactionFiltersProps) {
	const hasFilters = Object.values(filters).some((v) => v);

	function updateFilter(key: string, value: string | undefined) {
		const newFilters = { ...filters, [key]: value };
		if (!value) delete newFilters[key as keyof typeof filters];
		onFiltersChange(newFilters);
	}

	function clearFilters() {
		onFiltersChange({});
	}

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search transactions..."
					className="pl-10"
					value={filters.search || ""}
					onChange={(e) => updateFilter("search", e.target.value || undefined)}
				/>
			</div>

			{/* Filter row */}
			<div className="flex flex-wrap items-center gap-2">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Filter className="h-4 w-4" />
					Filters:
				</div>

				<Select
					value={filters.type || ""}
					onValueChange={(value) => updateFilter("type", value || undefined)}
				>
					<SelectTrigger className="w-[140px] h-9">
						<SelectValue placeholder="Type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Types</SelectItem>
						{transactionTypeOptions.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{categories.length > 0 && (
					<Select
						value={filters.categoryId || ""}
						onValueChange={(value) => updateFilter("categoryId", value || undefined)}
					>
						<SelectTrigger className="w-[160px] h-9">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Categories</SelectItem>
							{categories.map((cat) => (
								<SelectItem key={cat.id} value={cat.id}>
									{cat.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				{bankAccounts.length > 0 && (
					<Select
						value={filters.bankAccountId || ""}
						onValueChange={(value) => updateFilter("bankAccountId", value || undefined)}
					>
						<SelectTrigger className="w-[160px] h-9">
							<SelectValue placeholder="Account" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Accounts</SelectItem>
							{bankAccounts.map((acc) => (
								<SelectItem key={acc.id} value={acc.id}>
									{acc.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<Input
					type="date"
					placeholder="From"
					className="w-[140px] h-9"
					value={filters.startDate || ""}
					onChange={(e) => updateFilter("startDate", e.target.value || undefined)}
				/>

				<Input
					type="date"
					placeholder="To"
					className="w-[140px] h-9"
					value={filters.endDate || ""}
					onChange={(e) => updateFilter("endDate", e.target.value || undefined)}
				/>

				{hasFilters && (
					<Button variant="ghost" size="sm" onClick={clearFilters}>
						<X className="mr-1 h-4 w-4" />
						Clear
					</Button>
				)}
			</div>
		</div>
	);
}
