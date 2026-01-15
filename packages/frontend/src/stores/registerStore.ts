import { create } from "zustand";
import type {
  Project,
  MemoryMap,
  AddressBlock,
  Register,
  Field,
  CreateProjectInput,
  CreateMemoryMapInput,
  CreateAddressBlockInput,
  UpdateAddressBlockInput,
  CreateRegisterInput,
  CreateFieldInput,
  UpdateRegisterInput,
  UpdateFieldInput,
  UpdateProjectInput,
} from "@register-manager/shared";

interface RegisterStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  selectedRegister: Register | null;
  selectedAddressBlockId: string | null;
  selectedMemoryMapId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<void>;
  updateProject: (id: string, data: UpdateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setSelectedAddressBlockId: (id: string | null) => void;
  setSelectedMemoryMapId: (id: string | null) => void;
  createAddressBlock: (memoryMapId: string, data: CreateAddressBlockInput) => Promise<string | undefined>;
  updateAddressBlock: (id: string, data: UpdateAddressBlockInput) => Promise<void>;
  deleteAddressBlock: (id: string) => Promise<void>;

  // Register actions
  createRegister: (addressBlockId: string, data: CreateRegisterInput) => Promise<string | undefined>;
  updateRegister: (id: string, data: UpdateRegisterInput) => Promise<void>;
  deleteRegister: (id: string) => Promise<void>;
  setSelectedRegister: (register: Register | null) => void;

  // Field actions
  createField: (registerId: string, data: CreateFieldInput) => Promise<void>;
  updateField: (fieldId: string, data: UpdateFieldInput) => Promise<void>;
  deleteField: (fieldId: string) => Promise<void>;

  // Validation
  validateAddressConflict: (register: Register, addressBlockId: string) => boolean;
  validateBitFieldConflict: (field: Field, registerId: string) => boolean;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Member actions
  fetchProjectMembers: (projectId: string) => Promise<any[]>;
  addProjectMember: (projectId: string, email: string, role: "editor" | "viewer") => Promise<any>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
}

export const useRegisterStore = create<RegisterStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  selectedRegister: null,
  selectedAddressBlockId: null,
  selectedMemoryMapId: null,
  isDirty: false,
  isLoading: false,
  error: null,

  // Project actions
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/projects");
      const { data } = await response.json();
      set({ projects: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch project");
      }

      set((state) => {
        const newProject: Project = json.data;
        let newSelectedRegister = null;
        let newSelectedMemoryMapId = null;

        // Try to preserve selected register if it still exists
        if (state.selectedRegister) {
          const allRegisters = newProject.memoryMaps?.flatMap(mm =>
            mm.addressBlocks?.flatMap(ab => ab.registers || []) || []
          ) || [];
          newSelectedRegister = allRegisters.find(r => r.id === state.selectedRegister!.id) || null;
        }

        // If we found the preserved register, ensure we preserve the context
        if (newSelectedRegister) {
          // Context is preserved via the register selection logic in UI (which derives parents)
          // But we should probably keep the IDs if we can. 
          // Although, store uses separate IDs.
          // If we have a selected register, we don't strictly *need* selectedMemoryMapId for the view to render Register Editor?
          // Actually, ProjectView checks selectedRegister first.
          newSelectedMemoryMapId = state.selectedMemoryMapId;
        } else {
          // If no register selected (or lost), default to first Memory Map
          if (newProject.memoryMaps && newProject.memoryMaps.length > 0) {
            newSelectedMemoryMapId = newProject.memoryMaps[0].id;
          }
        }

        return {
          currentProject: newProject,
          selectedRegister: newSelectedRegister,
          selectedMemoryMapId: newSelectedMemoryMapId,
          // Reset other selections if we are switching defaults
          selectedAddressBlockId: newSelectedRegister ? state.selectedAddressBlockId : null,
          isLoading: false
        };
      });
    } catch (error) {
      // Error state is set above
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (data: CreateProjectInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const { data: newProject } = await response.json();

      // Refresh the projects list to get the new project
      await get().fetchProjects();

      set({
        currentProject: newProject,
        isLoading: false
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProject: async (id: string, data: UpdateProjectInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Failed to update project");
      }
      const updatedProject = json.data;

      // Refresh the projects list
      await get().fetchProjects();

      set((state) => ({
        currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });

      // Update local state
      set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
  setSelectedAddressBlockId: (id) => set({ selectedAddressBlockId: id }),
  setSelectedMemoryMapId: (id) => set({ selectedMemoryMapId: id }),

  createAddressBlock: async (memoryMapId: string, data: CreateAddressBlockInput) => {
    set({ isLoading: true, error: null });
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/memory-maps/${memoryMapId}/address-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create address block");
      }
      const newAddressBlock = result.data;

      await get().fetchProject(currentProject.id);
      set({ isLoading: false });
      return newAddressBlock?.id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAddressBlock: async (id: string, data: UpdateAddressBlockInput) => {
    set({ isLoading: true, error: null });
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/address-blocks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update address block");
      }

      await get().fetchProject(currentProject.id);
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteAddressBlock: async (id: string) => {
    set({ isLoading: true, error: null });
    const { currentProject } = get();
    if (!currentProject) return;

    try {
      const response = await fetch(`/api/address-blocks/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete address block");
      }

      await get().fetchProject(currentProject.id);
      if (get().selectedAddressBlockId === id) {
        get().setSelectedAddressBlockId(null);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Register actions
  createRegister: async (addressBlockId: string, data: CreateRegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/registers/address-block/${addressBlockId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const { data: newRegister } = await response.json();

      // Update current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ isLoading: false, isDirty: true });
      return newRegister?.id;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateRegister: async (id: string, data: UpdateRegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/registers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const { data: updatedRegister } = await response.json();

      // Update current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ isLoading: false, isDirty: true });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteRegister: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/registers/${id}`, { method: "DELETE" });

      // Update current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ selectedRegister: null, isLoading: false, isDirty: true });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setSelectedRegister: (register) => set({ selectedRegister: register }),

  // Field actions
  createField: async (registerId: string, data: CreateFieldInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/registers/${registerId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Refresh current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ isLoading: false, isDirty: true });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateField: async (fieldId: string, data: UpdateFieldInput) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/registers/fields/${fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Refresh current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ isLoading: false, isDirty: true });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteField: async (fieldId: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetch(`/api/registers/fields/${fieldId}`, { method: "DELETE" });

      // Refresh current project
      const { currentProject } = get();
      if (currentProject) {
        await get().fetchProject(currentProject.id);
      }

      set({ isLoading: false, isDirty: true });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Validation
  validateAddressConflict: (register: Register, addressBlockId: string) => {
    const { currentProject } = get();
    if (!currentProject) return false;

    // Find the address block
    const addressBlock = currentProject.memoryMaps
      .flatMap((mm) => mm.addressBlocks)
      .find((ab) => ab.id === addressBlockId);

    if (!addressBlock) return false;

    // Check for conflicts with other registers
    const registerOffset = parseInt(register.addressOffset, 16);
    const registerEnd = registerOffset + register.size / 8;

    return addressBlock.registers.some((r) => {
      if (r.id === register.id) return false; // Skip self
      const otherOffset = parseInt(r.addressOffset, 16);
      const otherEnd = otherOffset + r.size / 8;
      return registerOffset < otherEnd && otherOffset < registerEnd;
    });
  },

  validateBitFieldConflict: (field: Field, registerId: string) => {
    const { currentProject } = get();
    if (!currentProject) return false;

    // Find the register
    const register = currentProject.memoryMaps
      .flatMap((mm) => mm.addressBlocks)
      .flatMap((ab) => ab.registers)
      .find((r) => r.id === registerId);

    if (!register) return false;

    // Check for bit field conflicts
    const fieldEnd = field.bitOffset + field.bitWidth;

    return register.fields.some((f) => {
      if (f.id === field.id) return false; // Skip self
      const otherEnd = f.bitOffset + f.bitWidth;
      return field.bitOffset < otherEnd && f.bitOffset < fieldEnd;
    });
  },

  // Utility
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ isLoading: loading }),

  // Member actions
  fetchProjectMembers: async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}/members`);
    if (!response.ok) return [];
    const json = await response.json();
    return json.data;
  },

  addProjectMember: async (projectId: string, email: string, role: "editor" | "viewer") => {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error || "Failed to add member");
    }
    return await response.json();
  },

  removeProjectMember: async (projectId: string, userId: string) => {
    const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error || "Failed to remove member");
    }
  }
}));
