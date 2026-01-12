#!/usr/bin/env bun

// Test script to verify API endpoints
const API_BASE = "http://localhost:3000/api";

async function testAPI() {
  console.log("🧪 Testing Register Manager API\n");

  try {
    // Test 1: Health check
    console.log("1️⃣ Testing health endpoint...");
    const healthRes = await fetch(`${API_BASE.replace('/api', '')}/health`);
    const health = await healthRes.json();
    console.log("✅ Health:", health);

    // Test 2: List projects (should be empty initially)
    console.log("\n2️⃣ Listing projects...");
    const listRes = await fetch(`${API_BASE}/projects`);
    const { data: projects } = await listRes.json();
    console.log(`✅ Found ${projects.length} projects`);
    projects.forEach((p: any) => console.log(`   - ${p.name} (${p.id})`));

    // Test 3: Create a test project
    console.log("\n3️⃣ Creating test project...");
    const createRes = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "test_project",
        displayName: "Test Project",
        description: "A test project created by API test script",
        vlnv: {
          vendor: "test",
          library: "test",
          name: "test_project",
          version: "1.0",
        },
      }),
    });
    const { data: newProject } = await createRes.json();
    console.log("✅ Created project:", newProject.name, `(ID: ${newProject.id})`);

    // Test 4: List projects again
    console.log("\n4️⃣ Listing projects again...");
    const listRes2 = await fetch(`${API_BASE}/projects`);
    const { data: projects2 } = await listRes2.json();
    console.log(`✅ Found ${projects2.length} projects`);
    projects2.forEach((p: any) => console.log(`   - ${p.name} (${p.id})`));

    // Test 5: Get single project
    console.log("\n5️⃣ Getting project details...");
    const getRes = await fetch(`${API_BASE}/projects/${newProject.id}`);
    const { data: project } = await getRes.json();
    console.log("✅ Project details:", {
      name: project.name,
      vlnv: `${project.vlnv.vendor}:${project.vlnv.library}:${project.vlnv.name}:${project.vlnv.version}`,
      memoryMaps: project.memoryMaps?.length || 0,
      addressBlocks: project.memoryMaps?.[0]?.addressBlocks?.length || 0,
    });

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testAPI();
