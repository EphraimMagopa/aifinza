import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTeamMemberSchema } from "@/lib/validations/team";

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

// PATCH /api/businesses/[businessId]/team/[userId] - Update member role
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ businessId: string; userId: string }> }
) {
	try {
		const { businessId, userId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER and ADMIN can update roles
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Find target member
		const targetMember = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId,
					businessId,
				},
			},
		});

		if (!targetMember) {
			return NextResponse.json({ error: "Team member not found" }, { status: 404 });
		}

		// Cannot change owner role
		if (targetMember.role === "OWNER") {
			return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 });
		}

		// Only owner can promote to admin
		const body = await request.json();
		const parsed = updateTeamMemberSchema.safeParse(body);

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

		// Only OWNER can assign ADMIN role
		if (parsed.data.role === "ADMIN" && membership.role !== "OWNER") {
			return NextResponse.json({ error: "Only the owner can assign admin role" }, { status: 403 });
		}

		const updatedMember = await prisma.businessUser.update({
			where: {
				userId_businessId: {
					userId,
					businessId,
				},
			},
			data: { role: parsed.data.role },
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
			message: "Team member role updated",
			member: {
				id: updatedMember.id,
				userId: updatedMember.userId,
				role: updatedMember.role,
				createdAt: updatedMember.createdAt,
				user: updatedMember.user,
			},
		});
	} catch (error) {
		console.error("Update team member error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/team/[userId] - Remove team member
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ businessId: string; userId: string }> }
) {
	try {
		const { businessId, userId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Only OWNER and ADMIN can remove members
		const membership = await checkBusinessAccess(session.user.id, businessId, ["OWNER", "ADMIN"]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Find target member
		const targetMember = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId,
					businessId,
				},
			},
		});

		if (!targetMember) {
			return NextResponse.json({ error: "Team member not found" }, { status: 404 });
		}

		// Cannot remove owner
		if (targetMember.role === "OWNER") {
			return NextResponse.json({ error: "Cannot remove the business owner" }, { status: 403 });
		}

		// Admin cannot remove other admins (only owner can)
		if (targetMember.role === "ADMIN" && membership.role !== "OWNER") {
			return NextResponse.json({ error: "Only the owner can remove admins" }, { status: 403 });
		}

		await prisma.businessUser.delete({
			where: {
				userId_businessId: {
					userId,
					businessId,
				},
			},
		});

		return NextResponse.json({
			success: true,
			message: "Team member removed successfully",
		});
	} catch (error) {
		console.error("Remove team member error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
