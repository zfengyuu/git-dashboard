import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { sampleRepositories } from "@/lib/sample-data";
import type { ActivityInput, ActivityItem, GitActionResult, RepositoryStatus } from "@/types/repository";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

const fallbackDelay = 220;
const activityKey = "repopilot-fallback-activity";

function isTauriRuntime() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function selectWorkspaceFolder(): Promise<string | null> {
  if (isTauriRuntime()) {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select workspace folder",
    });

    return typeof selected === "string" ? selected : null;
  }

  return window.prompt("Workspace path", "/Users/user/workspace");
}

export async function scanWorkspace(path: string): Promise<RepositoryStatus[]> {
  if (isTauriRuntime()) {
    return invoke("scan_workspace", { path });
  }

  await wait(fallbackDelay);
  return sampleRepositories.map((repository) => ({
    ...repository,
    path: repository.path.replace("/Users/user/workspace", path),
    lastScannedAt: new Date().toISOString(),
  }));
}

export async function refreshRepository(repoPath: string): Promise<RepositoryStatus> {
  if (isTauriRuntime()) {
    return invoke("refresh_repository", { repoPath });
  }

  await wait(fallbackDelay);
  const repository = sampleRepositories.find((item) => repoPath.endsWith(item.name)) ?? sampleRepositories[0];
  return { ...repository, path: repoPath, lastScannedAt: new Date().toISOString() };
}

export async function refreshRepositories(repoPaths: string[]): Promise<RepositoryStatus[]> {
  if (isTauriRuntime()) {
    return invoke("refresh_repositories", { repoPaths });
  }

  return Promise.all(repoPaths.map((repoPath) => refreshRepository(repoPath)));
}

export async function fetchRepository(repoPath: string): Promise<GitActionResult> {
  if (isTauriRuntime()) {
    return invoke("fetch_repository", { repoPath });
  }

  await wait(fallbackDelay);
  return { status: "success", message: `Fetched ${repoPath.split("/").pop() ?? "repository"}` };
}

export async function pullRepository(repoPath: string): Promise<GitActionResult> {
  if (isTauriRuntime()) {
    return invoke("pull_repository", { repoPath });
  }

  await wait(fallbackDelay);
  return { status: "success", message: `Pulled ${repoPath.split("/").pop() ?? "repository"}` };
}

export async function pushRepository(repoPath: string): Promise<GitActionResult> {
  if (isTauriRuntime()) {
    return invoke("push_repository", { repoPath });
  }

  await wait(fallbackDelay);
  return { status: "success", message: `Pushed ${repoPath.split("/").pop() ?? "repository"}` };
}

export async function openInVSCode(repoPath: string, command?: string): Promise<GitActionResult> {
  if (isTauriRuntime()) {
    return invoke("open_in_vscode", { repoPath, command });
  }

  await wait(fallbackDelay);
  return { status: "success", message: `Opened ${repoPath.split("/").pop() ?? "repository"} in VS Code` };
}

export async function openInTerminal(repoPath: string, command?: string): Promise<GitActionResult> {
  if (isTauriRuntime()) {
    return invoke("open_in_terminal", { repoPath, command });
  }

  await wait(fallbackDelay);
  return { status: "success", message: `Opened ${repoPath.split("/").pop() ?? "repository"} in Terminal` };
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  if (isTauriRuntime()) {
    return invoke("get_recent_activity", { limit });
  }

  await wait(80);
  return readFallbackActivity().slice(0, limit);
}

export async function recordActivity(input: ActivityInput): Promise<ActivityItem> {
  if (isTauriRuntime()) {
    return invoke("record_activity", { input });
  }

  const item: ActivityItem = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: String(Math.floor(Date.now() / 1000)),
  };
  const next = [item, ...readFallbackActivity()].slice(0, 40);
  localStorage.setItem(activityKey, JSON.stringify(next));
  return item;
}

export async function clearRecentActivity(): Promise<void> {
  if (isTauriRuntime()) {
    return invoke("clear_recent_activity");
  }

  localStorage.removeItem(activityKey);
}

function readFallbackActivity(): ActivityItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(activityKey) ?? "[]") as ActivityItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
