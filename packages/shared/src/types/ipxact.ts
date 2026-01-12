// IP-XACT Data Types for Register Manager
// Based on IEEE 1685-2022 Standard

// ============================================================================
// Basic Types
// ============================================================================

/** VLNV Identifier (Vendor, Library, Name, Version) */
export interface VLNV {
  vendor: string;
  library: string;
  name: string;
  version: string;
}

/** Access Type for registers and fields */
export type AccessType =
  | "read-write"
  | "read-only"
  | "write-only"
  | "read-writeOnce"
  | "writeOnce";

/** Modified Write Value behavior */
export type ModifiedWriteValue =
  | "oneToClear"
  | "oneToSet"
  | "oneToToggle"
  | "zeroToClear"
  | "zeroToSet"
  | "zeroToToggle"
  | "clear"
  | "set"
  | "modify";

/** Read Action behavior */
export type ReadAction = "clear" | "set" | "modify";

/** Address Block Usage */
export type AddressBlockUsage = "register" | "memory" | "reserved";

// ============================================================================
// Core Entities
// ============================================================================

/** Base entity with common properties */
export interface BaseEntity {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
}

/** Project - Top level container */
export interface Project extends BaseEntity {
  vlnv: VLNV;
  memoryMaps: MemoryMap[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

/** Memory Map */
export interface MemoryMap extends BaseEntity {
  projectId: string;
  addressUnitBits: number;
  shared?: boolean;
  addressBlocks: AddressBlock[];
}

/** Address Block */
export interface AddressBlock extends BaseEntity {
  memoryMapId: string;
  baseAddress: string;
  range: string;
  width: number;
  usage: AddressBlockUsage;
  volatile?: boolean;
  typeIdentifier?: string;
  registers: Register[];
  registerFiles: RegisterFile[];
  accessPolicies: AccessPolicy[];
}

/** Register File - Container for registers */
export interface RegisterFile extends BaseEntity {
  parentId: string; // AddressBlock or RegisterFile ID
  parentType: "addressBlock" | "registerFile";
  addressOffset: string;
  range: string;
  typeIdentifier?: string;
  registers: Register[];
  registerFiles: RegisterFile[]; // Nested register files
  accessPolicies: AccessPolicy[];
}

/** Register */
export interface Register extends BaseEntity {
  parentId: string; // AddressBlock or RegisterFile ID
  parentType: "addressBlock" | "registerFile";
  addressOffset: string;
  size: number;
  volatile?: boolean;
  typeIdentifier?: string;
  fields: Field[];
  alternateRegisters: AlternateRegister[];
  accessPolicies: AccessPolicy[];
}

/** Alternate Register - Mode-specific register view */
export interface AlternateRegister extends BaseEntity {
  registerId: string;
  modeRefs: string[];
  typeIdentifier?: string;
  volatile?: boolean;
  fields: Field[];
  accessPolicies: AccessPolicy[];
}

/** Field - Bit field within a register */
export interface Field extends BaseEntity {
  registerId: string;
  registerType: "register" | "alternateRegister";
  bitOffset: number;
  bitWidth: number;
  volatile?: boolean;
  typeIdentifier?: string;
  resets: ResetValue[];
  enumeratedValues?: EnumeratedValues;
  accessPolicies: FieldAccessPolicy[];
}

/** Reset Value */
export interface ResetValue {
  id: string;
  fieldId: string;
  resetTypeRef?: string;
  value: string;
  mask?: string;
}

/** Enumerated Values container */
export interface EnumeratedValues {
  id: string;
  fieldId: string;
  usage?: "read" | "write" | "read-write";
  values: EnumeratedValue[];
}

/** Single Enumerated Value */
export interface EnumeratedValue {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  value: string;
}

// ============================================================================
// Access Policies
// ============================================================================

/** Access Policy for registers and address blocks */
export interface AccessPolicy {
  id: string;
  parentId: string;
  modeRefs?: string[];
  access: AccessType;
}

/** Field Access Policy with additional behaviors */
export interface FieldAccessPolicy extends AccessPolicy {
  modifiedWriteValue?: ModifiedWriteValue;
  readAction?: ReadAction;
  testable?: boolean;
  reserved?: string;
}

// ============================================================================
// User & Auth
// ============================================================================

/** User account */
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// API Types
// ============================================================================

/** Pagination parameters */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** API Error response */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Export format options */
export type ExportFormat = "ipxact" | "c-header" | "uvm-ral" | "html";

/** Export request */
export interface ExportRequest {
  projectId: string;
  format: ExportFormat;
  options?: Record<string, unknown>;
}
