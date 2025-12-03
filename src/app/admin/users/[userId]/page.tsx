"use client";

import { format } from "date-fns";
import { ArrowLeft, Building2, CreditCard, Mail, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface UserDetail {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	role: string;
	emailVerified: string | null;
	createdAt: string;
	updatedAt: string;
	subscription: {
		id: string;
		plan: string;
		status: string;
		stripeCustomerId: string | null;
		stripeCurrentPeriodEnd: string | null;
		createdAt: string;
	} | null;
	businesses: Array<{
		id: string;
		businessId: string;
		role: string;
		business: {
			id: string;
			name: string;
			businessType: string;
		};
	}>;
}

export default function AdminUserDetailPage() {
	const params = useParams();
	const router = useRouter();
	const userId = params.userId as string;

	const [user, setUser] = useState<UserDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchUser = useCallback(async () => {
		try {
			const res = await fetch(`/api/admin/users/${userId}`);
			if (!res.ok) throw new Error("Failed to fetch user");
			const data = await res.json();
			setUser(data.user);
		} catch (error) {
			console.error("Fetch user error:", error);
			toast.error("Failed to load user");
		} finally {
			setIsLoading(false);
		}
	}, [userId]);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	async function handleRoleChange(newRole: string) {
		if (!user) return;

		setIsUpdating(true);
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role: newRole }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to update role");
			}

			toast.success("User role updated");
			await fetchUser();
		} catch (error) {
			console.error("Update role error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to update role");
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleDelete() {
		setIsDeleting(true);
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to delete user");
			}

			toast.success("User deleted");
			router.push("/admin/users");
		} catch (error) {
			console.error("Delete user error:", error);
			toast.error(error instanceof Error ? error.message : "Failed to delete user");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	}

	if (isLoading) {
		return <UserDetailSkeleton />;
	}

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<p className="text-muted-foreground mb-4">User not found</p>
				<Button variant="outline" asChild>
					<Link href="/admin/users">Back to Users</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/admin/users">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<h1 className="text-2xl font-bold tracking-tight">{user.name || "Unnamed User"}</h1>
					<p className="text-muted-foreground">{user.email}</p>
				</div>
				<Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete User
				</Button>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* User Info */}
				<Card>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
						<CardDescription>Basic user details</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="font-medium">{user.email}</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<Shield className="h-4 w-4 text-muted-foreground" />
							<div className="flex-1">
								<p className="text-sm text-muted-foreground">Role</p>
								<Select value={user.role} onValueChange={handleRoleChange} disabled={isUpdating}>
									<SelectTrigger className="w-40 mt-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USER">User</SelectItem>
										<SelectItem value="ADMIN">Admin</SelectItem>
										<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Email Verified</p>
							<p className="font-medium">
								{user.emailVerified
									? format(new Date(user.emailVerified), "MMM d, yyyy")
									: "Not verified"}
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Created</p>
								<p className="font-medium">{format(new Date(user.createdAt), "MMM d, yyyy")}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Updated</p>
								<p className="font-medium">{format(new Date(user.updatedAt), "MMM d, yyyy")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Subscription */}
				<Card>
					<CardHeader>
						<CardTitle>Subscription</CardTitle>
						<CardDescription>User&apos;s subscription details</CardDescription>
					</CardHeader>
					<CardContent>
						{user.subscription ? (
							<div className="space-y-4">
								<div className="flex items-center gap-3">
									<CreditCard className="h-4 w-4 text-muted-foreground" />
									<div>
										<p className="text-sm text-muted-foreground">Plan</p>
										<div className="flex items-center gap-2">
											<Badge>{user.subscription.plan}</Badge>
											<Badge variant="outline">{user.subscription.status}</Badge>
										</div>
									</div>
								</div>
								{user.subscription.stripeCurrentPeriodEnd && (
									<div>
										<p className="text-sm text-muted-foreground">Period End</p>
										<p className="font-medium">
											{format(new Date(user.subscription.stripeCurrentPeriodEnd), "MMM d, yyyy")}
										</p>
									</div>
								)}
								<div>
									<p className="text-sm text-muted-foreground">Subscribed Since</p>
									<p className="font-medium">
										{format(new Date(user.subscription.createdAt), "MMM d, yyyy")}
									</p>
								</div>
							</div>
						) : (
							<p className="text-muted-foreground">No active subscription</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Businesses */}
			<Card>
				<CardHeader>
					<CardTitle>Businesses</CardTitle>
					<CardDescription>Businesses this user is associated with</CardDescription>
				</CardHeader>
				<CardContent>
					{user.businesses.length > 0 ? (
						<div className="space-y-4">
							{user.businesses.map((biz) => (
								<div
									key={biz.id}
									className="flex items-center justify-between rounded-lg border p-4"
								>
									<div className="flex items-center gap-3">
										<Building2 className="h-5 w-5 text-muted-foreground" />
										<div>
											<p className="font-medium">{biz.business.name}</p>
											<p className="text-sm text-muted-foreground">
												{formatBusinessType(biz.business.businessType)}
											</p>
										</div>
									</div>
									<Badge variant="outline">{biz.role}</Badge>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground">No businesses associated</p>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete User</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this user? This action cannot be undone and will
							remove all associated data.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
							{isDeleting ? "Deleting..." : "Delete User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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

function UserDetailSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 w-10" />
				<div className="flex-1">
					<Skeleton className="h-8 w-48 mb-2" />
					<Skeleton className="h-4 w-32" />
				</div>
			</div>
			<div className="grid gap-6 md:grid-cols-2">
				<Skeleton className="h-64" />
				<Skeleton className="h-64" />
			</div>
			<Skeleton className="h-48" />
		</div>
	);
}
