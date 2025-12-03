"use client";

import { format } from "date-fns";
import { ArrowDown, ArrowUp, Building2, CreditCard, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/stripe";

interface AdminStats {
	users: {
		total: number;
		thisMonth: number;
		lastMonth: number;
		growth: number;
	};
	businesses: {
		total: number;
		thisMonth: number;
	};
	subscriptions: {
		total: number;
		byPlan: Record<string, number>;
		byStatus: Record<string, number>;
		mrr: number;
		arr: number;
	};
	recent: {
		users: Array<{
			id: string;
			name: string | null;
			email: string;
			role: string;
			createdAt: string;
		}>;
		businesses: Array<{
			id: string;
			name: string;
			businessType: string;
			createdAt: string;
		}>;
	};
}

export default function AdminDashboardPage() {
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchStats() {
			try {
				const res = await fetch("/api/admin/stats");
				if (!res.ok) throw new Error("Failed to fetch stats");
				const data = await res.json();
				setStats(data);
			} catch (error) {
				console.error("Stats error:", error);
				toast.error("Failed to load dashboard stats");
			} finally {
				setIsLoading(false);
			}
		}
		fetchStats();
	}, []);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!stats) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-muted-foreground">Failed to load dashboard data</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
				<p className="text-muted-foreground">Platform overview and metrics</p>
			</div>

			{/* Key Metrics */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Total Users"
					value={stats.users.total}
					description={`${stats.users.thisMonth} new this month`}
					icon={Users}
					trend={stats.users.growth}
				/>
				<MetricCard
					title="Total Businesses"
					value={stats.businesses.total}
					description={`${stats.businesses.thisMonth} new this month`}
					icon={Building2}
				/>
				<MetricCard
					title="MRR"
					value={formatPrice(stats.subscriptions.mrr)}
					description={`ARR: ${formatPrice(stats.subscriptions.arr)}`}
					icon={TrendingUp}
					isRevenue
				/>
				<MetricCard
					title="Active Subscriptions"
					value={stats.subscriptions.byStatus.ACTIVE || 0}
					description={`${stats.subscriptions.total} total`}
					icon={CreditCard}
				/>
			</div>

			{/* Subscriptions by Plan */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Subscriptions by Plan</CardTitle>
						<CardDescription>Distribution of active subscriptions</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Object.entries(stats.subscriptions.byPlan).map(([plan, count]) => (
								<div key={plan} className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className={`h-3 w-3 rounded-full ${getPlanColor(plan)}`} />
										<span className="text-sm font-medium">{plan}</span>
									</div>
									<span className="text-sm text-muted-foreground">{count}</span>
								</div>
							))}
							{Object.keys(stats.subscriptions.byPlan).length === 0 && (
								<p className="text-sm text-muted-foreground">No subscriptions yet</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Subscription Status</CardTitle>
						<CardDescription>Current subscription states</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Object.entries(stats.subscriptions.byStatus).map(([status, count]) => (
								<div key={status} className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} />
										<span className="text-sm font-medium">{status}</span>
									</div>
									<span className="text-sm text-muted-foreground">{count}</span>
								</div>
							))}
							{Object.keys(stats.subscriptions.byStatus).length === 0 && (
								<p className="text-sm text-muted-foreground">No subscriptions yet</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Recent Activity */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Recent Users</CardTitle>
						<CardDescription>Latest user registrations</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.recent.users.map((user) => (
								<div key={user.id} className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium">{user.name || "No name"}</p>
										<p className="text-xs text-muted-foreground">{user.email}</p>
									</div>
									<div className="text-right">
										<span className="text-xs text-muted-foreground">
											{format(new Date(user.createdAt), "MMM d, yyyy")}
										</span>
									</div>
								</div>
							))}
							{stats.recent.users.length === 0 && (
								<p className="text-sm text-muted-foreground">No users yet</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Recent Businesses</CardTitle>
						<CardDescription>Latest business registrations</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{stats.recent.businesses.map((biz) => (
								<div key={biz.id} className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium">{biz.name}</p>
										<p className="text-xs text-muted-foreground">
											{formatBusinessType(biz.businessType)}
										</p>
									</div>
									<div className="text-right">
										<span className="text-xs text-muted-foreground">
											{format(new Date(biz.createdAt), "MMM d, yyyy")}
										</span>
									</div>
								</div>
							))}
							{stats.recent.businesses.length === 0 && (
								<p className="text-sm text-muted-foreground">No businesses yet</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function MetricCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	isRevenue,
}: {
	title: string;
	value: number | string;
	description: string;
	icon: React.ElementType;
	trend?: number;
	isRevenue?: boolean;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{isRevenue ? value : value.toLocaleString()}</div>
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					{trend !== undefined && (
						<span className={`flex items-center ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
							{trend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
							{Math.abs(trend).toFixed(1)}%
						</span>
					)}
					<span>{description}</span>
				</div>
			</CardContent>
		</Card>
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

function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-8 w-48 mb-2" />
				<Skeleton className="h-4 w-64" />
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={`metric-${i}`} className="h-32" />
				))}
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<Skeleton className="h-64" />
				<Skeleton className="h-64" />
			</div>
		</div>
	);
}
