import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Running migrations...");

  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed successfully!");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
