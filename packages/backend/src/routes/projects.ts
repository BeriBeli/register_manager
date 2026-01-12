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

export const projectRoutes = new Hono();

// ============================================================================
// Projects CRUD
// ============================================================================

// List all projects (TODO: filter by user after auth)
projectRoutes.get("/", async (c) => {
  const result = await db.query.projects.findMany({
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

  return c.json({ data: project });
});

// Create project
projectRoutes.post("/", zValidator("json", createProjectSchema), async (c) => {
  const data = c.req.valid("json");

  // TODO: Get userId from auth session
  const userId = "00000000-0000-0000-0000-000000000000"; // Placeholder

  const [newProject] = await db
    .insert(projects)
    .values({
      ...data,
      userId,
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

  const [updated] = await db
    .update(projects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ data: updated });
});

// Delete project
projectRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

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
