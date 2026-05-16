import { describe, expect, it } from "vitest";
import type { RepositoryStatus } from "@/types/repository";
import {
  buildBulkProgress,
  deriveRepositoryStatus,
  filterRepositoriesByStatus,
  filterRepositories,
  formatActivityItem,
  isBulkToolbarEnabled,
  shouldShowCommandPalette,
  summarizeRepositories,
} from "./dashboard-utils";

const baseRepo = (overrides: Partial<RepositoryStatus>): RepositoryStatus => ({
  name: "repo",
  path: "/workspace/repo",
  currentBranch: "main",
  isClean: true,
  modifiedCount: 0,
  stagedCount: 0,
  untrackedCount: 0,
  ahead: 0,
  behind: 0,
  hasUpstream: true,
  lastCommitHash: "abc123",
  lastCommitMessage: "Initial commit",
  lastCommitAuthor: "RepoPilot",
  lastCommitTime: "2 hours ago",
  remoteUrl: null,
  lastScannedAt: "2026-05-13T00:00:00.000Z",
  error: null,
  ...overrides,
});

describe("dashboard utils", () => {
  it("summarizes total clean modified and error repositories", () => {
    const summary = summarizeRepositories([
      baseRepo({ name: "clean" }),
      baseRepo({ name: "modified", isClean: false, modifiedCount: 2 }),
      baseRepo({ name: "behind", behind: 3, hasUpstream: true }),
      baseRepo({ name: "error", isClean: false, error: "git failed" }),
    ]);

    expect(summary).toEqual({ total: 4, clean: 1, modified: 1, behind: 1, errors: 1 });
  });

  it("filters repositories by name path and branch", () => {
    const repositories = [
      baseRepo({ name: "api", path: "/code/services/api", currentBranch: "main" }),
      baseRepo({
        name: "web",
        path: "/code/apps/web",
        currentBranch: "feature/dashboard",
        remoteUrl: "git@example.com:web.git",
      }),
    ];

    expect(filterRepositories(repositories, "services")).toHaveLength(1);
    expect(filterRepositories(repositories, "feature")).toEqual([repositories[1]]);
    expect(filterRepositories(repositories, "example.com")).toEqual([repositories[1]]);
    expect(filterRepositories(repositories, "")).toEqual(repositories);
  });

  it("filters repositories by v0.2 status filters", () => {
    const clean = baseRepo({ name: "clean" });
    const modified = baseRepo({ name: "modified", isClean: false, modifiedCount: 1 });
    const ahead = baseRepo({ name: "ahead", ahead: 2, hasUpstream: true });
    const behind = baseRepo({ name: "behind", behind: 1, hasUpstream: true });
    const error = baseRepo({ name: "error", error: "failed" });
    const repositories = [clean, modified, ahead, behind, error];

    expect(filterRepositoriesByStatus(repositories, "all")).toEqual(repositories);
    expect(filterRepositoriesByStatus(repositories, "clean")).toEqual([clean]);
    expect(filterRepositoriesByStatus(repositories, "modified")).toEqual([modified]);
    expect(filterRepositoriesByStatus(repositories, "ahead")).toEqual([ahead]);
    expect(filterRepositoriesByStatus(repositories, "behind")).toEqual([behind]);
    expect(filterRepositoriesByStatus(repositories, "error")).toEqual([error]);
  });

  it("enables the bulk toolbar only when repositories are selected", () => {
    expect(isBulkToolbarEnabled(new Set())).toBe(false);
    expect(isBulkToolbarEnabled(new Set(["/workspace/repo"]))).toBe(true);
  });

  it("uses status priority error behind ahead modified clean", () => {
    expect(deriveRepositoryStatus(baseRepo({ error: "failed" }))).toBe("error");
    expect(deriveRepositoryStatus(baseRepo({ behind: 1, hasUpstream: true }))).toBe("behind");
    expect(deriveRepositoryStatus(baseRepo({ ahead: 1, hasUpstream: true }))).toBe("ahead");
    expect(deriveRepositoryStatus(baseRepo({ isClean: false, modifiedCount: 1 }))).toBe("modified");
    expect(deriveRepositoryStatus(baseRepo({ isClean: true }))).toBe("clean");
  });

  it("builds bulk progress from per-repository statuses", () => {
    const progress = buildBulkProgress(
      [
        baseRepo({ path: "/repo/a" }),
        baseRepo({ path: "/repo/b" }),
        baseRepo({ path: "/repo/c" }),
      ],
      {
        "/repo/a:pull": "success",
        "/repo/b:pull": "failed",
        "/repo/c:pull": "running",
      },
      "pull",
    );

    expect(progress.completed).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.failed.map((item) => item.repository.path)).toEqual(["/repo/b"]);
  });

  it("formats activity items and recognizes command palette shortcut", () => {
    expect(
      formatActivityItem({
        id: "1",
        repositoryName: "repo-pilot",
        repositoryPath: "/tmp/repo-pilot",
        actionType: "pull",
        status: "success",
        message: "Pulled successfully",
        createdAt: String(Math.floor(Date.now() / 1000) - 60),
      }),
    ).toContain("Pulled successfully");

    expect(shouldShowCommandPalette({ key: "k", metaKey: true, ctrlKey: false })).toBe(true);
    expect(shouldShowCommandPalette({ key: "k", metaKey: false, ctrlKey: true })).toBe(true);
    expect(shouldShowCommandPalette({ key: "j", metaKey: true, ctrlKey: false })).toBe(false);
  });
});
