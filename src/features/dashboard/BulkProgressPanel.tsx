import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildBulkProgress } from "@/features/dashboard/dashboard-utils";
import type { GitActionStatus, RepoAction, RepositoryStatus } from "@/types/repository";

type BulkProgressPanelProps = {
  action: RepoAction | null;
  actionStatuses: Record<string, GitActionStatus>;
  repositories: RepositoryStatus[];
};

export function BulkProgressPanel({ action, actionStatuses, repositories }: BulkProgressPanelProps) {
  if (!action || repositories.length === 0) {
    return null;
  }

  const progress = buildBulkProgress(repositories, actionStatuses, action);
  const percent = progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);

  return (
    <Card className="border-blue-400/20 bg-blue-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="capitalize">{action.replace("_", " ")} repositories...</span>
          <span className="text-sm font-normal text-muted-foreground">
            {progress.completed} / {progress.total} completed
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percent} />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {progress.items.map((item) => (
            <div key={item.repository.path} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
              <span className="truncate text-sm">{item.repository.name}</span>
              <BulkStatusBadge status={item.status} />
            </div>
          ))}
        </div>
        {progress.failed.length > 0 ? (
          <div className="flex items-center gap-2 text-sm text-red-200">
            <AlertTriangle className="size-4" />
            {progress.failed.length} repositories failed. Open recent activity for details.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BulkStatusBadge({ status }: { status: GitActionStatus }) {
  if (status === "running") {
    return (
      <Badge variant="default">
        <Loader2 className="mr-1 size-3 animate-spin" />
        Running
      </Badge>
    );
  }

  if (status === "success") {
    return (
      <Badge variant="clean">
        <CheckCircle2 className="mr-1 size-3" />
        Success
      </Badge>
    );
  }

  if (status === "failed") {
    return <Badge variant="error">Failed</Badge>;
  }

  if (status === "skipped") {
    return <Badge variant="muted">Skipped</Badge>;
  }

  return <Badge variant="muted">Pending</Badge>;
}
