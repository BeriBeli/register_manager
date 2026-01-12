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
  CreateRegisterInput,
  CreateFieldInput,
  UpdateRegisterInput,
  UpdateFieldInput,
} from "@register-manager/shared";

interface RegisterStore {
  // State
  projects: Project[];
  currentProject: Project | null;
  selectedRegister: Register | null;
  selectedAddressBlockId: string | null;
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setSelectedAddressBlockId: (id: string | null) => void;

  // Register actions
  createRegister: (addressBlockId: string, data: CreateRegisterInput) => Promise<void>;
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
}

export const useRegisterStore = create<RegisterStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  selectedRegister: null,
  selectedAddressBlockId: null,
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
    console.log(`📡 Fetching project: ${id}`);
    try {
      const response = await fetch(`/api/projects/${id}`);
      const json = await response.json();
      console.log("📥 Fetch project response:", json);

      if (!response.ok) {
        throw new Error(json.error || "Failed to fetch project");
      }

      set((state) => {
        const newProject: Project = json.data;
        let newSelectedRegister = null;

        // Try to preserve selected register
        if (state.selectedRegister) {
          const allRegisters = newProject.memoryMaps?.flatMap(mm =>
            mm.addressBlocks?.flatMap(ab => ab.registers || []) || []
          ) || [];
          newSelectedRegister = allRegisters.find(r => r.id === state.selectedRegister!.id) || null;
        }

        return {
          currentProject: newProject,
          selectedRegister: newSelectedRegister,
          isLoading: false
        };
      });
    } catch (error) {
      console.error("❌ Fetch project failed:", error);
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
}));
