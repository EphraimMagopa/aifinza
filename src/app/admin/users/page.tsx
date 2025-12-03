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

interface User {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	role: string;
	emailVerified: string | null;
	createdAt: string;
	businessCount: number;
	subscription: {
		plan: string;
		status: string;
	} | null;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	const [page, setPage] = useState(1);

	const fetchUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", page.toString());
			if (search) params.set("search", search);
			if (roleFilter) params.set("role", roleFilter);

			const res = await fetch(`/api/admin/users?${params}`);
			if (!res.ok) throw new Error("Failed to fetch users");

			const data = await res.json();
			setUsers(data.users);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Fetch users error:", error);
			toast.error("Failed to load users");
		} finally {
			setIsLoading(false);
		}
	}, [page, search, roleFilter]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		setPage(1);
		fetchUsers();
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">User Management</h1>
				<p className="text-muted-foreground">View and manage platform users</p>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-4 sm:flex-row">
				<form onSubmit={handleSearch} className="flex flex-1 gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search by name or email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Button type="submit">Search</Button>
				</form>
				<Select
					value={roleFilter}
					onValueChange={(value) => {
						setRoleFilter(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="All Roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Roles</SelectItem>
						<SelectItem value="USER">User</SelectItem>
						<SelectItem value="ADMIN">Admin</SelectItem>
						<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Users Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Subscription</TableHead>
							<TableHead>Businesses</TableHead>
							<TableHead>Joined</TableHead>
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
										<Skeleton className="h-6 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-12" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-16" />
									</TableCell>
								</TableRow>
							))
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
									No users found
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div>
											<p className="font-medium">{user.name || "No name"}</p>
											<p className="text-sm text-muted-foreground">{user.email}</p>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
									</TableCell>
									<TableCell>
										{user.subscription ? (
											<div>
												<p className="text-sm font-medium">{user.subscription.plan}</p>
												<p className="text-xs text-muted-foreground">{user.subscription.status}</p>
											</div>
										) : (
											<span className="text-sm text-muted-foreground">No subscription</span>
										)}
									</TableCell>
									<TableCell>{user.businessCount}</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{format(new Date(user.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${user.id}`}>View</Link>
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
						users
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

function getRoleVariant(role: string): "default" | "secondary" | "destructive" {
	switch (role) {
		case "SUPER_ADMIN":
			return "destructive";
		case "ADMIN":
			return "default";
		default:
			return "secondary";
	}
}
