import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateEventSchema } from "@/lib/validations/calendar";

interface RouteContext {
	params: Promise<{ businessId: string; eventId: string }>;
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

// GET /api/businesses/[businessId]/calendar/[eventId] - Get single event
export async function GET(_request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, eventId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		const event = await prisma.calendarEvent.findFirst({
			where: {
				id: eventId,
				businessId,
			},
		});

		if (!event) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 });
		}

		return NextResponse.json({ event });
	} catch (error) {
		console.error("Calendar event GET error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// PUT /api/businesses/[businessId]/calendar/[eventId] - Update event
export async function PUT(request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, eventId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Check role permissions
		if (membership.role === "VIEWER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const existingEvent = await prisma.calendarEvent.findFirst({
			where: {
				id: eventId,
				businessId,
			},
		});

		if (!existingEvent) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 });
		}

		const body = await request.json();
		const parsed = updateEventSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Validation failed", details: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { startDate, endDate, completed, ...rest } = parsed.data;

		const updateData: Record<string, unknown> = { ...rest };
		if (startDate) {
			updateData.startDate = new Date(startDate);
		}
		if (endDate !== undefined) {
			updateData.endDate = endDate ? new Date(endDate) : null;
		}
		if (completed !== undefined) {
			updateData.completed = completed;
			updateData.completedAt = completed ? new Date() : null;
		}

		const event = await prisma.calendarEvent.update({
			where: { id: eventId },
			data: updateData,
		});

		return NextResponse.json({ event });
	} catch (error) {
		console.error("Calendar event PUT error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// DELETE /api/businesses/[businessId]/calendar/[eventId] - Delete event
export async function DELETE(_request: Request, context: RouteContext) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { businessId, eventId } = await context.params;
		const membership = await checkBusinessAccess(session.user.id, businessId);
		if (!membership) {
			return NextResponse.json({ error: "Business not found" }, { status: 404 });
		}

		// Check role permissions
		if (membership.role === "VIEWER" || membership.role === "MEMBER") {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const existingEvent = await prisma.calendarEvent.findFirst({
			where: {
				id: eventId,
				businessId,
			},
		});

		if (!existingEvent) {
			return NextResponse.json({ error: "Event not found" }, { status: 404 });
		}

		await prisma.calendarEvent.delete({
			where: { id: eventId },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Calendar event DELETE error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
