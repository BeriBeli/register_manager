import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { registers, fields, resets, enumeratedValues } from "../db/schema";
import {
  createRegisterSchema,
  updateRegisterSchema,
  createFieldSchema,
  updateFieldSchema,
  createResetValueSchema,
} from "@register-manager/shared";
import { auth } from "../lib/auth";
import {
  verifyProjectAccessByAddressBlock,
  verifyProjectAccessByRegister,
  getProjectIdFromRegister,
  hasProjectAccess,
} from "../lib/access";
import { DEFAULT_RESET_TYPE_REF } from "../constants";

// Define variables type for authenticated routes
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const registerRoutes = new Hono<{ Variables: Variables }>();

// Auth middleware - require authentication
registerRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

// ============================================================================
// Registers CRUD
// ============================================================================

// Get all registers for an address block
registerRoutes.get("/address-block/:abId", async (c) => {
  const abId = c.req.param("abId");
  const user = c.get("user")!;

  // Verify access to the address block's project
  const { hasAccess } = await verifyProjectAccessByAddressBlock(abId, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const result = await db.query.registers.findMany({
    where: eq(registers.parentId, abId),
    with: {
      fields: {
        with: {
          resets: true,
          enumeratedValues: true,
        },
      },
    },
    orderBy: (_registers: any, { asc }: any) => [asc(_registers.addressOffset)],
  });

  return c.json({ data: result });
});

// Get single register with fields
registerRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Verify access
  const { hasAccess } = await verifyProjectAccessByRegister(id, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const register = await db.query.registers.findFirst({
    where: eq(registers.id, id),
    with: {
      fields: {
        with: {
          resets: true,
          enumeratedValues: true,
        },
      },
    },
  });

  if (!register) {
    return c.json({ error: "Register not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ data: register });
});

// Create register
registerRoutes.post(
  "/address-block/:abId",
  zValidator("json", createRegisterSchema),
  async (c) => {
    const abId = c.req.param("abId");
    const data = c.req.valid("json");
    const user = c.get("user")!;

    // Verify access
    const { hasAccess } = await verifyProjectAccessByAddressBlock(abId, user.id, user.role);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    const [newRegister] = await db
      .insert(registers)
      .values({
        ...data,
        parentId: abId,
        parentType: "addressBlock",
      })
      .returning();

    return c.json({ data: newRegister }, 201);
  }
);

// Update register
registerRoutes.put(
  "/:id",
  zValidator("json", updateRegisterSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user")!;

    // Verify access
    const { hasAccess } = await verifyProjectAccessByRegister(id, user.id, user.role);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    const [updated] = await db
      .update(registers)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(registers.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Register not found", code: "NOT_FOUND" }, 404);
    }

    return c.json({ data: updated });
  }
);

// Delete register
registerRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Verify access
  const { hasAccess } = await verifyProjectAccessByRegister(id, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const [deleted] = await db
    .delete(registers)
    .where(eq(registers.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Register not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});

// ============================================================================
// Fields CRUD
// ============================================================================

// Get all fields for a register
registerRoutes.get("/:regId/fields", async (c) => {
  const regId = c.req.param("regId");
  const user = c.get("user")!;

  // Verify access
  const { hasAccess } = await verifyProjectAccessByRegister(regId, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const result = await db.query.fields.findMany({
    where: eq(fields.registerId, regId),
    with: {
      resets: true,
      enumeratedValues: true,
    },
    orderBy: (_fields: any, { asc }: any) => [asc(_fields.bitOffset)],
  });

  return c.json({ data: result });
});

// Create field
registerRoutes.post(
  "/:regId/fields",
  zValidator("json", createFieldSchema),
  async (c) => {
    const regId = c.req.param("regId");
    const data = c.req.valid("json");
    const user = c.get("user")!;

    // Verify access
    const { hasAccess } = await verifyProjectAccessByRegister(regId, user.id, user.role);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // Extract resetValue from data as it's not in fields table
    // @ts-ignore - resetValue exists in schema but not in fields table definition inference
    const { resetValue, ...fieldData } = data;

    const [newField] = await db
      .insert(fields)
      .values({
        ...fieldData,
        registerId: regId,
      })
      .returning();

    if (resetValue) {
      await db.insert(resets).values({
        fieldId: newField.id,
        value: resetValue,
        resetTypeRef: DEFAULT_RESET_TYPE_REF,
      });
    }

    return c.json({ data: newField }, 201);
  }
);

// Update field
registerRoutes.put(
  "/fields/:id",
  zValidator("json", updateFieldSchema),
  async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const user = c.get("user")!;

    // Get the field to find its register, then verify access
    const field = await db.query.fields.findFirst({
      where: eq(fields.id, id),
      columns: { registerId: true },
    });
    if (!field) {
      return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
    }

    const { hasAccess } = await verifyProjectAccessByRegister(field.registerId, user.id, user.role);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    // Extract resetValue
    // @ts-ignore
    const { resetValue, ...fieldData } = data;

    const [updated] = await db
      .update(fields)
      .set({
        ...fieldData,
        updatedAt: new Date(),
      })
      .where(eq(fields.id, id))
      .returning();

    if (resetValue !== undefined) {
      // Find existing reset (assume default/first one)
      const existingReset = await db.query.resets.findFirst({
        where: eq(resets.fieldId, id),
      });

      if (existingReset) {
        if (resetValue === "") {
          // Empty string -> delete
          await db.delete(resets).where(eq(resets.id, existingReset.id));
        } else {
          // Update
          await db.update(resets)
            .set({ value: resetValue })
            .where(eq(resets.id, existingReset.id));
        }
      } else if (resetValue !== "") {
        // Create new
        await db.insert(resets).values({
          fieldId: id,
          value: resetValue,
          resetTypeRef: DEFAULT_RESET_TYPE_REF,
        });
      }
    }

    if (!updated) {
      return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
    }

    return c.json({ data: updated });
  }
);

// Delete field
registerRoutes.delete("/fields/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Get the field to find its register, then verify access
  const field = await db.query.fields.findFirst({
    where: eq(fields.id, id),
    columns: { registerId: true },
  });
  if (!field) {
    return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
  }

  const { hasAccess } = await verifyProjectAccessByRegister(field.registerId, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const [deleted] = await db
    .delete(fields)
    .where(eq(fields.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});

// ============================================================================
// Reset Values
// ============================================================================

registerRoutes.post(
  "/fields/:fieldId/resets",
  zValidator("json", createResetValueSchema),
  async (c) => {
    const fieldId = c.req.param("fieldId");
    const data = c.req.valid("json");
    const user = c.get("user")!;

    // Get the field to find its register, then verify access
    const field = await db.query.fields.findFirst({
      where: eq(fields.id, fieldId),
      columns: { registerId: true },
    });
    if (!field) {
      return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
    }

    const { hasAccess } = await verifyProjectAccessByRegister(field.registerId, user.id, user.role);
    if (!hasAccess) {
      return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
    }

    const [newReset] = await db
      .insert(resets)
      .values({
        ...data,
        fieldId,
      })
      .returning();

    return c.json({ data: newReset }, 201);
  }
);

registerRoutes.delete("/resets/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user")!;

  // Get the reset to find its field -> register, then verify access
  const reset = await db.query.resets.findFirst({
    where: eq(resets.id, id),
    columns: { fieldId: true },
  });
  if (!reset) {
    return c.json({ error: "Reset not found", code: "NOT_FOUND" }, 404);
  }

  const field = await db.query.fields.findFirst({
    where: eq(fields.id, reset.fieldId),
    columns: { registerId: true },
  });
  if (!field) {
    return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
  }

  const { hasAccess } = await verifyProjectAccessByRegister(field.registerId, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }

  const [deleted] = await db
    .delete(resets)
    .where(eq(resets.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Reset not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});
