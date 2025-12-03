import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuditLogEntry {
	userId: string;
	businessId?: string;
	action: string;
	entityType: string;
	entityId: string;
	oldValues?: Prisma.InputJsonValue;
	newValues?: Prisma.InputJsonValue;
	ipAddress?: string;
	userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry) {
	return prisma.auditLog.create({
		data: {
			userId: entry.userId,
			businessId: entry.businessId ?? null,
			action: entry.action,
			entityType: entry.entityType,
			entityId: entry.entityId,
			oldValues: entry.oldValues,
			newValues: entry.newValues,
			ipAddress: entry.ipAddress ?? null,
			userAgent: entry.userAgent ?? null,
		},
	});
}

/**
 * Common audit actions
 */
export const AuditActions = {
	// User actions
	USER_CREATED: "USER_CREATED",
	USER_UPDATED: "USER_UPDATED",
	USER_DELETED: "USER_DELETED",
	USER_ROLE_CHANGED: "USER_ROLE_CHANGED",

	// Business actions
	BUSINESS_CREATED: "BUSINESS_CREATED",
	BUSINESS_UPDATED: "BUSINESS_UPDATED",
	BUSINESS_DELETED: "BUSINESS_DELETED",

	// Subscription actions
	SUBSCRIPTION_CREATED: "SUBSCRIPTION_CREATED",
	SUBSCRIPTION_UPDATED: "SUBSCRIPTION_UPDATED",
	SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
	SUBSCRIPTION_PLAN_CHANGED: "SUBSCRIPTION_PLAN_CHANGED",

	// Admin actions
	ADMIN_LOGIN: "ADMIN_LOGIN",
	ADMIN_USER_IMPERSONATION: "ADMIN_USER_IMPERSONATION",
	ADMIN_MANUAL_SUBSCRIPTION_CHANGE: "ADMIN_MANUAL_SUBSCRIPTION_CHANGE",
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];
