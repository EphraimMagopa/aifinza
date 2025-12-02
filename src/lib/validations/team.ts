import { z } from "zod";

export const businessRoleOptions = [
	{ value: "OWNER", label: "Owner", description: "Full access to all features" },
	{ value: "ADMIN", label: "Admin", description: "Manage business settings and team" },
	{ value: "ACCOUNTANT", label: "Accountant", description: "Access to financial data and reports" },
	{ value: "MEMBER", label: "Member", description: "Standard access to transactions" },
	{ value: "VIEWER", label: "Viewer", description: "Read-only access" },
] as const;

export const inviteTeamMemberSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	role: z.enum(["ADMIN", "ACCOUNTANT", "MEMBER", "VIEWER"]),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

export const updateTeamMemberSchema = z.object({
	role: z.enum(["ADMIN", "ACCOUNTANT", "MEMBER", "VIEWER"]),
});

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
