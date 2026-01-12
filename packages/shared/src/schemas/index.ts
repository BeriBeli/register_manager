import { z } from "zod";

// ============================================================================
// Basic Schemas
// ============================================================================

export const vlnvSchema = z.object({
  vendor: z.string().min(1),
  library: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
});

export const accessTypeSchema = z.enum([
  "read-write",
  "read-only",
  "write-only",
  "read-writeOnce",
  "writeOnce",
]);

export const modifiedWriteValueSchema = z.enum([
  "oneToClear",
  "oneToSet",
  "oneToToggle",
  "zeroToClear",
  "zeroToSet",
  "zeroToToggle",
  "clear",
  "set",
  "modify",
]);

export const readActionSchema = z.enum(["clear", "set", "modify"]);

export const addressBlockUsageSchema = z.enum(["register", "memory", "reserved"]);

export const exportFormatSchema = z.enum(["ipxact", "c-header", "uvm-ral", "html"]);

// ============================================================================
// Entity Schemas
// ============================================================================

export const baseEntitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  vlnv: vlnvSchema,
});

export const updateProjectSchema = createProjectSchema.partial();

export const createMemoryMapSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  addressUnitBits: z.number().int().min(1).max(128).default(8),
  shared: z.boolean().optional(),
});

export const updateMemoryMapSchema = createMemoryMapSchema.partial();

export const createAddressBlockSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  baseAddress: z.string().min(1),
  range: z.string().min(1),
  width: z.number().int().min(8).max(1024),
  usage: addressBlockUsageSchema.default("register"),
  volatile: z.boolean().optional(),
  typeIdentifier: z.string().max(255).optional(),
});

export const updateAddressBlockSchema = createAddressBlockSchema.partial();

export const createRegisterSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  addressOffset: z.string().min(1),
  size: z.number().int().min(1).max(1024),
  volatile: z.boolean().optional(),
  typeIdentifier: z.string().max(255).optional(),
});

export const updateRegisterSchema = createRegisterSchema.partial();

export const createFieldSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  bitOffset: z.number().int().min(0),
  bitWidth: z.number().int().min(1).max(1024),
  volatile: z.boolean().optional(),
  typeIdentifier: z.string().max(255).optional(),
});

export const updateFieldSchema = createFieldSchema.partial();

export const createResetValueSchema = z.object({
  resetTypeRef: z.string().max(255).optional(),
  value: z.string().min(1),
  mask: z.string().optional(),
});

export const createEnumeratedValueSchema = z.object({
  name: z.string().min(1).max(255),
  displayName: z.string().max(255).optional(),
  description: z.string().max(4000).optional(),
  value: z.string().min(1),
});

export const createFieldAccessPolicySchema = z.object({
  access: accessTypeSchema.default("read-write"),
  modifiedWriteValue: modifiedWriteValueSchema.optional(),
  readAction: readActionSchema.optional(),
  testable: z.boolean().optional(),
  reserved: z.string().optional(),
  modeRefs: z.array(z.string()).optional(),
});

export const exportRequestSchema = z.object({
  format: exportFormatSchema,
  options: z.record(z.unknown()).optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateMemoryMapInput = z.infer<typeof createMemoryMapSchema>;
export type UpdateMemoryMapInput = z.infer<typeof updateMemoryMapSchema>;
export type CreateAddressBlockInput = z.infer<typeof createAddressBlockSchema>;
export type UpdateAddressBlockInput = z.infer<typeof updateAddressBlockSchema>;
export type CreateRegisterInput = z.infer<typeof createRegisterSchema>;
export type UpdateRegisterInput = z.infer<typeof updateRegisterSchema>;
export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type CreateResetValueInput = z.infer<typeof createResetValueSchema>;
export type CreateEnumeratedValueInput = z.infer<typeof createEnumeratedValueSchema>;
export type CreateFieldAccessPolicyInput = z.infer<typeof createFieldAccessPolicySchema>;
export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
