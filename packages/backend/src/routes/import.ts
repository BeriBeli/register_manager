import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db";
import { projects, memoryMaps, addressBlocks, registers, fields, resets, plugins } from "../db/schema";
import { auth } from "../lib/auth";
import type {
    ImportData,
    ImportPlugin,
} from "@register-manager/shared";

// Define variables type for authenticated routes
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const importRoutes = new Hono<{ Variables: Variables }>();

// ============================================================================
// Available Plugins
// ============================================================================

const availablePlugins: ImportPlugin[] = [
  {
    id: "irgen",
    name: "irgen Excel Format",
    description: "Supports irgen-defined Excel format (version/address map/register sheets)",
    type: "wasm",
    wasmUrl: "/plugins/irgen.wasm",
    supportedExtensions: [".xlsx", ".xls"],
  },
  {
    id: "simple-csv",
    name: "Simple CSV Format",
    description: "Simple flat CSV format with one field per row",
    type: "builtin",
    supportedExtensions: [".csv"],
  },
];

// Auth middleware
importRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

// ============================================================================
// Plugin Management
// ============================================================================

/**
 * GET /api/import/plugins
 * List available import plugins
 */
importRoutes.get("/plugins", async (c) => {
  try {
    const dbPlugins = await db.select().from(plugins);

    // Transform DB plugins to ImportPlugin type
    const mappedPlugins: ImportPlugin[] = dbPlugins.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      type: p.type as "wasm" | "builtin", // Safe cast as we default to "wasm"
      wasmUrl: p.type === "wasm" ? p.wasmPath : undefined,
      jsUrl: p.jsPath || undefined,
      supportedExtensions: p.supportedExtensions as string[],
    }));

    // Add builtin plugins if needed (optional)
    // const builtinPlugins: ImportPlugin[] = [... availablePlugins];

    return c.json({ data: mappedPlugins });
  } catch (error) {
    // Error logged
    return c.json({ error: "Failed to fetch plugins" }, 500);
  }
});

// ============================================================================
// Import Execution
// ============================================================================

// Schema for import execution
const importExecuteSchema = z.object({
  data: z.object({
    project: z.object({
      name: z.string().min(1),
      vendor: z.string().min(1),
      library: z.string().min(1),
      version: z.string().min(1),
      displayName: z.string().optional(),
      description: z.string().optional(),
    }),
    memoryMaps: z.array(z.object({
      name: z.string().min(1),
      displayName: z.string().optional(),
      description: z.string().optional(),
      addressUnitBits: z.number().optional(),
      addressBlocks: z.array(z.object({
        name: z.string().min(1),
        baseAddress: z.string(),
        range: z.string(),
        width: z.number().optional(),
        displayName: z.string().optional(),
        description: z.string().optional(),
        registers: z.array(z.object({
          name: z.string().min(1),
          addressOffset: z.string(),
          size: z.number().optional(),
          displayName: z.string().optional(),
          description: z.string().optional(),
          fields: z.array(z.object({
            name: z.string().min(1),
            bitOffset: z.number(),
            bitWidth: z.number(),
            access: z.string().optional(),
            resetValue: z.string().optional(),
            displayName: z.string().optional(),
            description: z.string().optional(),
          })),
        })),
      })),
    })),
  }),
});

/**
 * POST /api/import/execute
 * Execute import and create project from parsed data
 */
importRoutes.post("/execute", zValidator("json", importExecuteSchema), async (c) => {
    const { data } = c.req.valid("json") as { data: ImportData };
    const user = c.get("user")!;

    try {
        const newProject = await db.transaction(async (tx) => {
            // Create project
            const [project] = await tx
                .insert(projects)
                .values({
                    userId: user.id,
                    name: data.project.name,
                    displayName: data.project.displayName,
                    description: data.project.description,
                    vlnv: {
                        vendor: data.project.vendor,
                        library: data.project.library,
                        name: data.project.name,
                        version: data.project.version,
                    },
                })
                .returning();

            // Create memory maps
            for (const mm of data.memoryMaps) {
                const [newMemoryMap] = await tx
                    .insert(memoryMaps)
                    .values({
                        projectId: project.id,
                        name: mm.name,
                        displayName: mm.displayName,
                        description: mm.description,
                        addressUnitBits: mm.addressUnitBits ?? 8,
                    })
                    .returning();

                // Create address blocks
                for (const ab of mm.addressBlocks) {
                    const [newAddressBlock] = await tx
                        .insert(addressBlocks)
                        .values({
                            memoryMapId: newMemoryMap.id,
                            name: ab.name,
                            displayName: ab.displayName,
                            description: ab.description,
                            baseAddress: ab.baseAddress,
                            range: ab.range,
                            width: ab.width ?? 32,
                            usage: "register",
                        })
                        .returning();

                    // Create registers
                    for (const reg of ab.registers) {
                        const [newRegister] = await tx
                            .insert(registers)
                            .values({
                                parentId: newAddressBlock.id,
                                parentType: "addressBlock",
                                name: reg.name,
                                displayName: reg.displayName,
                                description: reg.description,
                                addressOffset: reg.addressOffset,
                                size: reg.size ?? 32,
                            })
                            .returning();

                        // Create fields
                        for (const field of reg.fields) {
                            const [newField] = await tx
                                .insert(fields)
                                .values({
                                    registerId: newRegister.id,
                                    name: field.name,
                                    displayName: field.displayName,
                                    description: field.description,
                                    bitOffset: field.bitOffset,
                                    bitWidth: field.bitWidth,
                                    access: field.access ?? "read-write",
                                })
                                .returning();

                            // Create reset value if provided
                            if (field.resetValue) {
                                await tx.insert(resets).values({
                                    fieldId: newField.id,
                                    value: field.resetValue,
                                });
                            }
                        }
                    }
                }
            }

            return project;
        });

        // Calculate stats
        let registerCount = 0;
        let fieldCount = 0;
        for (const mm of data.memoryMaps) {
            for (const ab of mm.addressBlocks) {
                registerCount += ab.registers.length;
                for (const reg of ab.registers) {
                    fieldCount += reg.fields.length;
                }
            }
        }

        return c.json({
            success: true,
            data: {
                projectId: newProject.id,
                projectName: newProject.name,
                stats: {
                    memoryMapCount: data.memoryMaps.length,
                    addressBlockCount: data.memoryMaps.reduce((sum, mm) => sum + mm.addressBlocks.length, 0),
                    registerCount,
                    fieldCount,
                },
            },
        }, 201);
    } catch (error) {
        // Error logged
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error during import",
        }, 500);
    }
});

/**
 * POST /api/import/validate
 * Validate import data without creating project
 */
importRoutes.post("/validate", zValidator("json", importExecuteSchema), async (c) => {
    const { data } = c.req.valid("json") as { data: ImportData };
    const warnings: string[] = [];
    const parseAddressOffset = (value: string) => {
        const trimmed = value.trim().toLowerCase();
        const parsed = trimmed.startsWith("0x") ? parseInt(trimmed, 16) : parseInt(trimmed, 10);
        return Number.isNaN(parsed) ? null : parsed;
    };

    // Validate project name format
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.project.name)) {
        warnings.push(`Project name "${data.project.name}" should be a valid identifier`);
    }

    // Validate memory maps
    for (const mm of data.memoryMaps) {
        for (const ab of mm.addressBlocks) {
            // Check for overlapping registers
            const sortedRegs = [...ab.registers].sort((a, b) => {
                const offsetA = parseAddressOffset(a.addressOffset);
                const offsetB = parseAddressOffset(b.addressOffset);
                const normalizedA = offsetA ?? Number.MAX_SAFE_INTEGER;
                const normalizedB = offsetB ?? Number.MAX_SAFE_INTEGER;
                return normalizedA - normalizedB;
            });

            for (let i = 0; i < sortedRegs.length - 1; i++) {
                const curr = sortedRegs[i];
                const next = sortedRegs[i + 1];
                const currOffset = parseAddressOffset(curr.addressOffset);
                const currSize = (curr.size ?? 32) / 8;
                const nextOffset = parseAddressOffset(next.addressOffset);

                if (currOffset === null || nextOffset === null) {
                    if (currOffset === null) {
                        warnings.push(`Register "${curr.name}" has an invalid address offset in "${ab.name}"`);
                    }
                    if (nextOffset === null) {
                        warnings.push(`Register "${next.name}" has an invalid address offset in "${ab.name}"`);
                    }
                    continue;
                }

                if (currOffset + currSize > nextOffset) {
                    warnings.push(`Registers "${curr.name}" and "${next.name}" may overlap in address block "${ab.name}"`);
                }
            }

            // Check field bit ranges within registers
            for (const reg of ab.registers) {
                const regSize = reg.size ?? 32;
                for (const field of reg.fields) {
                    if (field.bitOffset + field.bitWidth > regSize) {
                        warnings.push(`Field "${field.name}" exceeds register size in "${reg.name}"`);
                    }
                }
            }
        }
    }

    // Calculate stats
    let registerCount = 0;
    let fieldCount = 0;
    for (const mm of data.memoryMaps) {
        for (const ab of mm.addressBlocks) {
            registerCount += ab.registers.length;
            for (const reg of ab.registers) {
                fieldCount += reg.fields.length;
            }
        }
    }

    return c.json({
        success: true,
        warnings,
        stats: {
            memoryMapCount: data.memoryMaps.length,
            addressBlockCount: data.memoryMaps.reduce((sum, mm) => sum + mm.addressBlocks.length, 0),
            registerCount,
            fieldCount,
        },
    });
});
