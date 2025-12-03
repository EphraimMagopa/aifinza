"use client";

import { MoreHorizontal, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useBusinessRole } from "@/hooks/use-business";
import { businessRoleOptions } from "@/lib/validations/team";

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

interface TeamListProps {
	members: TeamMember[];
	isLoading: boolean;
	onUpdateRole: (userId: string, role: string) => Promise<void>;
	onRemove: (userId: string) => Promise<void>;
	currentUserId?: string;
}

export function TeamList({
	members,
	isLoading,
	onUpdateRole,
	onRemove,
	currentUserId,
}: TeamListProps) {
	const { role: currentUserRole, hasPermission } = useBusinessRole();
	const canManageTeam = hasPermission(["OWNER", "ADMIN"]);
	const isOwner = currentUserRole === "OWNER";

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list
					<div key={`skeleton-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-48" />
						</div>
						<Skeleton className="h-8 w-24" />
					</div>
				))}
			</div>
		);
	}

	if (members.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				No team members yet. Invite someone to get started.
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Member</TableHead>
					<TableHead>Role</TableHead>
					<TableHead>Joined</TableHead>
					{canManageTeam && <TableHead className="w-[50px]" />}
				</TableRow>
			</TableHeader>
			<TableBody>
				{members.map((member) => (
					<TeamMemberRow
						key={member.id}
						member={member}
						canManageTeam={canManageTeam}
						isOwner={isOwner}
						isCurrentUser={member.userId === currentUserId}
						onUpdateRole={onUpdateRole}
						onRemove={onRemove}
					/>
				))}
			</TableBody>
		</Table>
	);
}

function TeamMemberRow({
	member,
	canManageTeam,
	isOwner,
	isCurrentUser,
	onUpdateRole,
	onRemove,
}: {
	member: TeamMember;
	canManageTeam: boolean;
	isOwner: boolean;
	isCurrentUser: boolean;
	onUpdateRole: (userId: string, role: string) => Promise<void>;
	onRemove: (userId: string) => Promise<void>;
}) {
	const [isUpdating, setIsUpdating] = useState(false);

	const initials =
		member.user.name
			?.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2) || member.user.email.charAt(0).toUpperCase();

	const roleInfo = businessRoleOptions.find((r) => r.value === member.role);
	const isTeamOwner = member.role === "OWNER";
	const canEdit = canManageTeam && !isTeamOwner && !isCurrentUser;
	const canChangeToAdmin = isOwner; // Only owner can assign admin role

	async function handleRoleChange(newRole: string) {
		setIsUpdating(true);
		try {
			await onUpdateRole(member.userId, newRole);
		} finally {
			setIsUpdating(false);
		}
	}

	async function handleRemove() {
		if (!confirm("Are you sure you want to remove this team member?")) return;
		setIsUpdating(true);
		try {
			await onRemove(member.userId);
		} finally {
			setIsUpdating(false);
		}
	}

	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={member.user.image || undefined} alt={member.user.name || "User"} />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div>
						<div className="font-medium flex items-center gap-2">
							{member.user.name || "Unnamed User"}
							{isCurrentUser && (
								<Badge variant="secondary" className="text-xs">
									You
								</Badge>
							)}
						</div>
						<div className="text-sm text-muted-foreground">{member.user.email}</div>
					</div>
				</div>
			</TableCell>
			<TableCell>
				{canEdit ? (
					<Select value={member.role} onValueChange={handleRoleChange} disabled={isUpdating}>
						<SelectTrigger className="w-[140px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{businessRoleOptions
								.filter((r) => r.value !== "OWNER")
								.filter((r) => canChangeToAdmin || r.value !== "ADMIN")
								.map((role) => (
									<SelectItem key={role.value} value={role.value}>
										{role.label}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				) : (
					<div className="flex items-center gap-2">
						{isTeamOwner && <Shield className="h-4 w-4 text-primary" />}
						<span>{roleInfo?.label || member.role}</span>
					</div>
				)}
			</TableCell>
			<TableCell className="text-muted-foreground">
				{new Date(member.createdAt).toLocaleDateString("en-ZA", {
					day: "numeric",
					month: "short",
					year: "numeric",
				})}
			</TableCell>
			{canManageTeam && (
				<TableCell>
					{canEdit && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" disabled={isUpdating}>
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={handleRemove}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Remove from team
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</TableCell>
			)}
		</TableRow>
	);
}
