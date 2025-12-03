import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/ai/conversations/[conversationId] - Get conversation with messages
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const conversation = await prisma.aIConversation.findFirst({
			where: {
				id: conversationId,
				userId: session.user.id,
			},
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!conversation) {
			return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			conversation: {
				id: conversation.id,
				title: conversation.title,
				businessId: conversation.businessId,
				provider: conversation.provider,
				model: conversation.model,
				createdAt: conversation.createdAt.toISOString(),
				updatedAt: conversation.updatedAt.toISOString(),
				messages: conversation.messages.map((m) => ({
					id: m.id,
					role: m.role.toLowerCase(),
					content: m.content,
					createdAt: m.createdAt.toISOString(),
				})),
			},
		});
	} catch (error) {
		console.error("Get conversation error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// DELETE /api/ai/conversations/[conversationId] - Delete conversation
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ conversationId: string }> }
) {
	try {
		const { conversationId } = await params;
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const conversation = await prisma.aIConversation.findFirst({
			where: {
				id: conversationId,
				userId: session.user.id,
			},
		});

		if (!conversation) {
			return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
		}

		// Delete messages first (cascade should handle this, but being explicit)
		await prisma.aIMessage.deleteMany({
			where: { conversationId },
		});

		// Delete conversation
		await prisma.aIConversation.delete({
			where: { id: conversationId },
		});

		return NextResponse.json({
			success: true,
			message: "Conversation deleted successfully",
		});
	} catch (error) {
		console.error("Delete conversation error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
