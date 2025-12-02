"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { InviteMemberDialog } from "@/components/settings/invite-member-dialog";
import { TeamList } from "@/components/settings/team-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusiness, useBusinessRole } from "@/hooks/use-business";
import type { InviteTeamMemberInput } from "@/lib/validations/team";

interface TeamMember {
	id: string;
	userId: string;
	role: string;
	createdAt: string;
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
	};
}

export default function TeamPage() {
	const { data: session } = useSession();
	const { businessId, business, isLoading: businessLoading } = useBusiness();
	const { hasPermission } = useBusinessRole();
	const canManageTeam = hasPermission(["OWNER", "ADMIN"]);

	const [members, setMembers] = useState<TeamMember[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchMembers = useCallback(async () => {
		if (!businessId) return;

		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/businesses/${businessId}/team`);
			if (!response.ok) {
				throw new Error("Failed to fetch team members");
			}
			const data = await response.json();
			setMembers(data.members);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	}, [businessId]);

	useEffect(() => {
		fetchMembers();
	}, [fetchMembers]);

	async function handleInvite(data: InviteTeamMemberInput) {
		if (!businessId) return;

		const response = await fetch(`/api/businesses/${businessId}/team`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || "Failed to invite member");
		}

		// Refresh the list
		await fetchMembers();
	}

	async function handleUpdateRole(userId: string, role: string) {
		if (!businessId) return;

		const response = await fetch(`/api/businesses/${businessId}/team/${userId}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ role }),
		});

		if (!response.ok) {
			const result = await response.json();
			throw new Error(result.error || "Failed to update role");
		}

		// Refresh the list
		await fetchMembers();
	}

	async function handleRemove(userId: string) {
		if (!businessId) return;

		const response = await fetch(`/api/businesses/${businessId}/team/${userId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const result = await response.json();
			throw new Error(result.error || "Failed to remove member");
		}

		// Refresh the list
		await fetchMembers();
	}

	if (businessLoading) {
		return (
			<div className="space-y-6">
				<div className="h-8 w-48 bg-muted rounded animate-pulse" />
				<div className="h-64 bg-muted rounded-lg animate-pulse" />
			</div>
		);
	}

	if (!businessId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<h2 className="text-xl font-semibold mb-2">No Business Selected</h2>
				<p className="text-muted-foreground mb-4">
					Create or select a business to manage your team.
				</p>
				<Button asChild>
					<Link href="/onboarding">Create Business</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
					<p className="text-muted-foreground">
						Manage who has access to {business?.tradingName || business?.name || "your business"}
					</p>
				</div>
				{canManageTeam && <InviteMemberDialog onInvite={handleInvite} />}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Members</CardTitle>
					<CardDescription>
						{members.length} {members.length === 1 ? "member" : "members"} in this business
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error ? (
						<div className="text-center py-8">
							<p className="text-destructive mb-4">{error}</p>
							<Button variant="outline" onClick={fetchMembers}>
								Try Again
							</Button>
						</div>
					) : (
						<TeamList
							members={members}
							isLoading={isLoading}
							onUpdateRole={handleUpdateRole}
							onRemove={handleRemove}
							currentUserId={session?.user?.id}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
