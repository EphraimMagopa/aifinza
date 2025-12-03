import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createConversationSchema } from "@/lib/validations/ai";

// GET /api/ai/conversations - List user's conversations
export async function GET(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const businessId = searchParams.get("businessId");

		const where: { userId: string; businessId?: string } = {
			userId: session.user.id,
		};

		if (businessId) {
			where.businessId = businessId;
		}

		const conversations = await prisma.aIConversation.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			include: {
				_count: {
					select: { messages: true },
				},
			},
			take: 50,
		});

		return NextResponse.json({
			success: true,
			conversations: conversations.map((c) => ({
				id: c.id,
				title: c.title,
				businessId: c.businessId,
				provider: c.provider,
				model: c.model,
				createdAt: c.createdAt.toISOString(),
				updatedAt: c.updatedAt.toISOString(),
				messageCount: c._count.messages,
			})),
		});
	} catch (error) {
		console.error("Get conversations error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/ai/conversations - Create a new conversation
export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = createConversationSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { businessId, title } = parsed.data;

		// Verify user has access to business
		const membership = await prisma.businessUser.findUnique({
			where: {
				userId_businessId: {
					userId: session.user.id,
					businessId,
				},
			},
		});

		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const conversation = await prisma.aIConversation.create({
			data: {
				userId: session.user.id,
				businessId,
				title,
				provider: "CLAUDE",
				model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
			},
		});

		return NextResponse.json(
			{
				success: true,
				conversation: {
					id: conversation.id,
					title: conversation.title,
					businessId: conversation.businessId,
					provider: conversation.provider,
					model: conversation.model,
					createdAt: conversation.createdAt.toISOString(),
					updatedAt: conversation.updatedAt.toISOString(),
					messageCount: 0,
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create conversation error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
