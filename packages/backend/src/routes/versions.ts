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

  const snapshot = versionRecord.data as any;

  try {
    await db.transaction(async (tx) => {
      // A. Delete existing project content (Memory Maps cascades down)
      await tx.delete(memoryMaps).where(eq(memoryMaps.projectId, projectId));

      // B. Re-create from snapshot with explicit field extraction
      if (snapshot.memoryMaps && Array.isArray(snapshot.memoryMaps)) {
        for (const mm of snapshot.memoryMaps) {
          // Extract only the fields we need for memoryMaps table
          const [newMm] = await tx
            .insert(memoryMaps)
            .values({
              projectId: projectId,
              name: mm.name,
              displayName: mm.displayName || null,
              description: mm.description || null,
              addressUnitBits: mm.addressUnitBits || 8,
              shared: mm.shared || false,
            })
            .returning();

          if (mm.addressBlocks && Array.isArray(mm.addressBlocks)) {
            for (const ab of mm.addressBlocks) {
              const [newAb] = await tx
                .insert(addressBlocks)
                .values({
                  memoryMapId: newMm.id,
                  name: ab.name,
                  displayName: ab.displayName || null,
                  description: ab.description || null,
                  baseAddress: ab.baseAddress,
                  range: ab.range,
                  width: ab.width,
                  usage: ab.usage || "register",
                  volatile: ab.volatile || false,
                  typeIdentifier: ab.typeIdentifier || null,
                })
                .returning();

              if (ab.registers && Array.isArray(ab.registers)) {
                for (const reg of ab.registers) {
                  const [newReg] = await tx
                    .insert(registers)
                    .values({
                      parentId: newAb.id,
                      parentType: "addressBlock",
                      name: reg.name,
                      displayName: reg.displayName || null,
                      description: reg.description || null,
                      addressOffset: reg.addressOffset,
                      size: reg.size,
                      volatile: reg.volatile || false,
                      typeIdentifier: reg.typeIdentifier || null,
                    })
                    .returning();

                  if (reg.fields && Array.isArray(reg.fields)) {
                    for (const fld of reg.fields) {
                      const [newFld] = await tx
                        .insert(fields)
                        .values({
                          registerId: newReg.id,
                          name: fld.name,
                          displayName: fld.displayName || null,
                          description: fld.description || null,
                          bitOffset: fld.bitOffset,
                          bitWidth: fld.bitWidth,
                          access: fld.access || null,
                          modifiedWriteValue: fld.modifiedWriteValue || null,
                          readAction: fld.readAction || null,
                          testable: fld.testable ?? true,
                          volatile: fld.volatile || false,
                        })
                        .returning();

                      if (fld.resets && Array.isArray(fld.resets)) {
                        for (const rst of fld.resets) {
                          await tx.insert(resets).values({
                            fieldId: newFld.id,
                            value: rst.value,
                            resetTypeRef: rst.resetTypeRef || "HARD",
                            mask: rst.mask || null,
                          });
                        }
                      }

                      if (fld.enumeratedValues && Array.isArray(fld.enumeratedValues)) {
                        for (const enm of fld.enumeratedValues) {
                          await tx.insert(enumeratedValues).values({
                            fieldId: newFld.id,
                            name: enm.name,
                            displayName: enm.displayName || null,
                            value: enm.value,
                            description: enm.description || null,
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

      // Update project details from snapshot
      await tx.update(projects).set({
        name: snapshot.name,
        description: snapshot.description,
        vlnv: snapshot.vlnv,
        updatedAt: new Date()
      }).where(eq(projects.id, projectId));
    });

    return c.json({ success: true, message: "Project restored successfully" });
  } catch (error: any) {
    // Error logged
    return c.json({
      error: "Failed to restore version",
      code: "RESTORE_FAILED",
      details: error.message
    }, 500);
  }
});
