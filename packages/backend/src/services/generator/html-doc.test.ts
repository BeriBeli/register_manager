import { describe, it, expect } from "bun:test";
import type { Project } from "@register-manager/shared";
import { generateHTMLDoc } from "./html-doc";

const project: Project = {
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
                    name: "ctrl_block",
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
                                    accessPolicies: [
                                        {
                                            id: "ap-1",
                                            parentId: "field-1",
                                            access: "read-only",
                                        },
                                    ],
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

describe("generateHTMLDoc", () => {
    it("renders header metadata and register table", () => {
        const output = generateHTMLDoc(project, { includeStyles: false });

        expect(output).toContain("<h1>Test Project</h1>");
        expect(output).toContain("acme:core:uart:1.0");
        expect(output).toContain("Control Block");
        expect(output).toContain("0x00000004");
        expect(output).toContain("<h5>Fields</h5>");
        expect(output).toContain("read-only");
    });
});
