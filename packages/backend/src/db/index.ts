import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleSqlite } from "drizzle-orm/bun-sqlite";
import postgres from "postgres";
import { Database as BunDatabase } from "bun:sqlite";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Determine database type
export const isPostgres = connectionString.startsWith("postgres");

// Create the appropriate database instance
const rawDb = isPostgres
  ? drizzlePostgres(postgres(connectionString), { schema })
  : drizzleSqlite(new BunDatabase(connectionString.replace("file:", "")), { schema });

// Export the database instance with proper typing
// We use 'as any' to bypass the union type issues since we know
// the methods will work at runtime regardless of which database is used
export const db = rawDb as any;

export type Database = typeof db;
