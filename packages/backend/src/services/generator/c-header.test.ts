import { describe, it, expect } from "bun:test";
import type { Project } from "@register-manager/shared";
import { generateCHeader } from "./c-header";

const baseProject: Project = {
    id: "project-1",
    name: "Test Project",
    displayName: "Test Project",
    description: "Project description",
    vlnv: {
        vendor: "acme",
        library: "core",
        name: "uart",
        version: "1.0",
    },
    memoryMaps: [
        {
            id: "mm-1",
            name: "main_map",
            displayName: "Main Map",
            description: "Map description",
            projectId: "project-1",
            addressUnitBits: 8,
            shared: false,
            addressBlocks: [
                {
                    id: "ab-1",
                    name: "ctrl block",
                    displayName: "Control Block",
                    description: "Block description",
                    memoryMapId: "mm-1",
                    baseAddress: "0x0",
                    range: "0x20",
                    width: 32,
                    usage: "register",
                    registers: [
                        {
                            id: "reg-1",
                            name: "status",
                            displayName: "Status",
                            description: "Status register",
                            parentId: "ab-1",
                            parentType: "addressBlock",
                            addressOffset: "0x4",
                            size: 32,
                            fields: [
                                {
                                    id: "field-1",
                                    name: "ready",
                                    displayName: "Ready",
                                    description: "Ready flag",
                                    registerId: "reg-1",
                                    registerType: "register",
                                    bitOffset: 0,
                                    bitWidth: 1,
                                    resets: [],
                                    accessPolicies: [],
                                },
                            ],
                            alternateRegisters: [],
                            accessPolicies: [],
                        },
                    ],
                    registerFiles: [],
                    accessPolicies: [],
                },
            ],
        },
    ],
    createdAt: new Date(0),
    updatedAt: new Date(0),
    userId: "user-1",
};

describe("generateCHeader", () => {
    it("creates guards and register macros", () => {
        const output = generateCHeader(baseProject, { includeComments: false });

        expect(output).toContain("#ifndef TEST_PROJECT_H");
        expect(output).toContain("#define CTRL_BLOCK_BASE_ADDR 0x00000000U");
        expect(output).toContain("#define CTRL_BLOCK_STATUS_OFFSET 0x0004U");
        expect(output).toContain("#define CTRL_BLOCK_STATUS_READY_MASK");
        expect(output).toContain("typedef struct {");
        expect(output).toContain("#define CTRL_BLOCK_REGS");
    });
});
