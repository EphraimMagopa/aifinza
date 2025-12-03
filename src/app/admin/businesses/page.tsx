"use client";

import { format } from "date-fns";
import { Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface Business {
	id: string;
	name: string;
	tradingName: string | null;
	businessType: string;
	isVatRegistered: boolean;
	email: string | null;
	createdAt: string;
	userCount: number;
	transactionCount: number;
	invoiceCount: number;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

const businessTypes = [
	{ value: "SOLE_PROPRIETOR", label: "Sole Proprietor" },
	{ value: "PARTNERSHIP", label: "Partnership" },
	{ value: "PRIVATE_COMPANY", label: "(Pty) Ltd" },
	{ value: "PUBLIC_COMPANY", label: "Public Company" },
	{ value: "CLOSE_CORPORATION", label: "CC" },
	{ value: "NON_PROFIT", label: "Non-Profit" },
	{ value: "TRUST", label: "Trust" },
	{ value: "OTHER", label: "Other" },
];

export default function AdminBusinessesPage() {
	const [businesses, setBusinesses] = useState<Business[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [page, setPage] = useState(1);

	const fetchBusinesses = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", page.toString());
			if (search) params.set("search", search);
			if (typeFilter) params.set("businessType", typeFilter);

			const res = await fetch(`/api/admin/businesses?${params}`);
			if (!res.ok) throw new Error("Failed to fetch businesses");

			const data = await res.json();
			setBusinesses(data.businesses);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Fetch businesses error:", error);
			toast.error("Failed to load businesses");
		} finally {
			setIsLoading(false);
		}
	}, [page, search, typeFilter]);

	useEffect(() => {
		fetchBusinesses();
	}, [fetchBusinesses]);

	function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		setPage(1);
		fetchBusinesses();
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Business Management</h1>
				<p className="text-muted-foreground">View and manage platform businesses</p>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row">
				<form onSubmit={handleSearch} className="flex flex-1 gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by name or registration..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Button type="submit">Search</Button>
				</form>
				<Select
					value={typeFilter}
					onValueChange={(value) => {
						setTypeFilter(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="All Types" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Types</SelectItem>
						{businessTypes.map((type) => (
							<SelectItem key={type.value} value={type.value}>
								{type.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Businesses Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Business</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>VAT</TableHead>
							<TableHead>Users</TableHead>
							<TableHead>Transactions</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-20" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={`skeleton-${i}`}>
									<TableCell>
										<Skeleton className="h-6 w-48" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-12" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-12" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-16" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-16" />
									</TableCell>
								</TableRow>
							))
						) : businesses.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
									No businesses found
								</TableCell>
							</TableRow>
						) : (
							businesses.map((biz) => (
								<TableRow key={biz.id}>
									<TableCell>
										<div>
											<p className="font-medium">{biz.name}</p>
											{biz.tradingName && (
												<p className="text-sm text-muted-foreground">t/a {biz.tradingName}</p>
											)}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{formatBusinessType(biz.businessType)}</Badge>
									</TableCell>
									<TableCell>
										{biz.isVatRegistered ? (
											<Badge variant="default">VAT</Badge>
										) : (
											<span className="text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell>{biz.userCount}</TableCell>
									<TableCell>{biz.transactionCount}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{format(new Date(biz.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/businesses/${biz.id}`}>View</Link>
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
						{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
						businesses
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={pagination.page <= 1}
							onClick={() => setPage(pagination.page - 1)}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={pagination.page >= pagination.totalPages}
							onClick={() => setPage(pagination.page + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

function formatBusinessType(type: string): string {
	const types: Record<string, string> = {
		SOLE_PROPRIETOR: "Sole Proprietor",
		PARTNERSHIP: "Partnership",
		PRIVATE_COMPANY: "(Pty) Ltd",
		PUBLIC_COMPANY: "Public Company",
		CLOSE_CORPORATION: "CC",
		NON_PROFIT: "Non-Profit",
		TRUST: "Trust",
		OTHER: "Other",
	};
	return types[type] || type;
}
