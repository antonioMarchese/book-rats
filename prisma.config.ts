import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js uses .env.local — load it with higher priority for local development
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use the DIRECT_URL (non-pooled) for Prisma Migrate — required when using
    // Supabase's PgBouncer, as it does not support migration commands.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
