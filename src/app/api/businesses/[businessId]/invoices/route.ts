import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoiceSchema } from "@/lib/validations/invoice";

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

type InvoiceStatus =
	| "DRAFT"
	| "SENT"
	| "VIEWED"
	| "PARTIALLY_PAID"
	| "PAID"
	| "OVERDUE"
	| "CANCELLED"
	| "WRITTEN_OFF";

// GET /api/businesses/[businessId]/invoices - Get all invoices
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
			status?: InvoiceStatus;
		} = {
			businessId,
		};

		if (customerId) where.customerId = customerId;
		const validStatuses: InvoiceStatus[] = [
			"DRAFT",
			"SENT",
			"VIEWED",
			"PARTIALLY_PAID",
			"PAID",
			"OVERDUE",
			"CANCELLED",
			"WRITTEN_OFF",
		];
		if (status && validStatuses.includes(status as InvoiceStatus)) {
			where.status = status as InvoiceStatus;
		}

		const [invoices, total] = await Promise.all([
			prisma.invoice.findMany({
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
			prisma.invoice.count({ where }),
		]);

		return NextResponse.json({
			success: true,
			invoices: invoices.map((inv) => ({
				...inv,
				subtotal: Number(inv.subtotal),
				vatAmount: Number(inv.vatAmount),
				discount: Number(inv.discount),
				total: Number(inv.total),
				amountPaid: Number(inv.amountPaid),
				lineItems: inv.lineItems.map((li) => ({
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
		console.error("Get invoices error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/invoices - Create invoice
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
		const parsed = createInvoiceSchema.safeParse(body);

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

		const { lineItems, dueDate, ...data } = parsed.data;

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

		// Get next invoice number
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			select: { invoicePrefix: true, nextInvoiceNumber: true },
		});

		if (!business) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const invoiceNumber = `${business.invoicePrefix}${String(business.nextInvoiceNumber).padStart(5, "0")}`;

		// Create invoice with line items in a transaction
		const invoice = await prisma.$transaction(async (tx) => {
			// Update next invoice number
			await tx.business.update({
				where: { id: businessId },
				data: { nextInvoiceNumber: { increment: 1 } },
			});

			// Create invoice
			return tx.invoice.create({
				data: {
					...data,
					businessId,
					invoiceNumber,
					dueDate: new Date(dueDate),
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
				message: "Invoice created successfully",
				invoice: {
					...invoice,
					subtotal: Number(invoice.subtotal),
					vatAmount: Number(invoice.vatAmount),
					discount: Number(invoice.discount),
					total: Number(invoice.total),
					amountPaid: Number(invoice.amountPaid),
					lineItems: invoice.lineItems.map((li) => ({
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
		console.error("Create invoice error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
