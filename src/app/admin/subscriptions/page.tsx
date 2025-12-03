"use client";

import { format } from "date-fns";
import { CreditCard, DollarSign, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatPrice } from "@/lib/stripe";

interface Subscription {
	id: string;
	plan: string;
	status: string;
	stripeCustomerId: string | null;
	stripeSubscriptionId: string | null;
	stripeCurrentPeriodEnd: string | null;
	createdAt: string;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface Stats {
	byPlan: Record<string, number>;
	byStatus: Record<string, number>;
	mrr: number;
	arr: number;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export default function AdminSubscriptionsPage() {
	const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
	const [stats, setStats] = useState<Stats | null>(null);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [planFilter, setPlanFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [page, setPage] = useState(1);

	const fetchSubscriptions = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", page.toString());
			if (planFilter) params.set("plan", planFilter);
			if (statusFilter) params.set("status", statusFilter);

			const res = await fetch(`/api/admin/subscriptions?${params}`);
			if (!res.ok) throw new Error("Failed to fetch subscriptions");

			const data = await res.json();
			setSubscriptions(data.subscriptions);
			setStats(data.stats);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Fetch subscriptions error:", error);
			toast.error("Failed to load subscriptions");
		} finally {
			setIsLoading(false);
		}
	}, [page, planFilter, statusFilter]);

	useEffect(() => {
		fetchSubscriptions();
	}, [fetchSubscriptions]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Subscription Management</h1>
				<p className="text-muted-foreground">Overview of platform subscriptions and revenue</p>
			</div>

			{/* Revenue Stats */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">MRR</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{formatPrice(stats.mrr)}</div>
							<p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">ARR</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{formatPrice(stats.arr)}</div>
							<p className="text-xs text-muted-foreground">Annual Recurring Revenue</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Active</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.byStatus.ACTIVE || 0}</div>
							<p className="text-xs text-muted-foreground">Active subscriptions</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Paid Plans</CardTitle>
							<CreditCard className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{(stats.byPlan.STARTER || 0) +
									(stats.byPlan.PROFESSIONAL || 0) +
									(stats.byPlan.ENTERPRISE || 0)}
							</div>
							<p className="text-xs text-muted-foreground">Paying customers</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Plan Distribution */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>By Plan</CardTitle>
							<CardDescription>Distribution of subscriptions by plan</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Object.entries(stats.byPlan).map(([plan, count]) => (
									<div key={plan} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className={`h-3 w-3 rounded-full ${getPlanColor(plan)}`} />
											<span className="text-sm font-medium">{plan}</span>
										</div>
										<span className="text-sm text-muted-foreground">{count}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>By Status</CardTitle>
							<CardDescription>Subscription status breakdown</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{Object.entries(stats.byStatus).map(([status, count]) => (
									<div key={status} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} />
											<span className="text-sm font-medium">{status}</span>
										</div>
										<span className="text-sm text-muted-foreground">{count}</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters */}
			<div className="flex gap-4">
				<Select
					value={planFilter}
					onValueChange={(value) => {
						setPlanFilter(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="All Plans" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Plans</SelectItem>
						<SelectItem value="FREE">Free</SelectItem>
						<SelectItem value="STARTER">Starter</SelectItem>
						<SelectItem value="PROFESSIONAL">Professional</SelectItem>
						<SelectItem value="ENTERPRISE">Enterprise</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={statusFilter}
					onValueChange={(value) => {
						setStatusFilter(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="All Statuses" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Statuses</SelectItem>
						<SelectItem value="ACTIVE">Active</SelectItem>
						<SelectItem value="TRIALING">Trialing</SelectItem>
						<SelectItem value="PAST_DUE">Past Due</SelectItem>
						<SelectItem value="CANCELLED">Cancelled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Subscriptions Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Period End</TableHead>
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
										<Skeleton className="h-6 w-20" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-16" />
									</TableCell>
								</TableRow>
							))
						) : subscriptions.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
									No subscriptions found
								</TableCell>
							</TableRow>
						) : (
							subscriptions.map((sub) => (
								<TableRow key={sub.id}>
									<TableCell>
										<div>
											<p className="font-medium">{sub.user.name || "Unnamed"}</p>
											<p className="text-sm text-muted-foreground">{sub.user.email}</p>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{sub.plan}</Badge>
									</TableCell>
									<TableCell>
										<Badge variant={getStatusVariant(sub.status)}>{sub.status}</Badge>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{sub.stripeCurrentPeriodEnd
											? format(new Date(sub.stripeCurrentPeriodEnd), "MMM d, yyyy")
											: "-"}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{format(new Date(sub.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="sm" asChild>
											<Link href={`/admin/users/${sub.user.id}`}>View</Link>
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
						subscriptions
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

function getPlanColor(plan: string): string {
	const colors: Record<string, string> = {
		FREE: "bg-gray-400",
		STARTER: "bg-blue-500",
		PROFESSIONAL: "bg-purple-500",
		ENTERPRISE: "bg-amber-500",
	};
	return colors[plan] || "bg-gray-400";
}

function getStatusColor(status: string): string {
	const colors: Record<string, string> = {
		ACTIVE: "bg-green-500",
		TRIALING: "bg-blue-500",
		PAST_DUE: "bg-yellow-500",
		CANCELLED: "bg-red-500",
	};
	return colors[status] || "bg-gray-400";
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "ACTIVE":
			return "default";
		case "PAST_DUE":
			return "destructive";
		default:
			return "secondary";
	}
}
