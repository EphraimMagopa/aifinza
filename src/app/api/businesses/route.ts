import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Validation schema for creating a business
const createBusinessSchema = z.object({
	name: z.string().min(2, "Business name must be at least 2 characters"),
	tradingName: z.string().optional(),
	businessType: z.enum([
		"SOLE_PROPRIETOR",
		"PARTNERSHIP",
		"PRIVATE_COMPANY",
		"PUBLIC_COMPANY",
		"CLOSE_CORPORATION",
		"NON_PROFIT",
		"TRUST",
		"OTHER",
	]),
	registrationNumber: z.string().optional(),
	taxNumber: z.string().optional(),
	vatNumber: z.string().optional(),
	isVatRegistered: z.boolean().default(false),
	industry: z.string().optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	addressLine1: z.string().optional(),
	addressLine2: z.string().optional(),
	city: z.string().optional(),
	province: z
		.enum([
			"EASTERN_CAPE",
			"FREE_STATE",
			"GAUTENG",
			"KWAZULU_NATAL",
			"LIMPOPO",
			"MPUMALANGA",
			"NORTHERN_CAPE",
			"NORTH_WEST",
			"WESTERN_CAPE",
		])
		.optional(),
	postalCode: z.string().optional(),
});

// GET /api/businesses - Get all businesses for current user
export async function GET() {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const businesses = await prisma.businessUser.findMany({
			where: { userId: session.user.id },
			include: {
				business: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({
			success: true,
			businesses: businesses.map((bu) => ({
				...bu.business,
				role: bu.role,
			})),
		});
	} catch (error) {
		console.error("Get businesses error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}

// POST /api/businesses - Create a new business
export async function POST(request: Request) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validate input
		const parsed = createBusinessSchema.safeParse(body);
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

		// Create business and link user as owner
		const business = await prisma.business.create({
			data: {
				...parsed.data,
				users: {
					create: {
						userId: session.user.id,
						role: "OWNER",
					},
				},
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Business created successfully",
				business,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Create business error:", error);
		return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
	}
}
