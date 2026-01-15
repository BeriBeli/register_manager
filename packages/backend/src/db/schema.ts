import { pgTable, text, integer, timestamp, boolean, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// Better Auth Tables (managed by Better Auth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  approved: boolean("approved").default(false).notNull(),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ============================================================================
// Projects
// ============================================================================

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
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

export const projectVersions = pgTable("project_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  version: text("version").notNull(),
  description: text("description"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").references(() => user.id),
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
// Project Members
// ============================================================================

export const projectMembers = pgTable("project_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("editor"), // 'editor', 'viewer'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// Plugins
// ============================================================================

export const plugins = pgTable("plugins", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("wasm"),
  wasmPath: text("wasm_path").notNull(),
  jsPath: text("js_path"),
  supportedExtensions: jsonb("supported_extensions").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// Relations
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  projects: many(projects),
  sessions: many(session),
  accounts: many(account),
  projectMemberships: many(projectMembers),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
    relationName: "projectOwner",
  }),
  memoryMaps: many(memoryMaps),
  versions: many(projectVersions),
  members: many(projectMembers),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [projectMembers.userId],
    references: [user.id],
  }),
}));

export const projectVersionsRelations = relations(projectVersions, ({ one }) => ({
  project: one(projects, {
    fields: [projectVersions.projectId],
    references: [projects.id],
  }),
  resultCreator: one(user, {
    fields: [projectVersions.createdBy],
    references: [user.id],
  }),
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
