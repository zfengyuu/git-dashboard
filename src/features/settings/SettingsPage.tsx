import { FolderOpen, Monitor, Moon, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/stores/app-store";

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control workspace defaults and local tool commands.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={settings.theme === "dark" ? "default" : "outline"}
              onClick={() => updateSettings({ theme: "dark" })}
            >
              <Moon />
              Dark
            </Button>
            <Button
              variant={settings.theme === "system" ? "default" : "outline"}
              onClick={() => updateSettings({ theme: "system" })}
            >
              <Monitor />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <FolderOpen className="size-4" />
              Default workspace
            </span>
            <Input
              value={settings.defaultWorkspace}
              placeholder="/Users/user/workspace"
              onChange={(event) => updateSettings({ defaultWorkspace: event.target.value })}
            />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={settings.autoRefreshOnStart}
              onCheckedChange={(checked) => updateSettings({ autoRefreshOnStart: checked === true })}
            />
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4 text-muted-foreground" />
              Auto refresh on start
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">VS Code command path</span>
            <Input
              value={settings.vsCodeCommand}
              placeholder="code"
              onChange={(event) => updateSettings({ vsCodeCommand: event.target.value })}
            />
          </label>
          <Separator />
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Terminal className="size-4" />
              Terminal command path
            </span>
            <Input
              value={settings.terminalCommand}
              placeholder="Leave empty for system default"
              onChange={(event) => updateSettings({ terminalCommand: event.target.value })}
            />
          </label>
        </CardContent>
      </Card>
    </section>
  );
}
