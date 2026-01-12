import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL connection
const client = postgres(connectionString);

// Export the database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
