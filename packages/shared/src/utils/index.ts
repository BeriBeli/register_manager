import type { VLNV, Field, AccessType } from "../types";

/**
 * Format VLNV as string (vendor:library:name:version)
 */
export function formatVLNV(vlnv: VLNV): string {
  return `${vlnv.vendor}:${vlnv.library}:${vlnv.name}:${vlnv.version}`;
}

/**
 * Parse VLNV string to object
 */
export function parseVLNV(vlnvString: string): VLNV | null {
  const parts = vlnvString.split(":");
  if (parts.length !== 4) return null;

  const [vendor, library, name, version] = parts;
  if (!vendor || !library || !name || !version) return null;

  return { vendor, library, name, version };
}

/**
 * Get field access type from access policies
 */
export function getFieldAccess(field: Field): AccessType {
  // Support direct access property (from simplified backend schema)
  if ("access" in field && (field as any).access) {
    return (field as any).access as AccessType;
  }

  if (field.accessPolicies && field.accessPolicies.length > 0) {
    return field.accessPolicies[0].access;
  }
  return "read-write"; // Default
}

/**
 * Parse hex/decimal string to number
 */
export function parseNumber(value: string): number {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.startsWith("0x")) {
    return parseInt(trimmed, 16);
  }
  if (trimmed.startsWith("0b")) {
    return parseInt(trimmed.slice(2), 2);
  }
  if (trimmed.startsWith("0o")) {
    return parseInt(trimmed.slice(2), 8);
  }

  return parseInt(trimmed, 10);
}

/**
 * Format number as hex string
 */
export function toHex(value: number, minWidth = 0): string {
  const hex = value.toString(16).toUpperCase();
  return "0x" + hex.padStart(minWidth, "0");
}

/**
 * Generate bit mask for field
 */
export function generateBitMask(bitOffset: number, bitWidth: number): bigint {
  const mask = (1n << BigInt(bitWidth)) - 1n;
  return mask << BigInt(bitOffset);
}

/**
 * Format bit mask as hex string
 */
export function formatBitMask(bitOffset: number, bitWidth: number, totalBits = 32): string {
  const mask = generateBitMask(bitOffset, bitWidth);
  const hex = mask.toString(16).toUpperCase();
  const hexWidth = Math.ceil(totalBits / 4);
  return "0x" + hex.padStart(hexWidth, "0");
}

/**
 * Check if two bit ranges overlap
 */
export function bitRangesOverlap(
  offset1: number,
  width1: number,
  offset2: number,
  width2: number
): boolean {
  const end1 = offset1 + width1;
  const end2 = offset2 + width2;
  return offset1 < end2 && offset2 < end1;
}

/**
 * Validate field fits within register size
 */
export function fieldFitsInRegister(
  bitOffset: number,
  bitWidth: number,
  registerSize: number
): boolean {
  return bitOffset >= 0 && bitWidth > 0 && bitOffset + bitWidth <= registerSize;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Sanitize name for code generation (C identifiers)
 */
export function sanitizeIdentifier(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .toUpperCase();
}

/**
 * Convert camelCase to SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase();
}
