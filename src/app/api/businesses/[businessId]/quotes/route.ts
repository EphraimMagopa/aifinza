import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQuoteSchema } from "@/lib/validations/quote";

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

// Calculate line item totals
function calculateLineItem(item: { quantity: number; unitPrice: number; vatRate: number }) {
	const lineTotal = item.quantity * item.unitPrice;
	const vatAmount = (lineTotal * item.vatRate) / 100;
	return { lineTotal, vatAmount };
}

// GET /api/businesses/[businessId]/quotes - Get all quotes
export async function GET(
	request: Request,
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

		// Parse query params
		const { searchParams } = new URL(request.url);
		const customerId = searchParams.get("customerId");
		const status = searchParams.get("status");
		const limit = searchParams.get("limit");
		const offset = searchParams.get("offset");

		const where: {
			businessId: string;
			customerId?: string;
			status?: "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "INVOICED";
		} = {
			businessId,
		};

		if (customerId) where.customerId = customerId;
		if (
			status &&
			["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED", "INVOICED"].includes(status)
		) {
			where.status = status as "DRAFT" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "INVOICED";
		}

		const [quotes, total] = await Promise.all([
			prisma.quote.findMany({
				where,
				orderBy: { createdAt: "desc" },
				take: limit ? Number.parseInt(limit, 10) : undefined,
				skip: offset ? Number.parseInt(offset, 10) : undefined,
				include: {
					customer: {
						select: { id: true, name: true, email: true },
					},
					lineItems: true,
				},
			}),
			prisma.quote.count({ where }),
		]);

		return NextResponse.json({
			success: true,
			quotes: quotes.map((q) => ({
				...q,
				subtotal: Number(q.subtotal),
				vatAmount: Number(q.vatAmount),
				discount: Number(q.discount),
				total: Number(q.total),
				lineItems: q.lineItems.map((li) => ({
					...li,
					quantity: Number(li.quantity),
					unitPrice: Number(li.unitPrice),
					vatRate: Number(li.vatRate),
					vatAmount: Number(li.vatAmount),
					lineTotal: Number(li.lineTotal),
				})),
			})),
			total,
		});
	} catch (error) {
		console.error("Get quotes error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/quotes - Create quote
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

		const membership = await checkBusinessAccess(session.user.id, businessId, [
			"OWNER",
			"ADMIN",
			"ACCOUNTANT",
		]);
		if (!membership) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createQuoteSchema.safeParse(body);

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

		const { lineItems, expiryDate, ...data } = parsed.data;

		// Calculate totals
		let subtotal = 0;
		let totalVat = 0;
		const processedLineItems = lineItems.map((item, index) => {
			const { lineTotal, vatAmount } = calculateLineItem(item);
			subtotal += lineTotal;
			totalVat += vatAmount;
			return {
				...item,
				vatAmount,
				lineTotal,
				sortOrder: index,
			};
		});

		const total = subtotal + totalVat - (data.discount || 0);

		// Get next quote number
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			select: { quotePrefix: true, nextQuoteNumber: true },
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const quoteNumber = `${business.quotePrefix}${String(business.nextQuoteNumber).padStart(5, "0")}`;

		// Create quote with line items in a transaction
		const quote = await prisma.$transaction(async (tx) => {
			// Update next quote number
			await tx.business.update({
				where: { id: businessId },
				data: { nextQuoteNumber: { increment: 1 } },
			});

			// Create quote
			return tx.quote.create({
				data: {
					...data,
					businessId,
					quoteNumber,
					expiryDate: new Date(expiryDate),
					subtotal,
					vatAmount: totalVat,
					total,
					lineItems: {
						create: processedLineItems,
					},
				},
				include: {
					customer: {
						select: { id: true, name: true, email: true },
					},
					lineItems: true,
				},
			});
		});

		return NextResponse.json(
			{
				success: true,
				message: "Quote created successfully",
				quote: {
					...quote,
					subtotal: Number(quote.subtotal),
					vatAmount: Number(quote.vatAmount),
					discount: Number(quote.discount),
					total: Number(quote.total),
					lineItems: quote.lineItems.map((li) => ({
						...li,
						quantity: Number(li.quantity),
						unitPrice: Number(li.unitPrice),
						vatRate: Number(li.vatRate),
						vatAmount: Number(li.vatAmount),
						lineTotal: Number(li.lineTotal),
					})),
				},
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create quote error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
