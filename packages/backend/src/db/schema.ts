import { pgTable, text, integer, timestamp, boolean, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Users & Auth
// ============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// Projects
// ============================================================================

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  vlnv: jsonb("vlnv").notNull().$type<{
    vendor: string;
    library: string;
    name: string;
    version: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Memory Maps
// ============================================================================

export const memoryMaps = pgTable("memory_maps", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressUnitBits: integer("address_unit_bits").notNull().default(8),
  shared: boolean("shared").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Address Blocks
// ============================================================================

export const addressBlocks = pgTable("address_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  memoryMapId: uuid("memory_map_id").notNull().references(() => memoryMaps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  baseAddress: text("base_address").notNull(),
  range: text("range").notNull(),
  width: integer("width").notNull(),
  usage: text("usage").notNull().default("register"),
  volatile: boolean("volatile").default(false),
  typeIdentifier: text("type_identifier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Register Files
// ============================================================================

export const registerFiles = pgTable("register_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").notNull(),
  parentType: text("parent_type").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressOffset: text("address_offset").notNull(),
  range: text("range").notNull(),
  typeIdentifier: text("type_identifier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Registers
// ============================================================================

export const registers = pgTable("registers", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").notNull(),
  parentType: text("parent_type").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  addressOffset: text("address_offset").notNull(),
  size: integer("size").notNull(),
  volatile: boolean("volatile").default(false),
  typeIdentifier: text("type_identifier"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Fields
// ============================================================================

export const fields = pgTable("fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  registerId: uuid("register_id").notNull().references(() => registers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  bitOffset: integer("bit_offset").notNull(),
  bitWidth: integer("bit_width").notNull(),
  volatile: boolean("volatile").default(false),
  typeIdentifier: text("type_identifier"),
  access: text("access").default("read-write"),
  modifiedWriteValue: text("modified_write_value"),
  readAction: text("read_action"),
  testable: boolean("testable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================================
// Reset Values
// ============================================================================

export const resets = pgTable("resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  resetTypeRef: text("reset_type_ref"),
  value: text("value").notNull(),
  mask: text("mask"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// Enumerated Values
// ============================================================================

export const enumeratedValues = pgTable("enumerated_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  fieldId: uuid("field_id").notNull().references(() => fields.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
