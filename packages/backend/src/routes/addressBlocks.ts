import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { addressBlocks } from "../db/schema";
import { updateAddressBlockSchema } from "@register-manager/shared";

export const addressBlockRoutes = new Hono();

// Update Address Block
addressBlockRoutes.put("/:id", zValidator("json", updateAddressBlockSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");

  console.log(`Updating address block ${id}`, data);

  const [updated] = await db
    .update(addressBlocks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(addressBlocks.id, id))
    .returning();

  if (!updated) {
    return c.json({ error: "Address block not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ data: updated });
});

// Delete Address Block
addressBlockRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  console.log(`Deleting address block ${id}`);

  const [deleted] = await db
    .delete(addressBlocks)
    .where(eq(addressBlocks.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Address block not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});
