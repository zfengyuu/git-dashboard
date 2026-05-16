import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GitActionStatus, RepositoryFilter, RepositoryStatus, Workspace } from "@/types/repository";

export type AppSettings = {
  theme: "dark" | "system";
  defaultWorkspace: string;
  autoRefreshOnStart: boolean;
  vsCodeCommand: string;
  terminalCommand: string;
};

type AppState = {
  activeView: "dashboard" | "settings";
  selectedRepositoryPath: string | null;
  workspace: Workspace | null;
  repositories: RepositoryStatus[];
  searchQuery: string;
  statusFilter: RepositoryFilter;
  selectedPaths: string[];
  actionStatuses: Record<string, GitActionStatus>;
  settings: AppSettings;
  setActiveView: (view: AppState["activeView"]) => void;
  openRepositoryDetail: (path: string) => void;
  setWorkspacePath: (path: string) => void;
  setRepositories: (repositories: RepositoryStatus[]) => void;
  upsertRepositories: (repositories: RepositoryStatus[]) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: RepositoryFilter) => void;
  closeRepositoryDetail: () => void;
  toggleSelectedPath: (path: string) => void;
  setSelectedPaths: (paths: string[]) => void;
  clearSelection: () => void;
  setActionStatus: (key: string, status: GitActionStatus) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
};

const defaultSettings: AppSettings = {
  theme: "dark",
  defaultWorkspace: "",
  autoRefreshOnStart: true,
  vsCodeCommand: "code",
  terminalCommand: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeView: "dashboard",
      selectedRepositoryPath: null,
      workspace: null,
      repositories: [],
      searchQuery: "",
      statusFilter: "all",
      selectedPaths: [],
      actionStatuses: {},
      settings: defaultSettings,
      setActiveView: (view) => set({ activeView: view }),
      openRepositoryDetail: (path) => set({ selectedRepositoryPath: path }),
      closeRepositoryDetail: () => set({ selectedRepositoryPath: null }),
      setWorkspacePath: (path) =>
        set((state) => {
          const now = new Date().toISOString();
          return {
            workspace: {
              id: path,
              name: path.split(/[\\/]/).filter(Boolean).pop() ?? path,
              path,
              createdAt: now,
              updatedAt: now,
            },
            settings: {
              ...state.settings,
              defaultWorkspace: path,
            },
          };
        }),
      setRepositories: (repositories) => set({ repositories, selectedPaths: [] }),
      upsertRepositories: (repositories) =>
        set((state) => {
          const next = new Map(state.repositories.map((repository) => [repository.path, repository]));
          repositories.forEach((repository) => next.set(repository.path, repository));
          return { repositories: Array.from(next.values()) };
        }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setStatusFilter: (filter) => set({ statusFilter: filter }),
      toggleSelectedPath: (path) =>
        set((state) => ({
          selectedPaths: state.selectedPaths.includes(path)
            ? state.selectedPaths.filter((selectedPath) => selectedPath !== path)
            : [...state.selectedPaths, path],
        })),
      setSelectedPaths: (paths) => set({ selectedPaths: paths }),
      clearSelection: () => set({ selectedPaths: [] }),
      setActionStatus: (key, status) =>
        set((state) => ({
          actionStatuses: {
            ...state.actionStatuses,
            [key]: status,
          },
        })),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),
    }),
    {
      name: "repopilot-state",
      partialize: (state) => ({
        workspace: state.workspace,
        repositories: state.repositories,
        searchQuery: state.searchQuery,
        statusFilter: state.statusFilter,
        selectedPaths: state.selectedPaths,
        settings: state.settings,
      }),
    },
  ),
);
