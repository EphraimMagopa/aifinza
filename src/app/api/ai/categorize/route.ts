import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categorizationRequestSchema = z.object({
	businessId: z.string(),
	transactionIds: z.array(z.string()).min(1).max(50),
});

const categoryResultSchema = z.object({
	transactionId: z.string(),
	suggestedCategoryId: z.string().nullable(),
	suggestedCategoryName: z.string(),
	confidence: z.number().min(0).max(1),
	reasoning: z.string(),
});

const categorizationResultSchema = z.object({
	results: z.array(categoryResultSchema),
});

// Helper to check business access
async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: { userId, businessId },
		},
	});
}

// POST /api/ai/categorize - Categorize transactions using AI
export async function POST(request: Request) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = categorizationRequestSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { businessId, transactionIds } = parsed.data;

		// Verify access to business
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Get transactions to categorize
		const transactions = await prisma.transaction.findMany({
			where: {
				id: { in: transactionIds },
				businessId,
			},
			select: {
				id: true,
				description: true,
				amount: true,
				type: true,
				date: true,
			},
		});

		if (transactions.length === 0) {
			return NextResponse.json({ error: "No transactions found" }, { status: 404 });
		}

		// Get business categories
		const categories = await prisma.category.findMany({
			where: { businessId },
			select: {
				id: true,
				name: true,
				type: true,
			},
		});

		if (categories.length === 0) {
			return NextResponse.json(
				{ error: "No categories found. Please create categories first." },
				{ status: 400 }
			);
		}

		// Build the prompt
		const categoriesList = categories.map((c) => `- ${c.name} (${c.type}, ID: ${c.id})`).join("\n");

		const transactionsList = transactions
			.map(
				(t) =>
					`- ID: ${t.id}, Description: "${t.description}", Amount: R${t.amount.toNumber().toFixed(2)}, Type: ${t.type}, Date: ${t.date.toISOString().split("T")[0]}`
			)
			.join("\n");

		const model = getModel("CLAUDE");

		const { object } = await generateObject({
			model,
			schema: categorizationResultSchema,
			prompt: `You are a financial categorization assistant for a South African business.
Analyze the following transactions and suggest the most appropriate category for each.

Available Categories:
${categoriesList}

Transactions to categorize:
${transactionsList}

For each transaction:
1. Match INCOME transactions to INCOME categories and EXPENSE transactions to EXPENSE categories
2. Analyze the description to determine the best category
3. Consider common South African business patterns (e.g., "FNB" or "ABSA" fees are bank charges, "Woolworths" or "PnP" might be groceries/supplies)
4. Provide a confidence score (0-1) based on how certain you are
5. Provide brief reasoning for your choice

If no category is a good match, set suggestedCategoryId to null and explain why.`,
		});

		// Update transactions with AI suggestions (mark as AI categorized but don't auto-apply)
		const updates = object.results
			.filter((r) => r.suggestedCategoryId && r.confidence >= 0.7)
			.map((r) =>
				prisma.transaction.update({
					where: { id: r.transactionId },
					data: {
						categoryId: r.suggestedCategoryId,
						aiCategorized: true,
						aiConfidence: r.confidence,
					},
				})
			);

		if (updates.length > 0) {
			await prisma.$transaction(updates);
		}

		return NextResponse.json({
			results: object.results,
			categorized: updates.length,
			total: transactions.length,
		});
	} catch (error) {
		console.error("AI Categorization error:", error);
		return NextResponse.json({ error: "Failed to categorize transactions" }, { status: 500 });
	}
}
