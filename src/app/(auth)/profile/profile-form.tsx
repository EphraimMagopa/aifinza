"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
	user: {
		id: string;
		name: string | null;
		email: string;
		image: string | null;
		role: string;
		createdAt: Date;
	};
}

export function ProfileForm({ user }: ProfileFormProps) {
	const router = useRouter();
	const { update } = useSession();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: user.name ?? "",
			email: user.email,
		},
	});

	async function onSubmit(data: ProfileFormValues) {
		setIsLoading(true);

		try {
			const response = await fetch("/api/user/profile", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const result = await response.json();
				toast.error(result.error || "Failed to update profile");
				return;
			}

			// Update the session
			await update({ name: data.name });

			toast.success("Profile updated successfully");
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
					<CardDescription>Update your personal details</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input placeholder="John Doe" disabled={isLoading} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input type="email" placeholder="you@example.com" disabled {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Saving..." : "Save changes"}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
					<CardDescription>Your account details</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-1">
						<p className="text-sm font-medium">Account Type</p>
						<p className="text-sm text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
					</div>
					<Separator />
					<div className="grid gap-1">
						<p className="text-sm font-medium">Member Since</p>
						<p className="text-sm text-muted-foreground">
							{new Date(user.createdAt).toLocaleDateString("en-ZA", {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
