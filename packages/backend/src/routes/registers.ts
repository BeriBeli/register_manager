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

export const registerRoutes = new Hono();

// ============================================================================
// Registers CRUD
// ============================================================================

// Get all registers for an address block
registerRoutes.get("/address-block/:abId", async (c) => {
  const abId = c.req.param("abId");

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
    orderBy: (registers, { asc }) => [asc(registers.addressOffset)],
  });

  return c.json({ data: result });
});

// Get single register with fields
registerRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");

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

  const result = await db.query.fields.findMany({
    where: eq(fields.registerId, regId),
    with: {
      resets: true,
      enumeratedValues: true,
    },
    orderBy: (fields, { asc }) => [asc(fields.bitOffset)],
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

    const [newField] = await db
      .insert(fields)
      .values({
        ...data,
        registerId: regId,
      })
      .returning();

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

    const [updated] = await db
      .update(fields)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(fields.id, id))
      .returning();

    if (!updated) {
      return c.json({ error: "Field not found", code: "NOT_FOUND" }, 404);
    }

    return c.json({ data: updated });
  }
);

// Delete field
registerRoutes.delete("/fields/:id", async (c) => {
  const id = c.req.param("id");

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

  const [deleted] = await db
    .delete(resets)
    .where(eq(resets.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Reset not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});
