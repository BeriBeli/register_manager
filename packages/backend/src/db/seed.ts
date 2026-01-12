import { db } from "./index";
import { users } from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Create a default test user
  const [user] = await db
    .insert(users)
    .values({
      id: "00000000-0000-0000-0000-000000000000",
      email: "test@example.com",
      name: "Test User",
      passwordHash: "placeholder", // In production, this would be a hashed password
    })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log("✅ Created test user:", user.email);
  } else {
    console.log("ℹ️  Test user already exists");
  }

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
