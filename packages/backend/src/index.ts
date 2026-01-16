import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { projectRoutes } from "./routes/projects";
import { registerRoutes } from "./routes/registers";
import { exportRoutes } from "./routes/export";
import { addressBlockRoutes } from "./routes/addressBlocks";
import { versionRoutes } from "./routes/versions";
import { importRoutes } from "./routes/import";
import { pluginRoutes } from "./routes/plugins";
import { serveStatic } from "hono/bun";
import { auth } from "./lib/auth";

// Define app type with session variables
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

// Create Hono app
const app = new Hono<{ Variables: Variables }>();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());

// CORS configuration - must be before routes
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Session middleware - extract user session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  // Check approval status
  // We allow the session to be set so the frontend can display a "Pending Approval" message
  // But we blocking core business routes is handled by the route handlers or a specific middleware
  // For now, we set the user.

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

// Better Auth handler - handles all auth endpoints
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

// Session endpoint - returns current user info
app.get("/api/session", (c) => {
  const session = c.get("session");
  const user = c.get("user");

  if (!user) {
    return c.json({ user: null, session: null }, 401);
  }

  return c.json({ session, user });
});

// Middleware to block unapproved users from business routes
const approvalMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (user && !user.approved) {
    return c.json({ error: "Account pending approval", code: "PENDING_APPROVAL" }, 403);
  }
  await next();
};

// Apply approval middleware to specific routes
app.use("/api/projects/*", approvalMiddleware as any);
app.use("/api/registers/*", approvalMiddleware as any);
app.use("/api/export/*", approvalMiddleware as any);
app.use("/api/address-blocks/*", approvalMiddleware as any);
app.use("/api/import/*", approvalMiddleware as any);
app.use("/api/admin/*", approvalMiddleware as any);

// API routes
app.route("/api/projects", projectRoutes);
app.route("/api/registers", registerRoutes);
app.route("/api/export", exportRoutes);
app.route("/api/address-blocks", addressBlockRoutes);
app.route("/api/projects/versions", versionRoutes);
app.route("/api/import", importRoutes);
app.route("/api/plugins", pluginRoutes);

// Static file serving for uploads (plugins)
app.use("/uploads/*", serveStatic({ root: "./uploads" }));

// Custom Admin Routes (Admin Plugin handles list, delete, etc.)
// We only keep custom logic like 'approve' that isn't standard in the plugin
app.post("/api/admin/users/:id/approve", async (c) => {
  const user = c.get("user");
  if (user?.role !== "admin") {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const id = c.req.param("id");
  const { db } = await import("./db");
  const { user: userTable } = await import("./db/schema");
  const { eq } = await import("drizzle-orm");

  await db.update(userTable).set({ approved: true }).where(eq(userTable.id, id));
  return c.json({ success: true });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found", code: "NOT_FOUND" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
});

// Start server
const port = parseInt(process.env.PORT || "3000");
const host = process.env.HOST || "localhost";

// Seed Admin
// Security: ADMIN_EMAIL and ADMIN_PASSWORD must be explicitly set via environment variables.
// If not set, admin seeding is skipped.
const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Require explicit configuration in all environments
  if (!adminEmail || !adminPassword) {
    console.warn("⚠️  ADMIN_EMAIL and/or ADMIN_PASSWORD not set. Skipping admin seeding.");
    console.warn("   Set these environment variables to create an admin account.");
    return;
  }

  try {
    const { db } = await import("./db");
    const { user: userTable } = await import("./db/schema");
    const { eq } = await import("drizzle-orm");

    const existing = await db.query.user.findFirst({
      where: eq(userTable.email, adminEmail)
    });

    if (!existing) {
      console.log("🌱 Seeding admin account...");
      await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: adminPassword,
          name: "Administrator",
        }
      });
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
      // Ensure admin has correct rights even if exists
      if (existing.role !== "admin" || !existing.approved) {
        await db.update(userTable)
          .set({ role: "admin", approved: true })
          .where(eq(userTable.email, adminEmail));
        console.log("✅ Admin permissions corrected for existing account.");
      }
    }
  } catch (e) {
    console.error("Failed to seed admin:", e);
  }
};

seedAdmin().then(() => {
  console.log(`🚀 Server starting on http://${host}:${port}`);
});

export default {
  port,
  fetch: app.fetch,
};
