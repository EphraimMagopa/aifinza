import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Registration schema
const registerSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();

		// Validate input
		const parsed = registerSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					success: false,
					error: "Validation failed",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { name, email, password } = parsed.data;
		const normalizedEmail = email.toLowerCase();

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});

		if (existingUser) {
			return NextResponse.json(
				{
					success: false,
					error: "An account with this email already exists",
				},
				{ status: 409 }
			);
		}

		// Hash password
		const hashedPassword = await hashPassword(password);

		// Create user
		const user = await prisma.user.create({
			data: {
				name,
				email: normalizedEmail,
				password: hashedPassword,
				role: "USER",
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});

		// Generate verification token
		const verificationToken = crypto.randomBytes(32).toString("hex");
		const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await prisma.verificationToken.create({
			data: {
				identifier: `email-verify:${normalizedEmail}`,
				token: verificationToken,
				expires: tokenExpiry,
			},
		});

		// Send verification email
		await sendVerificationEmail(normalizedEmail, name, verificationToken);

		// Send welcome email
		await sendWelcomeEmail(normalizedEmail, name);

		return NextResponse.json(
			{
				success: true,
				message: "Account created successfully",
				user,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "An unexpected error occurred",
			},
			{ status: 500 }
		);
	}
}
