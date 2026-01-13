import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { user } from "../db/schema";
import { count } from "drizzle-orm";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin()
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      approved: {
        type: "boolean",
        defaultValue: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          // Check if any user exists
          const existingUsersCount = await db.select({ count: count() }).from(user);
          const isFirstUser = existingUsersCount[0].count === 0;

          return {
            data: {
              ...newUser,
              role: isFirstUser ? "admin" : "user",
              approved: isFirstUser,
            }
          };
        },
      },
    },
  },
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
});

export type Session = typeof auth.$Infer.Session;
