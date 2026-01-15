import { describe, it, expect } from "bun:test";
import { generateIpxactXml } from "./xml";

describe("generateIpxactXml", () => {
    it("includes component metadata and fields", () => {
        const output = generateIpxactXml({
            id: "project-1",
            name: "test-project",
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
                    addressUnitBits: 8,
                    shared: true,
                    addressBlocks: [
                        {
                            id: "ab-1",
                            name: "ctrl_block",
                            displayName: "Control Block",
                            description: "Block description",
                            baseAddress: "0x0",
                            range: "0x20",
                            width: 32,
                            usage: "register",
                            volatile: false,
                            registers: [
                                {
                                    id: "reg-1",
                                    name: "status",
                                    displayName: "Status",
                                    description: "Status register",
                                    addressOffset: "0x4",
                                    size: 32,
                                    volatile: false,
                                    fields: [
                                        {
                                            id: "field-1",
                                            name: "ready",
                                            displayName: "Ready",
                                            description: "Ready flag",
                                            bitOffset: 0,
                                            bitWidth: 1,
                                            volatile: false,
                                            access: "read-only",
                                            modifiedWriteValue: null,
                                            readAction: null,
                                            resets: [
                                                {
                                                    value: "0x0",
                                                    mask: null,
                                                },
                                            ],
                                            enumeratedValues: [
                                                {
                                                    name: "IDLE",
                                                    displayName: "Idle",
                                                    description: "Idle state",
                                                    value: "0",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        expect(output).toContain("<ipxact:component");
        expect(output).toContain("<ipxact:vendor>acme</ipxact:vendor>");
        expect(output).toContain("<ipxact:field>");
        expect(output).toContain("<ipxact:enumeratedValue>");
    });
});
