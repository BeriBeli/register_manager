/**
 * Access control helpers for project-level authorization.
 * Used to verify user has access to project resources like registers, address blocks, etc.
 */

import { eq, and } from "drizzle-orm";
import { db } from "../db";
import {
  projects,
  projectMembers,
  memoryMaps,
  addressBlocks,
  registers,
} from "../db/schema";

/**
 * Check if user has access to a project (owner or member).
 */
export const hasProjectAccess = async (
  projectId: string,
  userId: string
): Promise<boolean> => {
  // Check ownership
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    columns: { userId: true },
  });
  if (!project) return false;
  if (project.userId === userId) return true;

  // Check membership
  const member = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.projectId, projectId),
      eq(projectMembers.userId, userId)
    ),
  });
  return !!member;
};

/**
 * Get project ID from an address block ID.
 * Traverses: addressBlock -> memoryMap -> project
 */
export const getProjectIdFromAddressBlock = async (
  addressBlockId: string
): Promise<string | null> => {
  const ab = await db.query.addressBlocks.findFirst({
    where: eq(addressBlocks.id, addressBlockId),
    columns: { memoryMapId: true },
  });
  if (!ab) return null;

  const mm = await db.query.memoryMaps.findFirst({
    where: eq(memoryMaps.id, ab.memoryMapId),
    columns: { projectId: true },
  });
  return mm?.projectId ?? null;
};

/**
 * Get project ID from a register ID.
 * Traverses: register -> addressBlock -> memoryMap -> project
 */
export const getProjectIdFromRegister = async (
  registerId: string
): Promise<string | null> => {
  const reg = await db.query.registers.findFirst({
    where: eq(registers.id, registerId),
    columns: { parentId: true },
  });
  if (!reg) return null;

  return getProjectIdFromAddressBlock(reg.parentId);
};

/**
 * Verify user has access to a project resource. Throws context for HTTP response.
 */
export const verifyProjectAccessByAddressBlock = async (
  addressBlockId: string,
  userId: string,
  userRole: string
): Promise<{ hasAccess: boolean; projectId: string | null }> => {
  const projectId = await getProjectIdFromAddressBlock(addressBlockId);
  if (!projectId) return { hasAccess: false, projectId: null };
  
  // Admin bypass
  if (userRole === "admin") return { hasAccess: true, projectId };
  
  const hasAccess = await hasProjectAccess(projectId, userId);
  return { hasAccess, projectId };
};

export const verifyProjectAccessByRegister = async (
  registerId: string,
  userId: string,
  userRole: string
): Promise<{ hasAccess: boolean; projectId: string | null }> => {
  const projectId = await getProjectIdFromRegister(registerId);
  if (!projectId) return { hasAccess: false, projectId: null };
  
  // Admin bypass
  if (userRole === "admin") return { hasAccess: true, projectId };
  
  const hasAccess = await hasProjectAccess(projectId, userId);
  return { hasAccess, projectId };
};
