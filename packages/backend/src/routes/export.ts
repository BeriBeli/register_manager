import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { projects } from "../db/schema";
import { exportRequestSchema } from "@register-manager/shared";
import { generateIpxactXml } from "../services/generator/xml";

export const exportRoutes = new Hono();

// Export project in specified format
exportRoutes.post("/:projectId", zValidator("json", exportRequestSchema), async (c) => {
  const projectId = c.req.param("projectId");
  const { format, options } = c.req.valid("json");

  // Fetch complete project data
  const project = await db.query.projects.findFirst({
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

  if (!project) {
    return c.json({ error: "Project not found", code: "NOT_FOUND" }, 404);
  }

  let content: string;
  let contentType: string;
  let filename: string;

  switch (format) {
    case "ipxact":
      content = generateIpxactXml(project);
      contentType = "application/xml";
      filename = `${project.name}.xml`;
      break;

    case "c-header":
      // TODO: Implement C header generator
      return c.json({ error: "C header export not implemented yet", code: "NOT_IMPLEMENTED" }, 501);

    case "uvm-ral":
      // TODO: Implement UVM RAL generator
      return c.json({ error: "UVM RAL export not implemented yet", code: "NOT_IMPLEMENTED" }, 501);

    case "html":
      // TODO: Implement HTML doc generator
      return c.json({ error: "HTML export not implemented yet", code: "NOT_IMPLEMENTED" }, 501);

    default:
      return c.json({ error: "Invalid export format", code: "INVALID_FORMAT" }, 400);
  }

  // Return file download
  c.header("Content-Type", contentType);
  c.header("Content-Disposition", `attachment; filename="${filename}"`);

  return c.body(content);
});

// Get available export formats
exportRoutes.get("/formats", (c) => {
  return c.json({
    data: [
      { id: "ipxact", name: "IP-XACT XML", status: "available" },
      { id: "c-header", name: "C Header File", status: "coming-soon" },
      { id: "uvm-ral", name: "UVM RAL", status: "coming-soon" },
      { id: "html", name: "HTML Documentation", status: "coming-soon" },
    ],
  });
});
