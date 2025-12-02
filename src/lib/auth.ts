import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Validation schema for credentials
const credentialsSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

// Auth configuration
const authConfig: NextAuthConfig = {
	// @ts-expect-error - Prisma adapter type mismatch with next-auth beta
	adapter: PrismaAdapter(prisma),
	session: {
		strategy: "jwt",
		maxAge: 30 * 24 * 60 * 60, // 30 days
	},
	pages: {
		signIn: "/signin",
		signOut: "/signout",
		error: "/signin",
		verifyRequest: "/verify-email",
		newUser: "/onboarding",
	},
	providers: [
		Credentials({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				// Validate credentials
				const parsed = credentialsSchema.safeParse(credentials);
				if (!parsed.success) {
					return null;
				}

				const { email, password } = parsed.data;

				// Find user by email
				const user = await prisma.user.findUnique({
					where: { email: email.toLowerCase() },
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
						password: true,
						role: true,
						emailVerified: true,
					},
				});

				if (!user || !user.password) {
					return null;
				}

				// Verify password
				const isValidPassword = await bcrypt.compare(password, user.password);
				if (!isValidPassword) {
					return null;
				}

				// Return user without password
				return {
					id: user.id,
					email: user.email,
					name: user.name,
					image: user.image,
					role: user.role,
					emailVerified: user.emailVerified,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			// Initial sign in
			if (user) {
				token.id = user.id ?? "";
				token.role = user.role ?? "USER";
				token.emailVerified = user.emailVerified ?? null;
			}

			// Update session
			if (trigger === "update" && session) {
				token.name = session.name;
				token.image = session.image;
			}

			return token;
		},
		async session({ session, token }) {
			if (token) {
				session.user.id = token.id as string;
				session.user.role = (token.role as string) ?? "USER";
				session.user.emailVerified = token.emailVerified as Date | null;
			}
			return session;
		},
		async signIn({ account }) {
			// Allow OAuth without email verification
			if (account?.provider !== "credentials") {
				return true;
			}

			return true;
		},
	},
	events: {
		async signIn({ user }) {
			// Log sign in event
			console.log(`User signed in: ${user.email}`);
		},
		async signOut() {
			// Log sign out event
			console.log("User signed out");
		},
	},
	debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

// Helper function to verify passwords
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

// Get current session (server-side)
export async function getSession() {
	return auth();
}

// Check if user is authenticated (server-side)
export async function isAuthenticated() {
	const session = await auth();
	return !!session?.user;
}

// Get current user (server-side)
export async function getCurrentUser() {
	const session = await auth();
	if (!session?.user?.id) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
			role: true,
			emailVerified: true,
			createdAt: true,
		},
	});

	return user;
}
