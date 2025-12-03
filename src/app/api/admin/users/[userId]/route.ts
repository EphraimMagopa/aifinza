import { NextResponse } from "next/server";
import { z } from "zod";

import { isSuperAdmin, requireAdmin } from "@/lib/admin";
import { AuditActions, createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

interface RouteContext {
	params: Promise<{ userId: string }>;
}

const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
});

// GET /api/admin/users/[userId] - Get user details
export async function GET(_request: Request, context: RouteContext) {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	try {
		const { userId } = await context.params;

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				emailVerified: true,
				createdAt: true,
				updatedAt: true,
				subscription: {
					select: {
						id: true,
						plan: true,
						status: true,
						stripeCustomerId: true,
						stripeCurrentPeriodEnd: true,
						createdAt: true,
					},
				},
				businesses: {
					select: {
						id: true,
						businessId: true,
						role: true,
						business: {
							select: {
								id: true,
								name: true,
								businessType: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ user });
	} catch (error) {
		console.error("Admin get user error:", error);
		return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
	}
}

// PUT /api/admin/users/[userId] - Update user
export async function PUT(request: Request, context: RouteContext) {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	try {
		const { userId } = await context.params;
		const body = await request.json();
		const parsed = updateUserSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { name, role } = parsed.data;

		// Get current user data for audit log
		const existingUser = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true, role: true },
		});

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Only super admins can change roles to ADMIN or SUPER_ADMIN
		if (role && role !== "USER" && !isSuperAdmin(session)) {
			return NextResponse.json(
				{ error: "Only super admins can assign admin roles" },
				{ status: 403 }
			);
		}

		// Prevent demoting yourself if you're the only super admin
		if (role && existingUser.role === "SUPER_ADMIN" && session.user.id === userId) {
			const superAdminCount = await prisma.user.count({
				where: { role: "SUPER_ADMIN" },
			});
			if (superAdminCount <= 1) {
				return NextResponse.json(
					{ error: "Cannot change role of the only super admin" },
					{ status: 400 }
				);
			}
		}

		const updateData: Record<string, unknown> = {};
		if (name !== undefined) updateData.name = name;
		if (role !== undefined) updateData.role = role;

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
			},
		});

		// Create audit log for role changes
		if (role && role !== existingUser.role) {
			await createAuditLog({
				userId: session.user.id,
				action: AuditActions.USER_ROLE_CHANGED,
				entityType: "User",
				entityId: userId,
				oldValues: { role: existingUser.role },
				newValues: { role },
			});
		}

		return NextResponse.json({ user: updatedUser });
	} catch (error) {
		console.error("Admin update user error:", error);
		return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
	}
}

// DELETE /api/admin/users/[userId] - Delete user
export async function DELETE(_request: Request, context: RouteContext) {
	const { error, status, session } = await requireAdmin();

	if (error || !session) {
		return NextResponse.json({ error }, { status });
	}

	// Only super admins can delete users
	if (!isSuperAdmin(session)) {
		return NextResponse.json({ error: "Only super admins can delete users" }, { status: 403 });
	}

	try {
		const { userId } = await context.params;

		// Prevent deleting yourself
		if (session.user.id === userId) {
			return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
		}

		// Get user data for audit log
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, email: true, role: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Create audit log before deletion
		await createAuditLog({
			userId: session.user.id,
			action: AuditActions.USER_DELETED,
			entityType: "User",
			entityId: userId,
			oldValues: { email: user.email, role: user.role },
		});

		// Delete user (cascades to related records)
		await prisma.user.delete({
			where: { id: userId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Admin delete user error:", error);
		return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
	}
}
