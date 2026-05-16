import type { ReactNode } from "react";
import { FolderGit2, Gauge, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type AppShellProps = {
  activeView: "dashboard" | "settings";
  children: ReactNode;
  onNavigate: (view: "dashboard" | "settings") => void;
  workspacePath?: string;
};

const navItems = [
  { id: "dashboard" as const, label: "Dashboard", icon: Gauge },
  { id: "settings" as const, label: "Settings", icon: Settings },
];

export function AppShell({ activeView, children, onNavigate, workspacePath }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#070b12] text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-[#090f1a] p-4 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FolderGit2 className="size-5" />
          </div>
          <div>
            <div className="text-base font-semibold">RepoPilot</div>
            <div className="text-xs text-muted-foreground">Git workspace control</div>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const selected = activeView === item.id;
            return (
              <Button
                key={item.id}
                className={cn("w-full justify-start", selected && "bg-secondary text-foreground")}
                variant="ghost"
                onClick={() => onNavigate(item.id)}
              >
                <Icon />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <Separator className="my-5" />

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-xs font-medium uppercase text-muted-foreground">Workspace</div>
          <div className="mt-2 break-all text-sm text-foreground">{workspacePath || "No workspace selected"}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-[#090f1a]/95 px-4 lg:hidden">
          <div className="flex items-center gap-2 font-semibold">
            <FolderGit2 className="size-5 text-primary" />
            RepoPilot
          </div>
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.id} variant="ghost" size="icon" onClick={() => onNavigate(item.id)}>
                  <Icon />
                </Button>
              );
            })}
          </div>
        </header>
        <ScrollArea className="h-[calc(100vh-56px)] lg:h-screen">
          <main className="flex w-full min-w-0 flex-col gap-5 p-4 md:p-6">{children}</main>
        </ScrollArea>
      </div>
    </div>
  );
}
