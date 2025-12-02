"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const forgotPasswordSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(data: ForgotPasswordFormValues) {
		setIsLoading(true);

		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const result = await response.json();
				toast.error(result.error || "Failed to send reset email");
				return;
			}

			setIsSubmitted(true);
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	if (isSubmitted) {
		return (
			<Card>
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Check your email</CardTitle>
					<CardDescription>
						If an account exists with that email, we&apos;ve sent you a password reset link.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">
						The link will expire in 1 hour. If you don&apos;t see the email, check your spam folder.
					</p>
				</CardContent>
				<CardFooter>
					<Link href="/signin" className="w-full">
						<Button variant="outline" className="w-full">
							Back to sign in
						</Button>
					</Link>
				</CardFooter>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold">Forgot password</CardTitle>
				<CardDescription>
					Enter your email address and we&apos;ll send you a link to reset your password
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="you@example.com"
											autoComplete="email"
											disabled={isLoading}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Sending..." : "Send reset link"}
						</Button>
					</form>
				</Form>
			</CardContent>
			<CardFooter>
				<div className="text-center text-sm text-muted-foreground w-full">
					Remember your password?{" "}
					<Link href="/signin" className="text-primary hover:underline">
						Sign in
					</Link>
				</div>
			</CardFooter>
		</Card>
	);
}
