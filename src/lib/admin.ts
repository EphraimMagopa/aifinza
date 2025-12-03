import type { Session } from "next-auth";

import { auth } from "@/lib/auth";

// Admin roles that have access to the admin panel
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/**
 * Check if a user has admin access
 */
export function isAdminRole(role: string | undefined | null): role is AdminRole {
	return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Check if the current session user has admin access
 */
export function hasAdminAccess(session: Session | null): boolean {
	return isAdminRole(session?.user?.role);
}

/**
 * Check if the current session user is a super admin
 */
export function isSuperAdmin(session: Session | null): boolean {
	return session?.user?.role === "SUPER_ADMIN";
}

/**
 * Get admin session or throw if not admin
 * Use this in API routes
 */
export async function requireAdmin() {
	const session = await auth();

	if (!session?.user?.id) {
		return { error: "Unauthorized", status: 401, session: null };
	}

	if (!isAdminRole(session.user.role)) {
		return { error: "Forbidden - Admin access required", status: 403, session: null };
	}

	return { error: null, status: 200, session };
}

/**
 * Get super admin session or throw if not super admin
 */
export async function requireSuperAdmin() {
	const session = await auth();

	if (!session?.user?.id) {
		return { error: "Unauthorized", status: 401, session: null };
	}

	if (session.user.role !== "SUPER_ADMIN") {
		return { error: "Forbidden - Super Admin access required", status: 403, session: null };
	}

	return { error: null, status: 200, session };
}
