import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function PATCH(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		const parsed = updateProfileSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { name } = parsed.data;

		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: { name },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
			},
		});

		return NextResponse.json({
			success: true,
			user: updatedUser,
		});
	} catch (error) {
		console.error("Profile update error:", error);
		return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
	}
}

export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				emailVerified: true,
				createdAt: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ user });
	} catch (error) {
		console.error("Profile fetch error:", error);
		return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
	}
}
