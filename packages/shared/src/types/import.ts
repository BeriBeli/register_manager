// Excel Import Types for Register Manager
// Defines the standard interface that all import plugins must output

import type { AccessType } from "./ipxact";

// ============================================================================
// Plugin System Types
// ============================================================================

/** Import plugin metadata */
export interface ImportPlugin {
  /** Unique plugin identifier */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin description */
  description: string;
  /** Plugin type */
  type: "wasm" | "builtin";
  /** URL to WASM file (for wasm type) */
  wasmUrl?: string;
  /** URL to JS Glue file (for dynamic mode) */
  jsUrl?: string;
  /** Supported file extensions */
  supportedExtensions: string[];
}

/** Import plugin execution result */
export interface ImportPluginResult {
  success: boolean;
  data?: ImportData;
  error?: string;
  warnings?: string[];
}

// ============================================================================
// Standard Import Data Schema
// ============================================================================

/**
 * Standard import data structure.
 * All import plugins must output data conforming to this schema.
 * This structure mirrors the IP-XACT hierarchy but without database IDs.
 */
export interface ImportData {
  /** Project metadata (maps to VLNV) */
  project: ImportProject;
  /** Memory maps containing address blocks and registers */
  memoryMaps: ImportMemoryMap[];
}

/** Project information from import */
export interface ImportProject {
  /** Project/component name (VLNV.name) */
  name: string;
  /** Vendor identifier (VLNV.vendor) */
  vendor: string;
  /** Library identifier (VLNV.library) */
  library: string;
  /** Version string (VLNV.version) */
  version: string;
  /** Optional display name */
  displayName?: string;
  /** Optional description */
  description?: string;
}

/** Memory map from import */
export interface ImportMemoryMap {
  /** Memory map name */
  name: string;
  /** Optional display name */
  displayName?: string;
  /** Optional description */
  description?: string;
  /** Address unit bits (default: 8) */
  addressUnitBits?: number;
  /** Address blocks in this memory map */
  addressBlocks: ImportAddressBlock[];
}

/** Address block from import */
export interface ImportAddressBlock {
  /** Address block name */
  name: string;
  /** Base address (hex string, e.g., "0x1000") */
  baseAddress: string;
  /** Range/size in bytes (hex string, e.g., "0x100") */
  range: string;
  /** Register width in bits (default: 32) */
  width?: number;
  /** Optional display name */
  displayName?: string;
  /** Optional description */
  description?: string;
  /** Registers in this address block */
  registers: ImportRegister[];
}

/** Register from import */
export interface ImportRegister {
  /** Register name */
  name: string;
  /** Address offset relative to address block (hex string) */
  addressOffset: string;
  /** Register size in bits (default: 32) */
  size?: number;
  /** Optional display name */
  displayName?: string;
  /** Optional description */
  description?: string;
  /** Fields in this register */
  fields: ImportField[];
}

/** Field from import */
export interface ImportField {
  /** Field name */
  name: string;
  /** Bit offset within the register */
  bitOffset: number;
  /** Field width in bits */
  bitWidth: number;
  /** Access type */
  access?: AccessType;
  /** Reset/default value (hex string) */
  resetValue?: string;
  /** Optional display name */
  displayName?: string;
  /** Optional description */
  description?: string;
}

// ============================================================================
// Import API Types
// ============================================================================

/** Request to preview import data */
export interface ImportPreviewRequest {
  /** Plugin ID to use for parsing */
  pluginId: string;
  /** File content as base64 */
  fileBase64: string;
  /** Original filename */
  filename: string;
}

/** Response from import preview */
export interface ImportPreviewResponse {
  success: boolean;
  data?: ImportData;
  error?: string;
  warnings?: string[];
  /** Statistics about the import */
  stats?: {
    memoryMapCount: number;
    addressBlockCount: number;
    registerCount: number;
    fieldCount: number;
  };
}

/** Request to execute import and create project */
export interface ImportExecuteRequest {
  /** Parsed import data (from preview) */
  data: ImportData;
}
