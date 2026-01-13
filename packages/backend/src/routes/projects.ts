import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { projects, memoryMaps, addressBlocks, registers, fields } from "../db/schema";
import {
  createProjectSchema,
  updateProjectSchema,
  createMemoryMapSchema,
  createAddressBlockSchema,
} from "@register-manager/shared";
import { auth } from "../lib/auth";

// Define variables type for authenticated routes
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const projectRoutes = new Hono<{ Variables: Variables }>();

// Auth middleware for project routes - require authentication
projectRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

// ============================================================================
// Projects CRUD
// ============================================================================

// List all projects for the current user
projectRoutes.get("/", async (c) => {
  const user = c.get("user")!;

  const result = await db.query.projects.findMany({
    // where: eq(projects.userId, user.id), // Removed to allow all users to see all projects
    with: {
      memoryMaps: true,
    },
    orderBy: (_projects: any, { desc }: any) => [desc(_projects.updatedAt)],
  });

  return c.json({ data: result });
});

// Get single project with full hierarchy
projectRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      memoryMaps: {
        with: {
          addressBlocks: {
            with: {
              registers: {
                with: {
                  fields: {
                    with: {
                      resets: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  // Check ownership - Removed for collaboration
  // if (project.userId !== user.id) {
  //   return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  // }

  return c.json({ data: project });
});

// Create project
projectRoutes.post("/", zValidator("json", createProjectSchema), async (c) => {
  const data = c.req.valid("json");
  const user = c.get("user")!;

  const [newProject] = await db
    .insert(projects)
    .values({
      ...data,
      userId: user.id,
    })
    .returning();

  // Create default memory map
  const [defaultMap] = await db
    .insert(memoryMaps)
    .values({
      projectId: newProject.id,
      name: "default_map",
      displayName: "Default Memory Map",
      addressUnitBits: 8,
    })
    .returning();



  return c.json({ data: newProject }, 201);
});

// Update project
projectRoutes.put("/:id", zValidator("json", updateProjectSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const user = c.get("user")!;

  // Check ownership first
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!existing) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  // if (existing.userId !== user.id) {
  //   return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  // }

  const [updated] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  return c.json({ data: updated });
});

// Delete project
projectRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Check ownership first
  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!existing) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  if (existing.userId !== user.id && user.role !== "admin") {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();

  return c.json({ success: true });
});

// ============================================================================
// Memory Maps
// ============================================================================

projectRoutes.get("/:projectId/memory-maps", async (c) => {
  const projectId = c.req.param("projectId");

  const result = await db.query.memoryMaps.findMany({
    where: eq(memoryMaps.projectId, projectId),
    with: {
      addressBlocks: true,
    },
  });

  return c.json({ data: result });
});

projectRoutes.post(
  "/:projectId/memory-maps",
  zValidator("json", createMemoryMapSchema),
  async (c) => {
    const projectId = c.req.param("projectId");
    const data = c.req.valid("json");

    const [newMemoryMap] = await db
      .insert(memoryMaps)
      .values({
        ...data,
        projectId,
      })
      .returning();

    return c.json({ data: newMemoryMap }, 201);
  }
);

// ============================================================================
// Address Blocks
// ============================================================================

projectRoutes.get("/:projectId/memory-maps/:mmId/address-blocks", async (c) => {
  const mmId = c.req.param("mmId");

  const result = await db.query.addressBlocks.findMany({
    where: eq(addressBlocks.memoryMapId, mmId),
    with: {
      registers: true,
    },
  });

  return c.json({ data: result });
});

projectRoutes.post(
  "/:projectId/memory-maps/:mmId/address-blocks",
  zValidator("json", createAddressBlockSchema),
  async (c) => {
    const mmId = c.req.param("mmId");
    const data = c.req.valid("json");

    const [newAddressBlock] = await db
      .insert(addressBlocks)
      .values({
        ...data,
        memoryMapId: mmId,
      })
      .returning();

    return c.json({ data: newAddressBlock }, 201);
  }
);
