import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, or, and, desc } from "drizzle-orm";
import { db } from "../db";
import { projects, memoryMaps, addressBlocks, registerFiles, registers, fields, projectMembers, user as userTable } from "../db/schema";
import {
  createProjectSchema,
  updateProjectSchema,
  createMemoryMapSchema,
  createAddressBlockSchema,
} from "@register-manager/shared";
import { auth } from "../lib/auth";
import { z } from "zod";
import {
  DEFAULT_MEMORY_MAP_NAME,
  DEFAULT_MEMORY_MAP_DISPLAY_NAME,
  DEFAULT_ADDRESS_UNIT_BITS,
} from "../constants";

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

// Helper to check access
const hasProjectAccess = async (projectId: string, userId: string): Promise<boolean> => {
  // Check ownership
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { userId: true },
  });
  if (!project) return false;
  if (project.userId === userId) return true;

  // Check membership
  const member = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ),
  });
  return !!member;
};

// ============================================================================
// Projects CRUD
// ============================================================================

// List all projects (Owned + Shared)
projectRoutes.get("/", async (c) => {
  const user = c.get("user")!;

  // 1. Get projects owned by user
  // 2. Get projects where user is a member
  // Using a raw-ish query or helper logic since ORM logical OR across relations can be tricky,
  // but Drizzle's query builder is powerful enough.
  // Actually, simplest is to use db.select with a join or simpler two-step for clarity.

  // Let's use db.select to get all valid project IDs
  const rows = await db.selectDistinct({ project: projects })
    .from(projects)
    .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
    .where(or(
      eq(projects.userId, user.id),
      eq(projectMembers.userId, user.id)
    ))
    .orderBy(desc(projects.updatedAt));

  // The request above returns { project: ... }, we map it back
  const result = rows.map(r => r.project);

  return c.json({ data: result });
});

// Get single project with full hierarchy
projectRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Check access first
  const hasAccess = await hasProjectAccess(id, user.id);
  // Admin bypass? Maybe. For now, strict access.
  if (!hasAccess && user.role !== 'admin') {
    return c.json({ error: "Project not found or access denied", code: "NOT_FOUND" }, 404);
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
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
  const user = c.get("user")!;

  const [newProject] = await db
    .insert(projects)
    .values({
      ...data,
      userId: user.id,
    })
    .returning();

  // Create default memory map using constants
  await db
    .insert(memoryMaps)
    .values({
      projectId: newProject.id,
      name: DEFAULT_MEMORY_MAP_NAME,
      displayName: DEFAULT_MEMORY_MAP_DISPLAY_NAME,
      addressUnitBits: DEFAULT_ADDRESS_UNIT_BITS,
    });

  return c.json({ data: newProject }, 201);
});

// Update project
projectRoutes.put("/:id", zValidator("json", updateProjectSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const user = c.get("user")!;

  // Check ownership or editor role
  // For now, let's treat any member as an editor
  const hasAccess = await hasProjectAccess(id, user.id);
  if (!hasAccess && user.role !== 'admin') {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

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

  const existing = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });

  if (!existing) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  // Only owner or admin can delete
  if (existing.userId !== user.id && user.role !== "admin") {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  await db
    .delete(projects)
    .where(eq(projects.id, id));

  return c.json({ success: true });
});

// ============================================================================
// Members Config
// ============================================================================

// List members
projectRoutes.get("/:id/members", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  const hasAccess = await hasProjectAccess(id, user.id);
  if (!hasAccess && user.role !== 'admin') return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);

  const members = await db.query.projectMembers.findMany({
    where: eq(projectMembers.projectId, id),
    with: {
      user: {
        columns: { id: true, name: true, email: true, image: true }
      }
    }
  });

  return c.json({ data: members });
});

// Add member by email
projectRoutes.post("/:id/members", zValidator("json", z.object({ email: z.string().email(), role: z.enum(['editor', 'viewer']).default('editor') })), async (c) => {
  const id = c.req.param("id");
  const { email, role } = c.req.valid("json");
  const currentUser = c.get("user")!;

  // Verify currentUser is owner or admin (only owners can add members for now)
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) return c.json({ error: "Not found", code: "NOT_FOUND" }, 404);

  if (project.userId !== currentUser.id && currentUser.role !== 'admin') {
    return c.json({ error: "Only project owner can add members", code: "FORBIDDEN" }, 403);
  }

  // Find target user
  const targetUser = await db.query.user.findFirst({ where: eq(userTable.email, email) });
  if (!targetUser) {
    return c.json({ error: "User not found", code: "USER_NOT_FOUND" }, 404);
  }

  // Check if already a member
  const existingMember = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.projectId, id), eq(projectMembers.userId, targetUser.id))
  });

  if (existingMember) {
    return c.json({ error: "User is already a member", code: "ALREADY_EXISTS" }, 409);
  }

  const [newMember] = await db.insert(projectMembers).values({
    projectId: id,
    userId: targetUser.id,
    role: role
  }).returning();

  // Fetch with user details for response
  const memberWithUser = await db.query.projectMembers.findFirst({
    where: eq(projectMembers.id, newMember.id),
    with: { user: { columns: { id: true, name: true, email: true, image: true } } }
  });

  return c.json({ data: memberWithUser });
});

// Remove member
projectRoutes.delete("/:id/members/:userId", async (c) => {
  const id = c.req.param("id");
  const userIdToRemove = c.req.param("userId");
  const currentUser = c.get("user")!;

  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) return c.json({ error: "Not found", code: "NOT_FOUND" }, 404);

  // Only owner can remove members, or user removing themselves (leave project)
  const isOwner = project.userId === currentUser.id;
  const isSelf = userIdToRemove === currentUser.id;

  if (!isOwner && !isSelf && currentUser.role !== 'admin') {
    return c.json({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  await db.delete(projectMembers)
    .where(and(eq(projectMembers.projectId, id), eq(projectMembers.userId, userIdToRemove)));

  return c.json({ success: true });
});

// ============================================================================
// Memory Maps
// ============================================================================

projectRoutes.get("/:projectId/memory-maps", async (c) => {
  const projectId = c.req.param("projectId");
  const result = await db.query.memoryMaps.findMany({
    where: eq(memoryMaps.projectId, projectId),
    with: { addressBlocks: true },
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
      .values({ ...data, projectId })
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
    with: { registers: true },
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
      .values({ ...data, memoryMapId: mmId })
      .returning();
    return c.json({ data: newAddressBlock }, 201);
  }
);
