import { Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatActivityItem } from "@/features/dashboard/dashboard-utils";
import type { ActivityItem } from "@/types/repository";

type ActivityPanelProps = {
  activities: ActivityItem[];
  onClear: () => void;
};

export function ActivityPanel({ activities, onClear }: ActivityPanelProps) {
  return (
    <Card className="min-h-[320px]">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4" />
          Recent Activity
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={onClear} disabled={activities.length === 0} aria-label="Clear activity">
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No recent actions yet.
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-3">
              {activities.slice(0, 20).map((activity) => (
                <div key={activity.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{activity.repositoryName || "Workspace"}</span>
                    <Badge
                      variant={
                        activity.status === "success"
                          ? "clean"
                          : activity.status === "failed"
                            ? "error"
                            : activity.status === "running"
                              ? "default"
                              : "muted"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatActivityItem(activity)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
