import { Code2, Download, GitBranch, GitCommitHorizontal, RefreshCw, Terminal, Upload } from "lucide-react";
import type { ReactNode } from "react";
import type { RepoAction } from "@/types/repository";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { deriveRepositoryStatus, syncLabel } from "@/features/dashboard/dashboard-utils";
import type { GitActionStatus, RepositoryStatus } from "@/types/repository";

type RepositoryDetailDrawerProps = {
  actionStatuses: Record<string, GitActionStatus>;
  onAction: (repository: RepositoryStatus, action: RepoAction) => void;
  onOpenChange: (open: boolean) => void;
  repository: RepositoryStatus | null;
};

export function RepositoryDetailDrawer({ actionStatuses, onAction, onOpenChange, repository }: RepositoryDetailDrawerProps) {
  const open = Boolean(repository);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        {repository ? (
          <>
            <SheetHeader>
              <SheetTitle>{repository.name}</SheetTitle>
              <SheetDescription className="break-all">{repository.path}</SheetDescription>
            </SheetHeader>

            {repository.error || repository.errorMessage ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Repository error</AlertTitle>
                <AlertDescription>{repository.errorMessage || repository.error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <StatusMetric label="Working tree" value={deriveRepositoryStatus(repository)} />
                <StatusMetric label="Sync" value={syncLabel(repository)} />
                <StatusMetric label="Changed files" value={String(totalChanges(repository))} />
                <StatusMetric label="Last scan" value={formatScanTime(repository.lastScannedAt)} />
              </div>

              <Separator />

              <div className="space-y-4">
                <DetailRow label="Current Branch" value={repository.currentBranch || "Unknown"} icon={<GitBranch className="size-4" />} />
                <DetailRow label="Remote URL" value={repository.remoteUrl || "No origin remote"} />
                <DetailRow
                  label="Last Commit"
                  value={repository.lastCommitMessage || "No commits"}
                  icon={<GitCommitHorizontal className="size-4" />}
                />
                <DetailRow label="Commit Time" value={repository.lastCommitTime || "Unknown"} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <ActionButton
                  label="Refresh"
                  running={actionStatuses[`${repository.path}:refresh`] === "running"}
                  onClick={() => onAction(repository, "refresh")}
                  icon={<RefreshCw />}
                />
                <ActionButton label="Fetch" onClick={() => onAction(repository, "fetch")} icon={<Download />} />
                <ActionButton label="Pull" onClick={() => onAction(repository, "pull")} icon={<Download />} />
                <ActionButton label="Push" onClick={() => onAction(repository, "push")} icon={<Upload />} />
                <ActionButton label="VS Code" onClick={() => onAction(repository, "open_vscode")} icon={<Code2 />} />
                <ActionButton label="Terminal" onClick={() => onAction(repository, "open_terminal")} icon={<Terminal />} />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 break-all text-sm text-foreground">
        {icon}
        {value}
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  running = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  running?: boolean;
}) {
  return (
    <Button variant="outline" onClick={onClick}>
      <span className={running ? "animate-spin" : ""}>{icon}</span>
      {label}
    </Button>
  );
}

function totalChanges(repository: RepositoryStatus) {
  return repository.modifiedCount + repository.stagedCount + repository.untrackedCount;
}

function formatScanTime(value: string) {
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : date.toLocaleString();
}
