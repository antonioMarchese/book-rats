import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// ─────────────────────────────────────────────────────────────────────────────
// Prisma 7's new `prisma-client` generator no longer reads DATABASE_URL
// automatically. It requires a Driver Adapter that provides the connection.
// We use @prisma/adapter-pg which wraps node-postgres (pg).
//
// For Supabase:
//   • DATABASE_URL  — transaction pooler (port 6543). Used by the adapter
//                     for all runtime queries.
//   • DIRECT_URL    — direct connection (port 5432). Used by Prisma CLI
//                     (migrate, db push) via prisma.config.ts.
// ─────────────────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter: adapter as any });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple pool/client instances during hot-reload in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
