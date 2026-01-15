import { describe, it, expect } from "bun:test";
import {
    formatVLNV,
    parseVLNV,
    getFieldAccess,
    parseNumber,
    toHex,
    generateBitMask,
    formatBitMask,
    bitRangesOverlap,
    fieldFitsInRegister,
    sanitizeIdentifier,
    toScreamingSnakeCase,
} from "./index";
import type { Field } from "../types";

describe("shared utils", () => {
    it("formats and parses VLNV strings", () => {
        const vlnv = { vendor: "acme", library: "core", name: "uart", version: "1.0" };
        const formatted = formatVLNV(vlnv);
        expect(formatted).toBe("acme:core:uart:1.0");
        expect(parseVLNV(formatted)).toEqual(vlnv);
        expect(parseVLNV("missing:parts")).toBeNull();
        expect(parseVLNV("a:b:c:")).toBeNull();
    });

    it("chooses field access from direct access or policies", () => {
        const directAccess = {
            access: "read-only",
        } as unknown as Field;
        expect(getFieldAccess(directAccess)).toBe("read-only");

        const withPolicy = {
            accessPolicies: [{ access: "write-only" }],
        } as unknown as Field;
        expect(getFieldAccess(withPolicy)).toBe("write-only");

        const fallback = { accessPolicies: [] } as unknown as Field;
        expect(getFieldAccess(fallback)).toBe("read-write");
    });

    it("parses numbers with multiple radices", () => {
        expect(parseNumber("0x10")).toBe(16);
        expect(parseNumber("0b1010")).toBe(10);
        expect(parseNumber("0o17")).toBe(15);
        expect(parseNumber("42")).toBe(42);
    });

    it("formats hex values with padding", () => {
        expect(toHex(255)).toBe("0xFF");
        expect(toHex(255, 4)).toBe("0x00FF");
    });

    it("generates and formats bit masks", () => {
        expect(generateBitMask(1, 3)).toBe(0b1110n);
        expect(formatBitMask(4, 4, 16)).toBe("0x00F0");
    });

    it("checks overlaps and register fitting", () => {
        expect(bitRangesOverlap(0, 4, 4, 4)).toBe(false);
        expect(bitRangesOverlap(0, 4, 3, 2)).toBe(true);
        expect(fieldFitsInRegister(0, 8, 8)).toBe(true);
        expect(fieldFitsInRegister(7, 2, 8)).toBe(false);
    });

    it("sanitizes identifiers and converts to screaming snake case", () => {
        expect(sanitizeIdentifier("1name*with spaces")).toBe("_1NAME_WITH_SPACES");
        expect(toScreamingSnakeCase("camelCase-name")).toBe("CAMEL_CASE_NAME");
    });
});
