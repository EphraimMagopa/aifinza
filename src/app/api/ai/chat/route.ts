import { streamText } from "ai";
import { NextResponse } from "next/server";

import { buildSystemPrompt, getBusinessContext, getModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatMessageSchema } from "@/lib/validations/ai";

// Helper to check if user has access to business
async function checkBusinessAccess(userId: string, businessId: string) {
	const membership = await prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});

	return membership;
}

// POST /api/ai/chat - Streaming chat endpoint
export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = chatMessageSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: parsed.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const { message, conversationId, businessId } = parsed.data;

		// Verify access to business
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Get or create conversation
		let conversation:
			| Awaited<ReturnType<typeof prisma.aIConversation.findFirst>>
			| Awaited<ReturnType<typeof prisma.aIConversation.create>>;
		if (conversationId) {
			conversation = await prisma.aIConversation.findFirst({
				where: {
					id: conversationId,
					userId: session.user.id,
					businessId,
				},
			});
			if (!conversation) {
				return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
			}
		} else {
			// Create new conversation
			conversation = await prisma.aIConversation.create({
				data: {
					userId: session.user.id,
					businessId,
					provider: "CLAUDE",
					model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
				},
			});
		}

		// Get previous messages for context
		const previousMessages = await prisma.aIMessage.findMany({
			where: { conversationId: conversation.id },
			orderBy: { createdAt: "asc" },
			take: 20, // Limit context window
		});

		// Get business context
		const businessContext = await getBusinessContext({ businessId });

		// Build messages array
		const messages = [
			...previousMessages.map((m) => ({
				role: m.role.toLowerCase() as "user" | "assistant" | "system",
				content: m.content,
			})),
			{ role: "user" as const, content: message },
		];

		// Save user message
		await prisma.aIMessage.create({
			data: {
				conversationId: conversation.id,
				role: "USER",
				content: message,
			},
		});

		// Get AI model
		const model = getModel("CLAUDE");

		// Stream the response
		const result = streamText({
			model,
			system: buildSystemPrompt(businessContext),
			messages,
			async onFinish({ text, usage }) {
				// Save assistant response
				await prisma.aIMessage.create({
					data: {
						conversationId: conversation.id,
						role: "ASSISTANT",
						content: text,
						tokenCount: usage?.totalTokens,
					},
				});

				// Update conversation title if it's the first message
				if (previousMessages.length === 0) {
					const title = message.length > 50 ? `${message.substring(0, 47)}...` : message;
					await prisma.aIConversation.update({
						where: { id: conversation.id },
						data: { title },
					});
				}
			},
		});

		// Return streaming response with conversation ID in header
		const response = result.toTextStreamResponse();
		response.headers.set("X-Conversation-Id", conversation.id);
		return response;
	} catch (error) {
		console.error("Chat API error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
