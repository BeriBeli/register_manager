import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { addressBlocks } from "../db/schema";
import { updateAddressBlockSchema } from "@register-manager/shared";
import { auth } from "../lib/auth";
import { verifyProjectAccessByAddressBlock } from "../lib/access";

// Define variables type for authenticated routes
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const addressBlockRoutes = new Hono<{ Variables: Variables }>();

// Auth middleware - require authentication
addressBlockRoutes.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }
  await next();
});

// Update Address Block
addressBlockRoutes.put("/:id", zValidator("json", updateAddressBlockSchema), async (c) => {
  const id = c.req.param("id");
  const data = c.req.valid("json");
  const user = c.get("user")!;

  // Verify access to the address block's project
  const { hasAccess } = await verifyProjectAccessByAddressBlock(id, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }


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
  const user = c.get("user")!;

  // Verify access to the address block's project
  const { hasAccess } = await verifyProjectAccessByAddressBlock(id, user.id, user.role);
  if (!hasAccess) {
    return c.json({ error: "Access denied", code: "FORBIDDEN" }, 403);
  }


  const [deleted] = await db
    .delete(addressBlocks)
    .where(eq(addressBlocks.id, id))
    .returning();

  if (!deleted) {
    return c.json({ error: "Address block not found", code: "NOT_FOUND" }, 404);
  }

  return c.json({ success: true });
});
