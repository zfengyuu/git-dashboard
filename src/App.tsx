import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/app/AppShell";
import { toast } from "@/components/ui/sonner";
import { CommandPalette } from "@/features/dashboard/CommandPalette";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { shouldShowCommandPalette } from "@/features/dashboard/dashboard-utils";
import { RepositoryDetailDrawer } from "@/features/repositories/RepositoryDetailDrawer";
import { SettingsPage } from "@/features/settings/SettingsPage";
import {
  clearRecentActivity,
  fetchRepository,
  getRecentActivity,
  openInTerminal,
  openInVSCode,
  pullRepository,
  pushRepository,
  recordActivity,
  refreshRepository,
  scanWorkspace,
  selectWorkspaceFolder,
} from "@/lib/tauri-api";
import { useAppStore } from "@/stores/app-store";
import type { ActivityItem, GitActionResult, GitActionStatus, RepoAction, RepositoryStatus } from "@/types/repository";

function actionKey(path: string, action: RepoAction) {
  return `${path}:${action}`;
}

function resultVariant(status: GitActionResult["status"]): "success" | "error" {
  return status === "success" ? "success" : "error";
}

function App() {
  const {
    activeView,
    actionStatuses,
    clearSelection,
    closeRepositoryDetail,
    openRepositoryDetail,
    repositories,
    searchQuery,
    selectedPaths,
    selectedRepositoryPath,
    setActionStatus,
    setActiveView,
    setRepositories,
    setSearchQuery,
    setSelectedPaths,
    setStatusFilter,
    setWorkspacePath,
    settings,
    statusFilter,
    toggleSelectedPath,
    upsertRepositories,
    workspace,
  } = useAppStore();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<RepoAction | null>(null);
  const [bulkTargetPaths, setBulkTargetPaths] = useState<string[]>([]);
  const hasAutoRefreshed = useRef(false);

  const selectedRepository = useMemo(
    () => repositories.find((repository) => repository.path === selectedRepositoryPath) ?? null,
    [repositories, selectedRepositoryPath],
  );
  const selectedRepositories = useMemo(
    () => repositories.filter((repository) => selectedPaths.includes(repository.path)),
    [repositories, selectedPaths],
  );
  const bulkRepositories = useMemo(
    () => repositories.filter((repository) => bulkTargetPaths.includes(repository.path)),
    [bulkTargetPaths, repositories],
  );

  const loadActivity = useCallback(async () => {
    const recent = await getRecentActivity(20);
    setActivities(recent);
  }, []);

  const addActivity = useCallback(
    async (
      repository: RepositoryStatus | null,
      actionType: RepoAction | "workspace_scan",
      status: GitActionStatus,
      message: string,
    ) => {
      await recordActivity({
        repositoryName: repository?.name ?? null,
        repositoryPath: repository?.path ?? null,
        actionType,
        status,
        message,
      });
      await loadActivity();
    },
    [loadActivity],
  );

  const runScan = useCallback(
    async (path: string) => {
      setIsScanning(true);
      setScanError(null);
      try {
        const nextRepositories = await scanWorkspace(path);
        setRepositories(nextRepositories);
        toast.success(`Found ${nextRepositories.length} repositories`);
        await addActivity(null, "workspace_scan", "success", `Scanned ${nextRepositories.length} repositories`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setScanError(message);
        toast.error(message);
        await addActivity(null, "workspace_scan", "failed", message);
      } finally {
        setIsScanning(false);
      }
    },
    [addActivity, setRepositories],
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadActivity();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadActivity]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldShowCommandPalette(event)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!hasAutoRefreshed.current && settings.autoRefreshOnStart && workspace?.path) {
      hasAutoRefreshed.current = true;
      void runScan(workspace.path);
    }
  }, [runScan, settings.autoRefreshOnStart, workspace?.path]);

  const handleSelectWorkspace = useCallback(async () => {
    const path = await selectWorkspaceFolder();
    if (!path) {
      return;
    }

    setWorkspacePath(path);
    await runScan(path);
  }, [runScan, setWorkspacePath]);

  const handleRefreshWorkspace = useCallback(async () => {
    const path = workspace?.path ?? settings.defaultWorkspace;
    if (!path) {
      await handleSelectWorkspace();
      return;
    }

    setWorkspacePath(path);
    await runScan(path);
  }, [handleSelectWorkspace, runScan, setWorkspacePath, settings.defaultWorkspace, workspace?.path]);

  const runSingleAction = useCallback(
    async (repository: RepositoryStatus, action: RepoAction) => {
      const key = actionKey(repository.path, action);
      setActionStatus(key, "running");

      try {
        if (action === "refresh") {
          const refreshed = await refreshRepository(repository.path);
          upsertRepositories([refreshed]);
          setActionStatus(key, "success");
          toast.success(`Refreshed ${repository.name}`);
          await addActivity(repository, "refresh", "success", `Refreshed ${repository.name}`);
          return;
        }

        const result =
          action === "fetch"
            ? await fetchRepository(repository.path)
            : action === "pull"
              ? await pullRepository(repository.path)
              : action === "push"
                ? await pushRepository(repository.path)
                : action === "open_vscode"
                  ? await openInVSCode(repository.path, settings.vsCodeCommand)
                  : await openInTerminal(repository.path, settings.terminalCommand);

        const nextStatus: GitActionStatus = result.status === "success" ? "success" : "failed";
        setActionStatus(key, nextStatus);
        toast[resultVariant(result.status)](result.message);
        await addActivity(repository, action, nextStatus, result.message);

        if ((action === "fetch" || action === "pull" || action === "push") && result.status === "success") {
          const refreshed = await refreshRepository(repository.path);
          upsertRepositories([refreshed]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setActionStatus(key, "failed");
        toast.error(message);
        await addActivity(repository, action, "failed", message);
      }
    },
    [addActivity, setActionStatus, settings.terminalCommand, settings.vsCodeCommand, upsertRepositories],
  );

  const runBulkAction = useCallback(
    async (action: "refresh" | "fetch" | "pull") => {
      const targets = repositories.filter((repository) => selectedPaths.includes(repository.path));
      if (targets.length === 0) {
        toast.info("Select repositories first");
        return;
      }

      setBulkAction(action);
      setBulkTargetPaths(targets.map((repository) => repository.path));
      targets.forEach((repository) => setActionStatus(actionKey(repository.path, action), "pending"));

      const refreshedRepositories: RepositoryStatus[] = [];

      for (const repository of targets) {
        setActionStatus(actionKey(repository.path, action), "running");
        try {
          if (action === "refresh") {
            const refreshed = await refreshRepository(repository.path);
            refreshedRepositories.push(refreshed);
            setActionStatus(actionKey(repository.path, action), "success");
            await addActivity(repository, action, "success", `Refreshed ${repository.name}`);
            continue;
          }

          const result = action === "fetch" ? await fetchRepository(repository.path) : await pullRepository(repository.path);
          const nextStatus: GitActionStatus = result.status === "success" ? "success" : "failed";
          setActionStatus(actionKey(repository.path, action), nextStatus);
          await addActivity(repository, action, nextStatus, result.message);

          if (result.status === "success") {
            refreshedRepositories.push(await refreshRepository(repository.path));
          } else {
            toast.error(`${repository.name}: ${result.message}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          setActionStatus(actionKey(repository.path, action), "failed");
          await addActivity(repository, action, "failed", message);
          toast.error(`${repository.name}: ${message}`);
        }
      }

      if (refreshedRepositories.length > 0) {
        upsertRepositories(refreshedRepositories);
      }

      toast.success(`${action === "refresh" ? "Refreshed" : action === "fetch" ? "Fetched" : "Pulled"} ${targets.length} repositories`);
    },
    [addActivity, repositories, selectedPaths, setActionStatus, upsertRepositories],
  );

  const clearActivity = useCallback(async () => {
    await clearRecentActivity();
    await loadActivity();
    toast.success("Recent activity cleared");
  }, [loadActivity]);

  const focusSearch = useCallback(() => {
    setActiveView("dashboard");
    window.setTimeout(() => document.querySelector<HTMLInputElement>("[data-repopilot-search]")?.focus(), 0);
  }, [setActiveView]);

  const content =
    activeView === "settings" ? (
      <SettingsPage />
    ) : (
      <DashboardPage
        activities={activities}
        actionStatuses={actionStatuses}
        bulkAction={bulkAction}
        bulkRepositories={bulkRepositories}
        clearSelection={clearSelection}
        isScanning={isScanning}
        onBulkAction={runBulkAction}
        onClearActivity={clearActivity}
        onOpenRepository={openRepositoryDetail}
        onRefreshWorkspace={handleRefreshWorkspace}
        onRepoAction={runSingleAction}
        onSearchChange={setSearchQuery}
        onSelectWorkspace={handleSelectWorkspace}
        onStatusFilterChange={setStatusFilter}
        repositories={repositories}
        scanError={scanError}
        searchQuery={searchQuery}
        selectedPaths={selectedPaths}
        setSelectedPaths={setSelectedPaths}
        statusFilter={statusFilter}
        toggleSelectedPath={toggleSelectedPath}
        workspace={workspace}
      />
    );

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView} workspacePath={workspace?.path}>
      {content}
      <RepositoryDetailDrawer
        actionStatuses={actionStatuses}
        onAction={runSingleAction}
        onOpenChange={(open) => {
          if (!open) {
            closeRepositoryDetail();
          }
        }}
        repository={selectedRepository}
      />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onRepoAction={runSingleAction}
        onBulkAction={runBulkAction}
        onOpenSettings={() => setActiveView("settings")}
        onRefreshAll={handleRefreshWorkspace}
        onSearchFocus={focusSearch}
        onSelectWorkspace={handleSelectWorkspace}
        repositories={repositories}
        selectedRepositories={selectedRepositories}
      />
    </AppShell>
  );
}

export default App;
