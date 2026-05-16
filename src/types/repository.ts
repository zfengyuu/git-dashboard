export type RepositoryStatus = {
  name: string;
  path: string;
  currentBranch: string;
  isClean: boolean;
  modifiedCount: number;
  stagedCount: number;
  untrackedCount: number;
  ahead: number;
  behind: number;
  hasUpstream: boolean;
  status?: RepositoryUiStatus;
  lastCommitHash?: string | null;
  lastCommitMessage?: string | null;
  lastCommitAuthor?: string | null;
  lastCommitTime?: string | null;
  remoteUrl?: string | null;
  lastScannedAt: string;
  error?: string | null;
  errorMessage?: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type GitActionStatus = "pending" | "running" | "success" | "failed" | "skipped";
export type RepoAction = "refresh" | "fetch" | "pull" | "push" | "open_vscode" | "open_terminal";

export type GitAction = {
  id: string;
  repositoryId: string;
  actionType: RepoAction;
  status: GitActionStatus;
  message?: string;
  createdAt: string;
};

export type GitActionResult = {
  status: GitActionStatus;
  message: string;
};

export type RepositoryUiStatus = "clean" | "modified" | "ahead" | "behind" | "error";
export type RepositoryV02Status = "clean" | "modified" | "ahead" | "behind" | "error";
export type RepositoryFilter = "all" | RepositoryV02Status;

export type RepositorySummary = {
  total: number;
  clean: number;
  modified: number;
  behind: number;
  errors: number;
};

export type ActivityInput = {
  repositoryName?: string | null;
  repositoryPath?: string | null;
  actionType: GitAction["actionType"] | "workspace_scan";
  status: GitActionStatus;
  message: string;
};

export type ActivityItem = ActivityInput & {
  id: string;
  createdAt: string;
};

export type BulkProgressItem = {
  repository: RepositoryStatus;
  status: GitActionStatus;
};

export type BulkProgress = {
  total: number;
  completed: number;
  running: BulkProgressItem[];
  failed: BulkProgressItem[];
  items: BulkProgressItem[];
};
