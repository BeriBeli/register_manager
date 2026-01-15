import { describe, it, expect } from "bun:test";
import {
    createProjectSchema,
    updateProjectSchema,
    createMemoryMapSchema,
    createAddressBlockSchema,
    createFieldSchema,
    exportRequestSchema,
} from "./index";

describe("shared schemas", () => {
    it("validates project creation with required VLNV", () => {
        const result = createProjectSchema.safeParse({
            name: "proj",
            vlnv: { vendor: "acme", library: "core", name: "uart", version: "1.0" },
        });
        expect(result.success).toBe(true);
    });

    it("allows partial updates for projects", () => {
        const result = updateProjectSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it("applies defaults for memory map and address block", () => {
        const memoryMap = createMemoryMapSchema.parse({ name: "map" });
        expect(memoryMap.addressUnitBits).toBe(8);

        const addressBlock = createAddressBlockSchema.parse({
            name: "block",
            baseAddress: "0x0",
            range: "0x100",
            width: 32,
        });
        expect(addressBlock.usage).toBe("register");
    });

    it("applies default access for fields", () => {
        const field = createFieldSchema.parse({
            name: "status",
            bitOffset: 0,
            bitWidth: 1,
        });
        expect(field.access).toBe("read-write");
    });

    it("rejects unknown export formats", () => {
        const result = exportRequestSchema.safeParse({ format: "pdf" });
        expect(result.success).toBe(false);
    });
});
