import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

// Prisma 7 requires a driver adapter
const connectionString =
	process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/aifinza";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Prisma 7 client initialization with adapter
const createPrismaClient = () => {
	return new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
	});
};

type PrismaClientType = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientType | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export default prisma;
