import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Users & Auth
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Projects
// ============================================================================

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  vlnv: text("vlnv", { mode: "json" }).notNull().$type<{
    vendor: string;
    library: string;
    name: string;
    version: string;
  }>(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Memory Maps
// ============================================================================

export const memoryMaps = sqliteTable("memory_maps", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressUnitBits: integer("address_unit_bits").notNull().default(8),
  shared: integer("shared", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Address Blocks
// ============================================================================

export const addressBlocks = sqliteTable("address_blocks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memoryMapId: text("memory_map_id").notNull().references(() => memoryMaps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  baseAddress: text("base_address").notNull(),
  range: text("range").notNull(),
  width: integer("width").notNull(),
  usage: text("usage").notNull().default("register"),
  volatile: integer("volatile", { mode: "boolean" }).default(false),
  typeIdentifier: text("type_identifier"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Register Files
// ============================================================================

export const registerFiles = sqliteTable("register_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull(),
  parentType: text("parent_type").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressOffset: text("address_offset").notNull(),
  range: text("range").notNull(),
  typeIdentifier: text("type_identifier"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Registers
// ============================================================================

export const registers = sqliteTable("registers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  parentId: text("parent_id").notNull(),
  parentType: text("parent_type").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressOffset: text("address_offset").notNull(),
  size: integer("size").notNull(),
  volatile: integer("volatile", { mode: "boolean" }).default(false),
  typeIdentifier: text("type_identifier"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Fields
// ============================================================================

export const fields = sqliteTable("fields", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  registerId: text("register_id").notNull().references(() => registers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  bitOffset: integer("bit_offset").notNull(),
  bitWidth: integer("bit_width").notNull(),
  volatile: integer("volatile", { mode: "boolean" }).default(false),
  typeIdentifier: text("type_identifier"),
  access: text("access").default("read-write"),
  modifiedWriteValue: text("modified_write_value"),
  readAction: text("read_action"),
  testable: integer("testable", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Reset Values
// ============================================================================

export const resets = sqliteTable("resets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fieldId: text("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  resetTypeRef: text("reset_type_ref"),
  value: text("value").notNull(),
  mask: text("mask"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Enumerated Values
// ============================================================================

export const enumeratedValues = sqliteTable("enumerated_values", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fieldId: text("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  value: text("value").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================================================
// Relations
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  memoryMaps: many(memoryMaps),
}));

export const memoryMapsRelations = relations(memoryMaps, ({ one, many }) => ({
  project: one(projects, {
    fields: [memoryMaps.projectId],
    references: [projects.id],
  }),
  addressBlocks: many(addressBlocks),
}));

export const addressBlocksRelations = relations(addressBlocks, ({ one, many }) => ({
  memoryMap: one(memoryMaps, {
    fields: [addressBlocks.memoryMapId],
    references: [memoryMaps.id],
  }),
  registers: many(registers, { relationName: "addressBlockRegisters" }),
}));

export const registersRelations = relations(registers, ({ one, many }) => ({
  fields: many(fields),
  addressBlock: one(addressBlocks, {
    fields: [registers.parentId],
    references: [addressBlocks.id],
    relationName: "addressBlockRegisters",
  }),
}));

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  register: one(registers, {
    fields: [fields.registerId],
    references: [registers.id],
  }),
  resets: many(resets),
  enumeratedValues: many(enumeratedValues),
}));

export const resetsRelations = relations(resets, ({ one }) => ({
  field: one(fields, {
    fields: [resets.fieldId],
    references: [fields.id],
  }),
}));

export const enumeratedValuesRelations = relations(enumeratedValues, ({ one }) => ({
  field: one(fields, {
    fields: [enumeratedValues.fieldId],
    references: [fields.id],
  }),
}));
