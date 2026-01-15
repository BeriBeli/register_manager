import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { plugins } from "../db/schema";
import { eq } from "drizzle-orm";
import { auth } from "../lib/auth";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const pluginRoutes = new Hono<{ Variables: Variables }>();

// Auth middleware
pluginRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

/**
 * GET /api/plugins
 * List all installed plugins
 */
pluginRoutes.get("/", async (c) => {
  const allPlugins = await db.select().from(plugins);
  return c.json({ data: allPlugins });
});

/**
 * POST /api/plugins
 * Upload a new plugin
 */
pluginRoutes.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    const jsFile = body["jsFile"];
    const name = body["name"] as string;
    const description = body["description"] as string;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded or invalid file" }, 400);
    }

    if (!name) {
      return c.json({ error: "Plugin name is required" }, 400);
    }

    // Validate file extension
    if (!file.name.endsWith(".wasm")) {
      return c.json({ error: "Only .wasm files are supported for the main file" }, 400);
    }

    const uploadDir = join(process.cwd(), "uploads", "plugins");

    // Save WASM file
    const fileUUID = randomUUID();
    const fileName = `${fileUUID}-${file.name}`;
    const filePath = join(uploadDir, fileName);
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(buffer));
    const wasmPath = `/uploads/plugins/${fileName}`;

    // Save JS file if present
    let jsPath = undefined;
    if (jsFile && jsFile instanceof File) {
      if (!jsFile.name.endsWith(".js")) {
        return c.json({ error: "Secondary file must be a .js file" }, 400);
      }
      const jsFileName = `${fileUUID}-${jsFile.name}`;
      const jsFilePath = join(uploadDir, jsFileName);
      const jsBuffer = await jsFile.arrayBuffer();
      await writeFile(jsFilePath, new Uint8Array(jsBuffer));
      jsPath = `/uploads/plugins/${jsFileName}`;
    }

    // Save to DB
    const [newPlugin] = await db
      .insert(plugins)
      .values({
        name,
        description,
        type: "wasm",
        wasmPath,
        jsPath,
        supportedExtensions: [".xlsx", ".xls"],
      })
      .returning();

    return c.json({ data: newPlugin }, 201);
  } catch (error) {
    // Error logged
    return c.json({ error: "Failed to upload plugin" }, 500);
  }
});

/**
 * DELETE /api/plugins/:id
 * Delete a plugin
 */
pluginRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  // Get plugin info first to delete file
  const [plugin] = await db.select().from(plugins).where(eq(plugins.id, id));

  if (!plugin) {
    return c.json({ error: "Plugin not found" }, 404);
  }

  try {
    // Helper to delete file from path
    const deleteFile = async (pathStr: string) => {
      const fName = pathStr.split("/").pop();
      if (fName) {
        const fPath = join(process.cwd(), "uploads", "plugins", fName);
        try {
          await unlink(fPath);
        } catch (err) {
          console.warn("Failed to delete plugin file:", fPath, err);
        }
      }
    };

    if (plugin.wasmPath) await deleteFile(plugin.wasmPath);
    if (plugin.jsPath) await deleteFile(plugin.jsPath);

    // Delete DB record
    await db.delete(plugins).where(eq(plugins.id, id));

    return c.json({ success: true });
  } catch (error) {
    // Error logged
    return c.json({ error: "Failed to delete plugin" }, 500);
  }
});
