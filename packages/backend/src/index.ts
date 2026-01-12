import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { projectRoutes } from "./routes/projects";
import { registerRoutes } from "./routes/registers";
import { exportRoutes } from "./routes/export";
import { authRoutes } from "./routes/auth";

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/projects", projectRoutes);
app.route("/api/registers", registerRoutes);
app.route("/api/export", exportRoutes);

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

console.log(`🚀 Server starting on http://${host}:${port}`);

export default {
  port,
  fetch: app.fetch,
};
