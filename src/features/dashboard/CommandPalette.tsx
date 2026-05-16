import { Code2, FolderOpen, GitPullRequestArrow, RefreshCw, Search, Settings, Terminal } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { RepoAction, RepositoryStatus } from "@/types/repository";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRepoAction: (repository: RepositoryStatus, action: RepoAction) => void;
  onBulkAction: (action: "fetch" | "pull") => void;
  onOpenSettings: () => void;
  onRefreshAll: () => void;
  onSearchFocus: () => void;
  onSelectWorkspace: () => void;
  repositories: RepositoryStatus[];
  selectedRepositories: RepositoryStatus[];
};

export function CommandPalette({
  open,
  onOpenChange,
  onRepoAction,
  onBulkAction,
  onOpenSettings,
  onRefreshAll,
  onSearchFocus,
  onSelectWorkspace,
  repositories,
  selectedRepositories,
}: CommandPaletteProps) {
  const actionTargets = selectedRepositories.length > 0 ? selectedRepositories : repositories;

  const run = (callback: () => void) => {
    callback();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">Search repositories and run RepoPilot actions.</DialogDescription>
        <Command>
          <CommandInput placeholder="Run a command or search repositories..." />
          <CommandList>
            <CommandEmpty>No command found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => run(onSearchFocus)}>
                <Search className="size-4" />
                Search repositories
              </CommandItem>
              <CommandItem onSelect={() => run(onSelectWorkspace)}>
                <FolderOpen className="size-4" />
                Select workspace
              </CommandItem>
              <CommandItem onSelect={() => run(onOpenSettings)}>
                <Settings className="size-4" />
                Open settings
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Bulk actions">
              <CommandItem onSelect={() => run(onRefreshAll)}>
                <RefreshCw className="size-4" />
                Refresh all repositories
              </CommandItem>
              <CommandItem onSelect={() => run(() => onBulkAction("fetch"))}>
                <GitPullRequestArrow className="size-4" />
                Fetch selected repositories
              </CommandItem>
              <CommandItem onSelect={() => run(() => onBulkAction("pull"))}>
                <GitPullRequestArrow className="size-4" />
                Pull selected repositories
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Repository actions">
              {actionTargets.slice(0, 20).map((repository) => (
                <CommandItem key={`${repository.path}:vscode`} onSelect={() => run(() => onRepoAction(repository, "open_vscode"))}>
                  <Code2 className="size-4" />
                  Open {repository.name} in VS Code
                </CommandItem>
              ))}
              {actionTargets.slice(0, 20).map((repository) => (
                <CommandItem key={`${repository.path}:terminal`} onSelect={() => run(() => onRepoAction(repository, "open_terminal"))}>
                  <Terminal className="size-4" />
                  Open {repository.name} in terminal
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
