import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const forgotPasswordSchema = z.object({
	email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();

		const parsed = forgotPasswordSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
		}

		const { email } = parsed.data;
		const normalizedEmail = email.toLowerCase();

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});

		// Always return success to prevent email enumeration
		if (!user) {
			return NextResponse.json({
				success: true,
				message: "If an account exists, a reset link has been sent",
			});
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Store the token in the verification token table
		// We'll use a special identifier format for password resets
		await prisma.verificationToken.create({
			data: {
				identifier: `password-reset:${normalizedEmail}`,
				token: resetToken,
				expires: resetTokenExpiry,
			},
		});

		// Send password reset email
		await sendPasswordResetEmail(user.email, user.name || "User", resetToken);

		return NextResponse.json({
			success: true,
			message: "If an account exists, a reset link has been sent",
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
