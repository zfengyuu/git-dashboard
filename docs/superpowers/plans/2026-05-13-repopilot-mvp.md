# RepoPilot MVP Local-State Build Plan

## Summary
Build RepoPilot as a fresh Tauri v2 + React + TypeScript + Vite desktop app in `/Users/phongvudzz/Documents/Git Dashboard`, using `/Users/phongvudzz/Downloads/repo-pilot-mvp-build-spec.md` as the source spec.

Chosen defaults:
- UI: simplified dark, table-first dashboard based on `/Users/phongvudzz/.codex/generated_images/019e2228-4138-7262-a005-09abbf9b6028/ig_0c49d689e6cee8bb016a04a818ad5c81918adc73fb856eb584.png`
- Persistence: local app state first with Zustand persist/localStorage; defer SQLite tables to a later iteration.
- Runtime: install Rust first because `cargo` and `rustc` are not currently available.
- Package manager: `pnpm`.

## Key Changes
- Scaffold the empty workspace into a Tauri app with React, TypeScript, Vite, Tailwind, shadcn-style UI primitives, Lucide React, TanStack Query, Zustand, Sonner, Vitest, and Testing Library.
- Implement Rust scanner, git status/action helpers, and Tauri commands for scanning, refreshing, fetch, pull, push, VS Code, and terminal actions.
- Implement the dashboard, repository detail page, settings page, local state persistence, loading/empty/error states, and action status toasts.

## Public Interfaces
- Frontend types: `RepositoryStatus`, `Workspace`, `GitActionStatus`, `GitAction`, `GitActionResult`, plus derived UI statuses `clean`, `modified`, `untracked`, `staged`, `error`.
- Tauri commands: `scan_workspace`, `refresh_repository`, `refresh_repositories`, `fetch_repository`, `pull_repository`, `push_repository`, `open_in_vscode`, `open_in_terminal`.
- SQLite is intentionally deferred; Zustand/localStorage stores current workspace, settings, search, selection, and last scanned repositories.

## Test Plan
- Rust scanner/status tests for ignored folders, status parsing, no-remote refresh, and structured action failures.
- Frontend tests for summaries, filtering, bulk toolbar enabling, and status badge priority.
- Manual acceptance through `pnpm tauri dev` with workspace selection, scan, refresh, fetch/pull/push, bulk actions, VS Code, terminal, empty/loading/error states, and visual comparison against the accepted concept.

## Assumptions
- Current workspace starts empty and is not a Git repo.
- Local environment has Node `v24.15.0`, pnpm `10.28.0`, Git `2.50.1`, SQLite `3.51.0`, Xcode Command Line Tools, and Rust installed by the implementation.
