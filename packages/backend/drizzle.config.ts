import type { Config } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const isPostgres = dbUrl.startsWith("postgres");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: dbUrl }
    : { url: dbUrl.replace("file:", "") },
} satisfies Config;
