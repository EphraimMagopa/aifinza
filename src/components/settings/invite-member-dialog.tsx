"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	businessRoleOptions,
	type InviteTeamMemberInput,
	inviteTeamMemberSchema,
} from "@/lib/validations/team";

interface InviteMemberDialogProps {
	onInvite: (data: InviteTeamMemberInput) => Promise<void>;
}

export function InviteMemberDialog({ onInvite }: InviteMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<InviteTeamMemberInput>({
		resolver: zodResolver(inviteTeamMemberSchema),
		defaultValues: {
			email: "",
			role: "MEMBER",
		},
	});

	async function onSubmit(data: InviteTeamMemberInput) {
		setIsSubmitting(true);
		setError(null);

		try {
			await onInvite(data);
			form.reset();
			setOpen(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to invite member");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className="mr-2 h-4 w-4" />
					Invite Member
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Invite Team Member</DialogTitle>
					<DialogDescription>
						Add a new member to your business. They must have an existing account.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email Address</FormLabel>
									<FormControl>
										<Input type="email" placeholder="colleague@example.com" {...field} />
									</FormControl>
									<FormDescription>
										Enter the email address of the person you want to invite.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{businessRoleOptions
												.filter((r) => r.value !== "OWNER")
												.map((role) => (
													<SelectItem key={role.value} value={role.value}>
														<div>
															<div>{role.label}</div>
															<div className="text-xs text-muted-foreground">
																{role.description}
															</div>
														</div>
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={() => setOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Inviting...
									</>
								) : (
									"Send Invite"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
