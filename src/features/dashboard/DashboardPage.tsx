import {
  Code2,
  Download,
  FolderOpen,
  GitBranch,
  GitCommitHorizontal,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Terminal,
  Upload,
} from "lucide-react";
import { ActivityPanel } from "@/features/dashboard/ActivityPanel";
import { BulkProgressPanel } from "@/features/dashboard/BulkProgressPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ActivityItem,
  GitActionStatus,
  RepoAction,
  RepositoryFilter,
  RepositoryStatus,
  RepositoryUiStatus,
  Workspace,
} from "@/types/repository";
import {
  deriveRepositoryStatus,
  filterRepositoriesByStatus,
  filterRepositories,
  isBulkToolbarEnabled,
  summarizeRepositories,
  syncLabel,
} from "./dashboard-utils";

type DashboardPageProps = {
  activities: ActivityItem[];
  actionStatuses: Record<string, GitActionStatus>;
  bulkAction: RepoAction | null;
  bulkRepositories: RepositoryStatus[];
  clearSelection: () => void;
  isScanning: boolean;
  onBulkAction: (action: "refresh" | "fetch" | "pull") => void;
  onClearActivity: () => void;
  onOpenRepository: (path: string) => void;
  onRefreshWorkspace: () => void;
  onRepoAction: (repository: RepositoryStatus, action: RepoAction) => void;
  onSearchChange: (query: string) => void;
  onSelectWorkspace: () => void;
  onStatusFilterChange: (filter: RepositoryFilter) => void;
  repositories: RepositoryStatus[];
  scanError: string | null;
  searchQuery: string;
  selectedPaths: string[];
  setSelectedPaths: (paths: string[]) => void;
  statusFilter: RepositoryFilter;
  toggleSelectedPath: (path: string) => void;
  workspace: Workspace | null;
};

const statusCopy: Record<RepositoryUiStatus, string> = {
  clean: "Clean",
  modified: "Modified",
  ahead: "Ahead",
  behind: "Behind",
  error: "Error",
};

const statusVariant: Record<RepositoryUiStatus, "default" | "clean" | "modified" | "error" | "muted"> = {
  clean: "clean",
  modified: "modified",
  ahead: "default",
  behind: "modified",
  error: "error",
};

const filters: { value: RepositoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "clean", label: "Clean" },
  { value: "modified", label: "Modified" },
  { value: "ahead", label: "Ahead" },
  { value: "behind", label: "Behind" },
  { value: "error", label: "Error" },
];

export function DashboardPage({
  activities,
  actionStatuses,
  bulkAction,
  bulkRepositories,
  clearSelection,
  isScanning,
  onBulkAction,
  onClearActivity,
  onOpenRepository,
  onRefreshWorkspace,
  onRepoAction,
  onSearchChange,
  onSelectWorkspace,
  onStatusFilterChange,
  repositories,
  scanError,
  searchQuery,
  selectedPaths,
  setSelectedPaths,
  statusFilter,
  toggleSelectedPath,
  workspace,
}: DashboardPageProps) {
  const searchedRepositories = filterRepositories(repositories, searchQuery);
  const filteredRepositories = filterRepositoriesByStatus(searchedRepositories, statusFilter);
  const summary = summarizeRepositories(repositories);
  const selectedSet = new Set(selectedPaths);
  const allVisibleSelected =
    filteredRepositories.length > 0 && filteredRepositories.every((repository) => selectedSet.has(repository.path));
  const bulkEnabled = isBulkToolbarEnabled(selectedSet);

  return (
    <TooltipProvider>
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground">Repository Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {workspace ? workspace.path : "Select a workspace folder to scan local Git repositories."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={onSelectWorkspace}>
              <FolderOpen />
              Select Workspace
            </Button>
            <Button onClick={onRefreshWorkspace} disabled={isScanning}>
              <RefreshCw className={cn(isScanning && "animate-spin")} />
              {isScanning ? "Scanning" : "Refresh Workspace"}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <SummaryCard label="Total Repositories" value={summary.total} tone="blue" />
          <SummaryCard label="Clean" value={summary.clean} tone="green" />
          <SummaryCard label="Modified" value={summary.modified} tone="amber" />
          <SummaryCard label="Behind" value={summary.behind} tone="amber" />
          <SummaryCard label="Errors" value={summary.errors} tone="red" />
        </div>

        <BulkProgressPanel action={bulkAction} actionStatuses={actionStatuses} repositories={bulkRepositories} />

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative min-w-0 flex-1 xl:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    data-repopilot-search
                    className="pl-9 pr-20"
                    placeholder="Search repositories, paths, branches"
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                  />
                  {searchQuery ? (
                    <Button
                      className="absolute right-1 top-1/2 h-7 -translate-y-1/2 px-2 text-xs"
                      size="sm"
                      variant="ghost"
                      onClick={() => onSearchChange("")}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!bulkEnabled} onClick={() => onBulkAction("refresh")}>
                    <RefreshCw />
                    <span className="hidden sm:inline">Refresh Selected</span>
                  </Button>
                  <Button variant="outline" size="sm" disabled={!bulkEnabled} onClick={() => onBulkAction("fetch")}>
                    <Download />
                    <span className="hidden sm:inline">Fetch Selected</span>
                  </Button>
                  <Button variant="outline" size="sm" disabled={!bulkEnabled} onClick={() => onBulkAction("pull")}>
                    <Play />
                    <span className="hidden sm:inline">Pull Selected</span>
                  </Button>
                  {bulkEnabled ? (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear {selectedPaths.length}
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <Button
                      key={filter.value}
                      size="sm"
                      variant={statusFilter === filter.value ? "default" : "outline"}
                      onClick={() => onStatusFilterChange(filter.value)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredRepositories.length} of {repositories.length} repositories
                </div>
              </div>
            </div>

            {scanError ? (
              <div className="border-b border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{scanError}</div>
            ) : null}

            {isScanning && repositories.length === 0 ? (
              <LoadingRows />
            ) : filteredRepositories.length === 0 ? (
              <EmptyState hasWorkspace={Boolean(workspace)} onSelectWorkspace={onSelectWorkspace} />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[1040px] table-fixed">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allVisibleSelected}
                          onCheckedChange={(checked) =>
                            setSelectedPaths(checked ? filteredRepositories.map((repository) => repository.path) : [])
                          }
                          aria-label="Select all repositories"
                        />
                      </TableHead>
                      <TableHead className="w-[27%]">Repository</TableHead>
                      <TableHead className="w-[13%]">Branch</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[14%]">Sync</TableHead>
                      <TableHead className="w-[8%]">Changes</TableHead>
                      <TableHead className="w-[20%]">Last Commit</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepositories.map((repository) => (
                      <RepositoryRow
                        actionStatuses={actionStatuses}
                        key={repository.path}
                        onAction={onRepoAction}
                        onOpenRepository={onOpenRepository}
                        repository={repository}
                        selected={selectedSet.has(repository.path)}
                        toggleSelectedPath={toggleSelectedPath}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          <ActivityPanel activities={activities} onClear={onClearActivity} />
        </div>
      </section>
    </TooltipProvider>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "amber" | "red" }) {
  const toneClass = {
    blue: "text-blue-200 bg-blue-500/10 border-blue-400/20",
    green: "text-emerald-200 bg-emerald-500/10 border-emerald-400/20",
    amber: "text-amber-200 bg-amber-500/10 border-amber-400/20",
    red: "text-red-200 bg-red-500/10 border-red-400/20",
  }[tone];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("inline-flex min-w-16 rounded-md border px-3 py-2 text-2xl font-semibold", toneClass)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function RepositoryRow({
  actionStatuses,
  onAction,
  onOpenRepository,
  repository,
  selected,
  toggleSelectedPath,
}: {
  actionStatuses: Record<string, GitActionStatus>;
  onAction: (repository: RepositoryStatus, action: RepoAction) => void;
  onOpenRepository: (path: string) => void;
  repository: RepositoryStatus;
  selected: boolean;
  toggleSelectedPath: (path: string) => void;
}) {
  const status = deriveRepositoryStatus(repository);
  const running = ["refresh", "fetch", "pull", "push", "open_vscode", "open_terminal"].some(
    (action) => actionStatuses[`${repository.path}:${action}`] === "running",
  );

  return (
    <TableRow className={cn(selected && "bg-secondary/50", running && "bg-blue-500/5")}>
      <TableCell>
        <Checkbox checked={selected} onCheckedChange={() => toggleSelectedPath(repository.path)} aria-label={repository.name} />
      </TableCell>
      <TableCell>
        <button className="group flex min-w-0 max-w-full flex-col text-left" onClick={() => onOpenRepository(repository.path)}>
          <span className="flex items-center gap-2 font-medium text-foreground group-hover:text-blue-200">
            {repository.name}
          </span>
          <span className="truncate text-xs text-muted-foreground">{repository.path}</span>
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitBranch className="size-4" />
          {repository.currentBranch || "Unknown"}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={statusVariant[status]}>{statusCopy[status]}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={repository.hasUpstream ? (repository.behind > 0 ? "modified" : repository.ahead > 0 ? "default" : "clean") : "muted"}>
          {syncLabel(repository)}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {repository.modifiedCount + repository.stagedCount + repository.untrackedCount}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <GitCommitHorizontal className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm">{repository.lastCommitMessage || repository.error || "No commits"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`More actions for ${repository.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onOpenRepository(repository.path)}>
                <Search className="mr-2 size-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "refresh")}>
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "fetch")}>
                <Download className="mr-2 size-4" />
                Fetch
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "pull")}>
                <Play className="mr-2 size-4" />
                Pull
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "push")}>
                <Upload className="mr-2 size-4" />
                Push
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "open_vscode")}>
                <Code2 className="mr-2 size-4" />
                Open in VS Code
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onAction(repository, "open_terminal")}>
                <Terminal className="mr-2 size-4" />
                Open in Terminal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ hasWorkspace, onSelectWorkspace }: { hasWorkspace: boolean; onSelectWorkspace: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-secondary">
        <FolderOpen className="size-6 text-muted-foreground" />
      </div>
      <div>
        <div className="font-medium">{hasWorkspace ? "No repositories found" : "No workspace selected"}</div>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {hasWorkspace
            ? "This workspace did not contain Git repositories outside ignored build folders."
            : "Choose a folder and RepoPilot will scan for local Git repositories."}
        </p>
      </div>
      <Button onClick={onSelectWorkspace}>
        <FolderOpen />
        Select Workspace
      </Button>
    </div>
  );
}
