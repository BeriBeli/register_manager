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
const isPostgres = connectionString.startsWith("postgres");

// Create database instance
export const db = isPostgres
  ? drizzlePostgres(postgres(connectionString), { schema })
  : drizzleSqlite(new BunDatabase(connectionString.replace("file:", "")), { schema });

export type Database = typeof db;
