import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { migrate as migrateSqlite } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Running migrations...");

  const connectionString = process.env.DATABASE_URL || "";
  const isPostgres = connectionString.startsWith("postgres");

  if (isPostgres) {
    await migratePostgres(db as any, { migrationsFolder: "./drizzle" });
  } else {
    await migrateSqlite(db as any, { migrationsFolder: "./drizzle" });
  }

  console.log("Migrations completed successfully!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
