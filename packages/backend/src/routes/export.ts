import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { projects } from "../db/schema";
import { exportRequestSchema } from "@register-manager/shared";
import { generateIpxactXml } from "../services/generator/xml";
import { generateCHeader } from "../services/generator/c-header";
import { generateUVMRAL } from "../services/generator/uvm-ral";
import { generateHTMLDoc } from "../services/generator/html-doc";

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
      content = generateCHeader(project as any, options);
      contentType = "text/plain";
      filename = `${project.name}.h`;
      break;

    case "uvm-ral":
      content = generateUVMRAL(project as any, options);
      contentType = "text/plain";
      filename = `${project.name}_ral_pkg.sv`;
      break;

    case "html":
      content = generateHTMLDoc(project as any, options);
      contentType = "text/html";
      filename = `${project.name}.html`;
      break;

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
      { id: "c-header", name: "C Header File", status: "available" },
      { id: "uvm-ral", name: "UVM RAL", status: "available" },
      { id: "html", name: "HTML Documentation", status: "available" },
    ],
  });
});
