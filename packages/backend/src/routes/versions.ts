import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  projects,
  projectVersions,
  memoryMaps,
  addressBlocks,
  registers,
  fields,
  resets,
  enumeratedValues,
} from "../db/schema";
import { auth } from "../lib/auth";
import { hasProjectAccess } from "../lib/access";

// Define variables type for authenticated routes
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const versionRoutes = new Hono<{ Variables: Variables }>();

// Auth middleware - require authentication
versionRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

const createVersionSchema = z.object({
  version: z.string().min(1),
  description: z.string().optional(),
});

// Create Version (Snapshot)
versionRoutes.post(
  "/:projectId",
  zValidator("json", createVersionSchema),
  async (c) => {
    const projectId = c.req.param("projectId");
    const { version, description } = c.req.valid("json");
    const user = c.get("user")!;

    // Verify project access
    const canAccess = await hasProjectAccess(projectId, user.id);
    if (!canAccess && user.role !== "admin") {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // 1. Fetch entire project tree
    const projectData = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
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
                        enumeratedValues: true,
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

    if (!projectData) {
      return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
    }

    // 2. Save snapshot
    const [newVersion] = await db
      .insert(projectVersions)
      .values({
        projectId,
        version,
        description,
        data: projectData as any, // Cast to any or helper type for JSONB
        createdBy: user.id,
      })
      .returning();

    return c.json({ data: newVersion }, 201);
  }
);

// List Versions
versionRoutes.get("/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const user = c.get("user")!;

  // Verify project access
  const canAccess = await hasProjectAccess(projectId, user.id);
  if (!canAccess && user.role !== "admin") {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const versions = await db.query.projectVersions.findMany({
    where: eq(projectVersions.projectId, projectId),
    orderBy: [desc(projectVersions.createdAt)],
    with: {
      resultCreator: true // to show who created it
    }
  });

  // Strip 'data' to keep response light
  const lightVersions = versions.map(({ data, ...v }) => v);

  return c.json({ data: lightVersions });
});

// Restore Version
// WARNING: This operation performs a full delete + recreate strategy.
// - All existing data under the project's memory maps will be deleted
// - New IDs will be generated for all restored entities
// - External references to old IDs will break
// - No optimistic locking is implemented; concurrent modifications may cause data loss
// TODO: Consider implementing updatedAt/version-based optimistic locking
versionRoutes.post("/:projectId/:versionId/restore", async (c) => {
  const projectId = c.req.param("projectId");
  const versionId = c.req.param("versionId");
  const user = c.get("user")!;

  // Verify project access
  const canAccess = await hasProjectAccess(projectId, user.id);
  if (!canAccess && user.role !== "admin") {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  // 1. Get the snapshot
  const versionRecord = await db.query.projectVersions.findFirst({
    where: eq(projectVersions.id, versionId),
  });

  if (!versionRecord) {
    return c.json({ error: "Version not found", code: "NOT_FOUND" }, 404);
  }

  // Verify project match
  if (versionRecord.projectId !== projectId) {
    return c.json({ error: "Version mismatch", code: "BAD_REQUEST" }, 400);
  }

  // 2. Restore logic (Transaction)
  // Warning: This deletes current structure and recreates it.
  // IDs will change unless we force them, but for simplicity we let them regenerate or try to keep them if possible.
  // However, JSON snapshot has IDs. If we re-insert with same IDs, we risk conflicts if we didn't delete everything perfectly.
  // Safer strategy: Delete all children, then insert new ones (with NEW IDs or SAME IDs if Drizzle allows easily).
  // Problem: If we change IDs, references in other systems (if any) break. But here everything is contained.
  // Let's try to keep IDs from snapshot to preserve internal consistency? 
  // Yes, if we delete first.

  const snapshot = versionRecord.data as any; // Typed as any for now

  await db.transaction(async (tx) => {
    // A. Delete existing project content (Memory Maps cascades down)
    // Note: We authenticate user has access to project via middleware/logic ideally.
    // Assuming collaboration access policy from previous task (anyone can edit).

    await tx.delete(memoryMaps).where(eq(memoryMaps.projectId, projectId));

    // B. Re-create from snapshot
    // We need to iterate hierarchically.
    // snapshot.memoryMaps -> addressBlocks -> registers -> fields -> resets/enums

    if (snapshot.memoryMaps && Array.isArray(snapshot.memoryMaps)) {
      for (const mm of snapshot.memoryMaps) {
        // Insert Memory Map
        const { id: oldMmId, addressBlocks: abs, ...mmData } = mm;

        // We can choose to keep old ID or generate new. 
        // Keeping old ID is risky if we didn't delete properly, but we did.
        // Let's generate NEW IDs to be safe and avoid any PK conflicts with "ghost" data or if we soft-deleted.
        // Actually, for "Restore", it's distinct from "Revert". 
        // Let's generate NEW IDs for everything to treat it as fresh state based on old data.

        const [newMm] = await tx
          .insert(memoryMaps)
          .values({
            ...mmData,
            projectId: projectId, // Ensure it links to current project
            // id: oldMmId // Optional: Keep ID? No, let's auto-gen.
          })
          .returning();

        if (abs && Array.isArray(abs)) {
          for (const ab of abs) {
            const { id: oldAbId, registers: regs, ...abData } = ab;
            const [newAb] = await tx
              .insert(addressBlocks)
              .values({
                ...abData,
                memoryMapId: newMm.id,
              })
              .returning();

            if (regs && Array.isArray(regs)) {
              for (const reg of regs) {
                const { id: oldRegId, fields: flds, ...regData } = reg;
                const [newReg] = await tx
                  .insert(registers)
                  .values({
                    ...regData,
                    parentId: newAb.id,
                    parentType: "addressBlock",
                  })
                  .returning();

                if (flds && Array.isArray(flds)) {
                  for (const fld of flds) {
                    const { id: oldFldId, resets: rsts, enumeratedValues: enums, ...fldData } = fld;
                    const [newFld] = await tx
                      .insert(fields)
                      .values({
                        ...fldData,
                        registerId: newReg.id,
                      })
                      .returning();

                    if (rsts && Array.isArray(rsts)) {
                      for (const rst of rsts) {
                        const { id: _, fieldId: __, ...rstData } = rst;
                        await tx.insert(resets).values({
                          ...rstData,
                          fieldId: newFld.id
                        });
                      }
                    }

                    if (enums && Array.isArray(enums)) {
                      for (const enm of enums) {
                        const { id: _, fieldId: __, ...enmData } = enm;
                        await tx.insert(enumeratedValues).values({
                          ...enmData,
                          fieldId: newFld.id
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Update project details (name, vlnv) if they changed in snapshot?
    // Maybe user wants to restore description too.
    await tx.update(projects).set({
      name: snapshot.name,
      description: snapshot.description,
      vlnv: snapshot.vlnv,
      updatedAt: new Date()
    }).where(eq(projects.id, projectId));
  });

  return c.json({ success: true, message: "Project restored successfully" });
});
