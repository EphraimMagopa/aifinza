import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteTeamMemberSchema } from "@/lib/validations/team";

// Helper to check if user has access to business
async function checkBusinessAccess(userId: string, businessId: string, requiredRoles?: string[]) {
	const membership = await prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});

	if (!membership) return null;

	if (requiredRoles && !requiredRoles.includes(membership.role)) {
		return null;
	}

	return membership;
}

// GET /api/businesses/[businessId]/team - Get team members
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const members = await prisma.businessUser.findMany({
			where: { businessId },
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
			orderBy: [{ role: "asc" }, { createdAt: "asc" }],
		});

		return NextResponse.json({
			success: true,
			members: members.map((m) => ({
				id: m.id,
				userId: m.userId,
				role: m.role,
				createdAt: m.createdAt,
				user: m.user,
			})),
		});
	} catch (error) {
		console.error("Get team members error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/team - Invite team member
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ businessId: string }> }
) {
	try {
		const { businessId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER and ADMIN can invite members
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = inviteTeamMemberSchema.safeParse(body);

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

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email: parsed.data.email },
		});

		if (!user) {
			// In a real app, we'd send an invitation email
			// For now, return an error
			return NextResponse.json(
				{
					success: false,
					error: "User not found. They must create an account first.",
				},
				{ status: 404 }
			);
		}

		// Check if user is already a member
		const existingMembership = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId: user.id,
					businessId,
				},
			},
		});

		if (existingMembership) {
			return NextResponse.json(
				{
					success: false,
					error: "This user is already a team member",
				},
				{ status: 400 }
			);
		}

		// Add user to business
		const newMember = await prisma.businessUser.create({
			data: {
				userId: user.id,
				businessId,
				role: parsed.data.role,
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						image: true,
					},
				},
			},
		});

		return NextResponse.json({
			success: true,
			message: "Team member added successfully",
			member: {
				id: newMember.id,
				userId: newMember.userId,
				role: newMember.role,
				createdAt: newMember.createdAt,
				user: newMember.user,
			},
		});
	} catch (error) {
		console.error("Invite team member error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
