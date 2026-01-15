import { parseStringPromise } from "xml2js";
import { readFileSync, existsSync } from "fs";
import { db } from "./index";
import { projects, memoryMaps, addressBlocks, registers, fields, resets, user } from "./schema";

interface IpxactField {
  "ipxact:name": string[];
  "ipxact:description"?: string[];
  "ipxact:bitOffset": string[];
  "ipxact:bitWidth": string[];
  "ipxact:access"?: string[];
  "ipxact:modifiedWriteValue"?: string[];
  "ipxact:readAction"?: string[];
  "ipxact:resets"?: Array<{
    "ipxact:reset": Array<{
      "ipxact:value": string[];
      "ipxact:resetTypeRef"?: string[];
    }>;
  }>;
}

interface IpxactRegister {
  "ipxact:name": string[];
  "ipxact:addressOffset": string[];
  "ipxact:size": string[];
  "ipxact:description"?: string[];
  "ipxact:volatile"?: string[];
  "ipxact:field": IpxactField[];
}

interface IpxactAddressBlock {
  "ipxact:name": string[];
  "ipxact:baseAddress": string[];
  "ipxact:range": string[];
  "ipxact:width": string[];
  "ipxact:description"?: string[];
  "ipxact:usage"?: string[];
  "ipxact:volatile"?: string[];
  "ipxact:register": IpxactRegister[];
}

interface IpxactMemoryMap {
  "ipxact:name": string[];
  "ipxact:displayName"?: string[];
  "ipxact:description"?: string[];
  "ipxact:addressUnitBits"?: string[];
  "ipxact:addressBlock": IpxactAddressBlock[];
}

interface IpxactComponent {
  "ipxact:component": {
    "ipxact:vendor": string[];
    "ipxact:library": string[];
    "ipxact:name": string[];
    "ipxact:version": string[];
    "ipxact:memoryMaps": Array<{
      "ipxact:memoryMap": IpxactMemoryMap[];
    }>;
  };
}

async function importIpxactXml(xmlFilePath: string) {
  console.log(`📥 Importing IP-XACT file: ${xmlFilePath}`);

  // Read and parse XML file
  const xmlContent = readFileSync(xmlFilePath, "utf-8");
  const parsed = (await parseStringPromise(xmlContent)) as IpxactComponent;

  const component = parsed["ipxact:component"];

  // Extract VLNV
  const vlnv = {
    vendor: component["ipxact:vendor"][0],
    library: component["ipxact:library"][0],
    name: component["ipxact:name"][0],
    version: component["ipxact:version"][0],
  };

  console.log(`📦 Component VLNV: ${vlnv.vendor}:${vlnv.library}:${vlnv.name}:${vlnv.version}`);

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("❌ ADMIN_EMAIL environment variable is required.");
    console.error("   Set ADMIN_EMAIL to specify the user who will own the imported project.");
    process.exit(1);
  }

  // Get admin user for import
  const existingUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, adminEmail),
  });

  if (!existingUser) {
    console.error(`❌ User '${adminEmail}' not found in database.`);
    console.error("   Ensure this user account exists before running the import.");
    process.exit(1);
  }

  console.log(`👤 Using user: ${existingUser.name} (${existingUser.email})`);

  // Create project
  console.log("📁 Creating project...");
  const [project] = await db
    .insert(projects)
    .values({
      userId: existingUser.id,
      name: vlnv.name,
      displayName: `${vlnv.vendor} - ${vlnv.name}`,
      description: `Imported from IP-XACT: ${vlnv.vendor}:${vlnv.library}:${vlnv.name}:${vlnv.version}`,
      vlnv,
    })
    .returning();

  console.log(`✅ Project created: ${project.name} (${project.id})`);

  // Process memory maps
  const memoryMapsList = component["ipxact:memoryMaps"];
  if (!memoryMapsList || memoryMapsList.length === 0) {
    console.log("⚠️  No memory maps found in IP-XACT file");
    return project;
  }

  for (const memoryMapContainer of memoryMapsList) {
    const memoryMapArray = memoryMapContainer["ipxact:memoryMap"];

    for (const memoryMapData of memoryMapArray) {
      const memoryMapName = memoryMapData["ipxact:name"][0];
      console.log(`  🗺️  Processing memory map: ${memoryMapName}`);

      const [memoryMap] = await db
        .insert(memoryMaps)
        .values({
          projectId: project.id,
          name: memoryMapName,
          displayName: memoryMapData["ipxact:displayName"]?.[0] || memoryMapName,
          description: memoryMapData["ipxact:description"]?.[0],
          addressUnitBits: memoryMapData["ipxact:addressUnitBits"]
            ? parseInt(memoryMapData["ipxact:addressUnitBits"][0])
            : 8,
        })
        .returning();

      // Process address blocks
      const addressBlockArray = memoryMapData["ipxact:addressBlock"];
      if (!addressBlockArray) {
        console.log("    ⚠️  No address blocks found");
        continue;
      }

      for (const addressBlockData of addressBlockArray) {
        const addressBlockName = addressBlockData["ipxact:name"][0];
        console.log(`    📦 Processing address block: ${addressBlockName}`);

        const [addressBlock] = await db
          .insert(addressBlocks)
          .values({
            memoryMapId: memoryMap.id,
            name: addressBlockName,
            displayName: addressBlockName,
            description: addressBlockData["ipxact:description"]?.[0],
            baseAddress: addressBlockData["ipxact:baseAddress"][0],
            range: addressBlockData["ipxact:range"][0],
            width: parseInt(addressBlockData["ipxact:width"][0]),
            usage: addressBlockData["ipxact:usage"]?.[0] || "register",
            volatile: addressBlockData["ipxact:volatile"]?.[0] === "true",
          })
          .returning();

        // Process registers
        const registerArray = addressBlockData["ipxact:register"];
        if (!registerArray) {
          console.log("      ⚠️  No registers found");
          continue;
        }

        for (const registerData of registerArray) {
          const registerName = registerData["ipxact:name"][0];
          console.log(`      📝 Processing register: ${registerName}`);

          const [register] = await db
            .insert(registers)
            .values({
              parentId: addressBlock.id,
              parentType: "addressBlock",
              name: registerName,
              displayName: registerName,
              description: registerData["ipxact:description"]?.[0],
              addressOffset: registerData["ipxact:addressOffset"][0],
              size: parseInt(registerData["ipxact:size"][0]),
              volatile: registerData["ipxact:volatile"]?.[0] === "true",
            })
            .returning();

          // Process fields
          const fieldArray = registerData["ipxact:field"];
          if (!fieldArray) {
            console.log("        ⚠️  No fields found");
            continue;
          }

          for (const fieldData of fieldArray) {
            const fieldName = fieldData["ipxact:name"][0];
            console.log(`        🔧 Processing field: ${fieldName}`);

            const [field] = await db
              .insert(fields)
              .values({
                registerId: register.id,
                name: fieldName,
                displayName: fieldName,
                description: fieldData["ipxact:description"]?.[0] || "No Description",
                bitOffset: parseInt(fieldData["ipxact:bitOffset"][0]),
                bitWidth: parseInt(fieldData["ipxact:bitWidth"][0]),
                access: fieldData["ipxact:access"]?.[0] || "read-write",
                modifiedWriteValue: fieldData["ipxact:modifiedWriteValue"]?.[0],
                readAction: fieldData["ipxact:readAction"]?.[0],
              })
              .returning();

            // Process reset values
            const resetArray = fieldData["ipxact:resets"];
            if (resetArray && resetArray.length > 0) {
              for (const resetContainer of resetArray) {
                const resetDataArray = resetContainer["ipxact:reset"];
                for (const resetData of resetDataArray) {
                  const resetValue = resetData["ipxact:value"][0];
                  await db.insert(resets).values({
                    fieldId: field.id,
                    value: resetValue,
                    resetTypeRef: resetData["ipxact:resetTypeRef"]?.[0] || "HARD",
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  console.log("✅ Import completed successfully!");
  return project;
}

// Main execution
import { resolve, dirname, isAbsolute } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default to example.xml in project root (4 levels up from src/db)
// Resolve the path
let xmlFilePath = process.argv[2];
const projectRoot = resolve(__dirname, "../../../../");

if (!xmlFilePath) {
  xmlFilePath = resolve(projectRoot, "example.xml");
} else {
  // If the path is relative and doesn't exist relative to CWD, try relative to project root
  if (!isAbsolute(xmlFilePath) && !existsSync(xmlFilePath)) {
    const potentialPath = resolve(projectRoot, xmlFilePath);
    if (existsSync(potentialPath)) {
      xmlFilePath = potentialPath;
    } else {
      // Fallback to resolve from CWD if it still doesn't exist, will fail later with better error
      xmlFilePath = resolve(process.cwd(), xmlFilePath);
    }
  } else {
    xmlFilePath = resolve(process.cwd(), xmlFilePath);
  }
}


importIpxactXml(xmlFilePath)
  .then((project) => {
    console.log(`\n🎉 Successfully imported project: ${project.name} (ID: ${project.id})`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });
