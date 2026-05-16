import type {
  ActivityItem,
  BulkProgress,
  GitActionStatus,
  RepoAction,
  RepositoryFilter,
  RepositoryStatus,
  RepositorySummary,
  RepositoryUiStatus,
} from "@/types/repository";

export function deriveRepositoryStatus(repository: RepositoryStatus): RepositoryUiStatus {
  if (repository.error || repository.errorMessage) {
    return "error";
  }

  if (repository.behind > 0) {
    return "behind";
  }

  if (repository.ahead > 0) {
    return "ahead";
  }

  if (
    repository.modifiedCount > 0 ||
    repository.stagedCount > 0 ||
    repository.untrackedCount > 0 ||
    !repository.isClean
  ) {
    return "modified";
  }

  return "clean";
}

export function summarizeRepositories(repositories: RepositoryStatus[]): RepositorySummary {
  return repositories.reduce<RepositorySummary>(
    (summary, repository) => {
      const status = deriveRepositoryStatus(repository);
      summary.total += 1;

      if (status === "clean") {
        summary.clean += 1;
      } else if (status === "error") {
        summary.errors += 1;
      } else if (status === "behind") {
        summary.behind += 1;
      } else {
        summary.modified += 1;
      }

      return summary;
    },
    { total: 0, clean: 0, modified: 0, behind: 0, errors: 0 },
  );
}

export function filterRepositories(
  repositories: RepositoryStatus[],
  searchQuery: string,
): RepositoryStatus[] {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return repositories;
  }

  return repositories.filter((repository) => {
    const searchable = [
      repository.name,
      repository.path,
      repository.currentBranch,
      repository.lastCommitMessage ?? "",
      repository.remoteUrl ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(query);
  });
}

export function filterRepositoriesByStatus(
  repositories: RepositoryStatus[],
  statusFilter: RepositoryFilter,
): RepositoryStatus[] {
  if (statusFilter === "all") {
    return repositories;
  }

  return repositories.filter((repository) => deriveRepositoryStatus(repository) === statusFilter);
}

export function isBulkToolbarEnabled(selectedPaths: Set<string>): boolean {
  return selectedPaths.size > 0;
}

export function buildBulkProgress(
  repositories: RepositoryStatus[],
  actionStatuses: Record<string, GitActionStatus>,
  action: RepoAction,
): BulkProgress {
  const items = repositories.map((repository) => ({
    repository,
    status: actionStatuses[`${repository.path}:${action}`] ?? "pending",
  }));
  const completedStatuses: GitActionStatus[] = ["success", "failed", "skipped"];

  return {
    total: repositories.length,
    completed: items.filter((item) => completedStatuses.includes(item.status)).length,
    running: items.filter((item) => item.status === "running"),
    failed: items.filter((item) => item.status === "failed"),
    items,
  };
}

export function formatActivityItem(activity: ActivityItem): string {
  const repository = activity.repositoryName ? ` ${activity.repositoryName}` : "";
  return `${activity.message}${repository ? ` · ${repository}` : ""} · ${formatRelativeTime(activity.createdAt)}`;
}

export function formatRelativeTime(value: string): string {
  const numeric = Number(value);
  const timestamp = Number.isFinite(numeric) ? numeric * 1000 : Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "just now";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function shouldShowCommandPalette(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey">): boolean {
  return event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
}

export function syncLabel(repository: RepositoryStatus): string {
  if (!repository.hasUpstream) {
    return "No upstream";
  }

  if (repository.ahead > 0 && repository.behind > 0) {
    return `Ahead ${repository.ahead} / Behind ${repository.behind}`;
  }

  if (repository.ahead > 0) {
    return `Ahead ${repository.ahead}`;
  }

  if (repository.behind > 0) {
    return `Behind ${repository.behind}`;
  }

  return "Synced";
}
