"use client";

import { format } from "date-fns";
import { ChevronDown, ChevronRight, FileText, Filter } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

interface AuditLog {
	id: string;
	userId: string;
	businessId: string | null;
	action: string;
	entityType: string;
	entityId: string;
	oldValues: Record<string, unknown> | null;
	newValues: Record<string, unknown> | null;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
	user: {
		id: string;
		name: string | null;
		email: string;
	};
}

interface Stats {
	byAction: Record<string, number>;
	byEntityType: Record<string, number>;
}

interface Pagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

const ACTIONS = [
	"USER_CREATED",
	"USER_UPDATED",
	"USER_DELETED",
	"USER_ROLE_CHANGED",
	"BUSINESS_CREATED",
	"BUSINESS_UPDATED",
	"BUSINESS_DELETED",
	"SUBSCRIPTION_CREATED",
	"SUBSCRIPTION_UPDATED",
	"SUBSCRIPTION_CANCELLED",
	"SUBSCRIPTION_PLAN_CHANGED",
	"ADMIN_LOGIN",
	"ADMIN_USER_IMPERSONATION",
	"ADMIN_MANUAL_SUBSCRIPTION_CHANGE",
];

const ENTITY_TYPES = ["USER", "BUSINESS", "SUBSCRIPTION", "INVOICE", "TRANSACTION"];

export default function AdminAuditLogsPage() {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [stats, setStats] = useState<Stats | null>(null);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [page, setPage] = useState(1);

	// Filters
	const [actionFilter, setActionFilter] = useState("");
	const [entityTypeFilter, setEntityTypeFilter] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const fetchLogs = useCallback(async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", page.toString());
			if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);
			if (entityTypeFilter && entityTypeFilter !== "all")
				params.set("entityType", entityTypeFilter);
			if (startDate) params.set("startDate", startDate);
			if (endDate) params.set("endDate", endDate);

			const res = await fetch(`/api/admin/audit-logs?${params}`);
			if (!res.ok) throw new Error("Failed to fetch audit logs");

			const data = await res.json();
			setLogs(data.logs);
			setStats(data.stats);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Fetch audit logs error:", error);
			toast.error("Failed to load audit logs");
		} finally {
			setIsLoading(false);
		}
	}, [page, actionFilter, entityTypeFilter, startDate, endDate]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	function clearFilters() {
		setActionFilter("");
		setEntityTypeFilter("");
		setStartDate("");
		setEndDate("");
		setPage(1);
	}

	const hasFilters = actionFilter || entityTypeFilter || startDate || endDate;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
				<p className="text-muted-foreground">Track all administrative actions and changes</p>
			</div>

			{/* Stats */}
			{stats && (
				<div className="grid gap-4 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Actions Distribution</CardTitle>
							<CardDescription>Breakdown by action type</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{Object.entries(stats.byAction)
									.sort(([, a], [, b]) => b - a)
									.slice(0, 5)
									.map(([action, count]) => (
										<div key={action} className="flex items-center justify-between">
											<span className="text-sm font-medium">{formatAction(action)}</span>
											<Badge variant="secondary">{count}</Badge>
										</div>
									))}
								{Object.keys(stats.byAction).length === 0 && (
									<p className="text-sm text-muted-foreground">No logs yet</p>
								)}
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Entity Types</CardTitle>
							<CardDescription>Breakdown by entity</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								{Object.entries(stats.byEntityType)
									.sort(([, a], [, b]) => b - a)
									.map(([entityType, count]) => (
										<div key={entityType} className="flex items-center justify-between">
											<span className="text-sm font-medium">{entityType}</span>
											<Badge variant="secondary">{count}</Badge>
										</div>
									))}
								{Object.keys(stats.byEntityType).length === 0 && (
									<p className="text-sm text-muted-foreground">No logs yet</p>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<Filter className="h-4 w-4" />
						<CardTitle className="text-base">Filters</CardTitle>
						{hasFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
								Clear filters
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-4">
						<Select
							value={actionFilter}
							onValueChange={(value) => {
								setActionFilter(value);
								setPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="All Actions" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Actions</SelectItem>
								{ACTIONS.map((action) => (
									<SelectItem key={action} value={action}>
										{formatAction(action)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={entityTypeFilter}
							onValueChange={(value) => {
								setEntityTypeFilter(value);
								setPage(1);
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="All Entities" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Entities</SelectItem>
								{ENTITY_TYPES.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value);
								setPage(1);
							}}
							placeholder="Start Date"
						/>
						<Input
							type="date"
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value);
								setPage(1);
							}}
							placeholder="End Date"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Logs Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-10" />
							<TableHead>Timestamp</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Entity</TableHead>
							<TableHead>User</TableHead>
							<TableHead>IP Address</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 10 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
								<TableRow key={`skeleton-${i}`}>
									<TableCell>
										<Skeleton className="h-4 w-4" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-6 w-24" />
									</TableCell>
								</TableRow>
							))
						) : logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
									<FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
									No audit logs found
								</TableCell>
							</TableRow>
						) : (
							logs.map((log) => <AuditLogRow key={log.id} log={log} />)
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
						logs
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

function AuditLogRow({ log }: { log: AuditLog }) {
	const [isOpen, setIsOpen] = useState(false);
	const hasDetails = log.oldValues || log.newValues;

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
			<TableRow className={hasDetails ? "cursor-pointer" : ""}>
				<TableCell>
					{hasDetails && (
						<CollapsibleTrigger asChild>
							<Button variant="ghost" size="icon" className="h-6 w-6">
								{isOpen ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>
					)}
				</TableCell>
				<TableCell className="text-sm">
					{format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
				</TableCell>
				<TableCell>
					<Badge variant={getActionVariant(log.action)}>{formatAction(log.action)}</Badge>
				</TableCell>
				<TableCell>
					<div>
						<span className="font-medium">{log.entityType}</span>
						<p className="text-xs text-muted-foreground font-mono">{log.entityId}</p>
					</div>
				</TableCell>
				<TableCell>
					<div>
						<p className="font-medium">{log.user.name || "Unknown"}</p>
						<p className="text-xs text-muted-foreground">{log.user.email}</p>
					</div>
				</TableCell>
				<TableCell className="text-sm text-muted-foreground">{log.ipAddress || "-"}</TableCell>
			</TableRow>
			{hasDetails && (
				<CollapsibleContent asChild>
					<TableRow className="bg-muted/50">
						<TableCell colSpan={6} className="py-4">
							<div className="grid gap-4 md:grid-cols-2 px-4">
								{log.oldValues && (
									<div>
										<p className="text-sm font-medium mb-2">Previous Values</p>
										<pre className="text-xs bg-background rounded p-3 overflow-auto max-h-48">
											{JSON.stringify(log.oldValues, null, 2)}
										</pre>
									</div>
								)}
								{log.newValues && (
									<div>
										<p className="text-sm font-medium mb-2">New Values</p>
										<pre className="text-xs bg-background rounded p-3 overflow-auto max-h-48">
											{JSON.stringify(log.newValues, null, 2)}
										</pre>
									</div>
								)}
							</div>
							{log.userAgent && (
								<div className="px-4 mt-4">
									<p className="text-xs text-muted-foreground">
										<span className="font-medium">User Agent:</span> {log.userAgent}
									</p>
								</div>
							)}
						</TableCell>
					</TableRow>
				</CollapsibleContent>
			)}
		</Collapsible>
	);
}

function formatAction(action: string): string {
	return action
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
	if (action.includes("DELETED") || action.includes("CANCELLED")) {
		return "destructive";
	}
	if (action.includes("CREATED")) {
		return "default";
	}
	if (action.includes("ADMIN")) {
		return "outline";
	}
	return "secondary";
}
