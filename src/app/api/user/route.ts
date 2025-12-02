import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user - Get current user
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
				email: true,
				name: true,
				image: true,
				role: true,
				emailVerified: true,
				createdAt: true,
				businesses: {
					select: {
						id: true,
						role: true,
						business: {
							select: {
								id: true,
								name: true,
								tradingName: true,
								logoUrl: true,
							},
						},
					},
				},
				subscription: {
					select: {
						plan: true,
						status: true,
						stripeCurrentPeriodEnd: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, user });
	} catch (error) {
		console.error("Get user error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
