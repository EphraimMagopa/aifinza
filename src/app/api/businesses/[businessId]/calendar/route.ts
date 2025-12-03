import type { EventType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventSchema } from "@/lib/validations/calendar";

interface RouteContext {
	params: Promise<{ businessId: string }>;
}

// Helper to check business access
async function checkBusinessAccess(userId: string, businessId: string) {
	return prisma.businessUser.findUnique({
		where: {
			userId_businessId: {
				userId,
				businessId,
			},
		},
	});
}

// GET /api/businesses/[businessId]/calendar - List events
export async function GET(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const type = searchParams.get("type");

		const where: Prisma.CalendarEventWhereInput = {
			businessId,
		};

		if (startDate || endDate) {
			where.startDate = {};
			if (startDate) {
				where.startDate.gte = new Date(startDate);
			}
			if (endDate) {
				where.startDate.lte = new Date(endDate);
			}
		}

		if (type) {
			where.type = type as EventType;
		}

		const events = await prisma.calendarEvent.findMany({
			where,
			orderBy: { startDate: "asc" },
		});

		return NextResponse.json({ events });
	} catch (error) {
		console.error("Calendar GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// POST /api/businesses/[businessId]/calendar - Create event
export async function POST(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Check role permissions (VIEWER cannot create)
		if (membership.role === "VIEWER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const body = await request.json();
		const parsed = createEventSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { startDate, endDate, ...rest } = parsed.data;

		const event = await prisma.calendarEvent.create({
			data: {
				...rest,
				businessId,
				userId: session.user.id,
				startDate: new Date(startDate),
				endDate: endDate ? new Date(endDate) : null,
			},
		});

		return NextResponse.json({ event }, { status: 201 });
	} catch (error) {
		console.error("Calendar POST error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
