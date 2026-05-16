# RepoPilot

RepoPilot is a Tauri v2 desktop application for scanning local workspaces, monitoring multiple Git repositories, and running common Git actions from a focused dashboard.

It is designed for developers who work with many repositories at the same time and want a faster way to check repository status, sync changes, open projects, and review recent Git activity without switching between multiple terminal windows.

![RepoPilot dashboard](docs/screenshots/dashboard.png)

## Overview

RepoPilot helps you manage local Git repositories from one desktop interface.

The app can scan a selected workspace folder, detect nested Git repositories, show their current Git state, and provide quick actions such as refresh, fetch, pull, push, open in VS Code, and open in Terminal.

It also includes bulk actions, search, filters, a command palette, and local activity history powered by SQLite through the Tauri backend.

## Key Features

- Scan a local workspace and detect nested Git repositories.
- Automatically skip heavy generated folders such as `node_modules`, `dist`, `build`, `.next`, `.cache`, `target`, and `vendor`.
- View repository branch, working tree status, ahead/behind state, changed file counts, last commit, and remote URL.
- Run common Git actions directly from the dashboard.
- Perform bulk refresh, fetch, and pull for selected repositories.
- Search repositories by name, path, branch, or remote URL.
- Filter repositories by status: `All`, `Clean`, `Modified`, `Ahead`, `Behind`, and `Error`.
- Open repositories directly in VS Code or Terminal.
- Use a command palette with `Cmd+K` on macOS or `Ctrl+K` on Windows/Linux.
- Store workspace, repositories, filters, search, settings, and selection in local Zustand state.
- Store recent action history in local SQLite through the Rust backend.

## Important Deployment Note

RepoPilot is primarily a native desktop application.

The Tauri backend is required for native capabilities such as:

- Scanning real local folders.
- Running Git CLI commands.
- Writing SQLite activity history through Rust.
- Opening local projects in VS Code or Terminal.

Vercel can only deploy the Vite/React browser preview. In the browser preview, RepoPilot runs with fallback behavior and sample data. It cannot access the visitor's filesystem or execute native Git commands.

Use Vercel for UI review only. Use `pnpm tauri dev` or a packaged desktop build for real RepoPilot behavior.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Desktop runtime | Tauri v2 |
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn-style local UI primitives |
| State management | Zustand |
| Notifications | Sonner |
| Icons | Lucide React |
| Backend | Rust |
| Local database | SQLite via `rusqlite` |
| Testing | Vitest, Cargo tests |

## Prerequisites

Install these before running the project locally:

- Node.js 24 or newer
- pnpm 10 or newer
- Rust stable with `cargo`
- Git
- Xcode Command Line Tools on macOS

Check your local environment:

```bash
node --version
pnpm --version
rustc --version
cargo --version
git --version
```

If Rust is missing, install it with:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version
cargo --version
```

## Local Setup

From the project root:

```bash
cd "/Users/phongvudzz/Documents/Git Dashboard"
pnpm install
```

## Run as a Desktop App

This is the main development mode for testing real RepoPilot behavior.

```bash
pnpm tauri dev
```

Suggested test flow:

1. Click `Select Workspace`.
2. Choose a folder that contains one or more Git repositories.
3. Confirm repositories appear in the dashboard table.
4. Search by repository name, path, branch, or remote URL.
5. Try filters: `All`, `Clean`, `Modified`, `Ahead`, `Behind`, and `Error`.
6. Select one or more repositories.
7. Run `Refresh Selected`, `Fetch Selected`, or `Pull Selected`.
8. Open a row menu and test:
   - `View Details`
   - `Refresh`
   - `Fetch`
   - `Pull`
   - `Push`
   - `Open in VS Code`
   - `Open in Terminal`
9. Press `Cmd+K` or `Ctrl+K` and test the command palette.
10. Confirm recent actions appear in the activity panel.

## Run as a Browser Preview

This mode is useful for UI checks only. It uses browser fallback behavior and sample repositories.

```bash
pnpm dev
```

Open:

```txt
http://127.0.0.1:1420/
```

Browser preview limitations:

- Cannot scan real local folders.
- Cannot run real Git commands.
- Cannot open local VS Code or Terminal through Tauri.
- Cannot use the native SQLite backend.

## Test and Build

Run all standard checks from the project root:

```bash
pnpm test
pnpm lint
pnpm build
cd src-tauri
cargo test
cd ..
pnpm tauri build
```

Expected successful output:

- `pnpm test`: all Vitest tests pass.
- `pnpm lint`: no ESLint errors.
- `pnpm build`: Vite production build succeeds.
- `cargo test`: Rust tests pass.
- `pnpm tauri build`: desktop app and installer artifacts are created.

Build artifacts:

```txt
src-tauri/target/release/bundle/macos/RepoPilot.app
src-tauri/target/release/bundle/dmg/RepoPilot_0.2.0_aarch64.dmg
```

## GitHub Push Steps

If this folder is not already a Git repository:

```bash
cd "/Users/phongvudzz/Documents/Git Dashboard"
git init
git branch -M main
git add .
git commit -m "Build RepoPilot v0.2"
```

Create a GitHub repository and push:

```bash
gh auth login
gh repo create repopilot --private --source=. --remote=origin --push
```

If you already created the repository on GitHub:

```bash
git remote add origin git@github.com:<your-github-username>/repopilot.git
git push -u origin main
```

Replace `<your-github-username>` with your GitHub username.

## Vercel Deployment

Vercel deploys the browser preview only.

Install or run the Vercel CLI:

```bash
pnpm dlx vercel@latest login
```

Deploy a preview:

```bash
pnpm dlx vercel@latest
```

Deploy production:

```bash
pnpm dlx vercel@latest --prod
```

Recommended Vercel settings:

```txt
Framework Preset: Vite
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
Output Directory: dist
```

These settings are also stored in `vercel.json`.

## Vercel Git Integration

After GitHub is connected to Vercel:

1. Open the Vercel dashboard.
2. Import the GitHub repository.
3. Select `Vite` as the framework.
4. Keep the build settings from `vercel.json`.
5. Deploy.
6. Every push to `main` can create a production deployment if the Vercel project is configured that way.
7. Pull requests and non-production branches create preview deployments.

## Project Structure

```txt
.
├── docs/
│   └── superpowers/plans/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── stores/
│   └── types/
├── src-tauri/
│   └── src/
│       ├── commands.rs
│       ├── database.rs
│       ├── git.rs
│       ├── lib.rs
│       ├── models.rs
│       └── scanner.rs
├── package.json
├── pnpm-lock.yaml
├── vercel.json
└── vite.config.ts
```

## Native Command Surface

The Tauri backend exposes the following commands:

| Command | Purpose |
| --- | --- |
| `scan_workspace(path)` | Scan a workspace folder and detect Git repositories. |
| `refresh_repository(repoPath)` | Refresh one repository status. |
| `refresh_repositories(repoPaths)` | Refresh multiple repositories. |
| `fetch_repository(repoPath)` | Run fetch for one repository. |
| `pull_repository(repoPath)` | Run pull for one repository. |
| `push_repository(repoPath)` | Run push for one repository. |
| `open_in_vscode(repoPath, command)` | Open a repository in VS Code. |
| `open_in_terminal(repoPath, command)` | Open a repository in Terminal. |
| `get_recent_activity(limit)` | Read recent local activity history. |
| `record_activity(input)` | Save an activity record. |
| `clear_recent_activity()` | Clear recent activity history. |

## Troubleshooting

### `pnpm tauri dev` fails because Rust is missing

Run:

```bash
source "$HOME/.cargo/env"
rustup update
```

Then check again:

```bash
rustc --version
cargo --version
```

### The app opens but no repositories appear

Check the following:

1. Make sure the selected workspace contains folders with `.git`.
2. Make sure those repositories are not inside ignored folders such as `node_modules`, `dist`, `build`, `.next`, `.cache`, `target`, or `vendor`.
3. Try selecting a smaller workspace folder first.

### Git actions fail

Check the repository manually:

```bash
git status
git fetch
git pull
```

Then fix any authentication, conflict, upstream, or remote issues before retrying in RepoPilot.

### Vercel deploy works but native features do not

This is expected. Vercel is browser-only for this project. Run the desktop app with:

```bash
pnpm tauri dev
```

## Product Direction

RepoPilot aims to become a focused desktop workspace manager for developers working across multiple Git repositories.

Future improvements may include:

- Repository grouping.
- Custom workspace profiles.
- Branch switching.
- Commit and stash workflows.
- Conflict visibility.
- Smarter repository health indicators.
- More detailed activity reports.

## Status

RepoPilot is currently in active desktop MVP development.

The current version focuses on workspace scanning, repository status monitoring, common Git actions, bulk operations, command palette support, and local activity history.

## License

Add your license here.

# git-dashboard
