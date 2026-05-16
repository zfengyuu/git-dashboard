use crate::models::{GitActionResult, GitActionStatus, RepositoryStatus, StatusCounts, SyncStatus};
use std::path::Path;
use std::process::{Command, Output};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn parse_status_counts(status: &str) -> StatusCounts {
    status.lines().fold(
        StatusCounts {
            modified_count: 0,
            staged_count: 0,
            untracked_count: 0,
        },
        |mut counts, line| {
            if line.starts_with("??") {
                counts.untracked_count += 1;
                return counts;
            }

            let mut chars = line.chars();
            let index_status = chars.next().unwrap_or(' ');
            let worktree_status = chars.next().unwrap_or(' ');

            if index_status != ' ' {
                counts.staged_count += 1;
            }

            if worktree_status != ' ' {
                counts.modified_count += 1;
            }

            counts
        },
    )
}

pub fn parse_sync_status(status: &str) -> Result<SyncStatus, String> {
    let mut parts = status.split_whitespace();
    let ahead = parts
        .next()
        .ok_or_else(|| "Missing ahead count".to_string())?
        .parse::<usize>()
        .map_err(|error| format!("Invalid ahead count: {error}"))?;
    let behind = parts
        .next()
        .ok_or_else(|| "Missing behind count".to_string())?
        .parse::<usize>()
        .map_err(|error| format!("Invalid behind count: {error}"))?;

    Ok(SyncStatus {
        ahead,
        behind,
        has_upstream: true,
    })
}

pub fn refresh_repository(repo_path: &str) -> Result<RepositoryStatus, String> {
    let path = Path::new(repo_path);
    let status_output = run_git_output(repo_path, &["status", "--porcelain"])?;
    let branch = run_git_output(repo_path, &["branch", "--show-current"])
        .ok()
        .filter(|branch| !branch.is_empty())
        .unwrap_or_else(|| "DETACHED".to_string());
    let last_commit = run_git_output(repo_path, &["log", "-1", "--pretty=format:%h|%s|%an|%ar"]).ok();
    let remote_url = run_git_output(repo_path, &["remote", "get-url", "origin"])
        .ok()
        .filter(|remote| !remote.is_empty());
    let sync_status = sync_status(repo_path);

    let counts = parse_status_counts(&status_output);
    let is_clean = counts.modified_count == 0 && counts.staged_count == 0 && counts.untracked_count == 0;
    let (last_commit_hash, last_commit_message, last_commit_author, last_commit_time) =
        parse_last_commit(last_commit.as_deref());

    Ok(RepositoryStatus {
        name: repository_name(path),
        path: repo_path.to_string(),
        current_branch: branch,
        is_clean,
        modified_count: counts.modified_count,
        staged_count: counts.staged_count,
        untracked_count: counts.untracked_count,
        ahead: sync_status.ahead,
        behind: sync_status.behind,
        has_upstream: sync_status.has_upstream,
        last_commit_hash,
        last_commit_message,
        last_commit_author,
        last_commit_time,
        remote_url,
        last_scanned_at: scan_timestamp(),
        error: None,
        error_message: None,
    })
}

pub fn fetch_repository(repo_path: &str) -> GitActionResult {
    run_git_action(repo_path, &["fetch"], "Fetch completed")
}

pub fn pull_repository(repo_path: &str) -> GitActionResult {
    run_git_action(repo_path, &["pull"], "Pull completed")
}

pub fn push_repository(repo_path: &str) -> GitActionResult {
    run_git_action(repo_path, &["push"], "Push completed")
}

pub fn open_in_vscode(repo_path: &str, command: Option<String>) -> GitActionResult {
    let executable = command
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "code".to_string());

    run_process(&executable, &[repo_path], "Opened in VS Code")
}

pub fn open_in_terminal(repo_path: &str, command: Option<String>) -> GitActionResult {
    if let Some(executable) = command.filter(|value| !value.trim().is_empty()) {
        return run_process(&executable, &[repo_path], "Opened in terminal");
    }

    match std::env::consts::OS {
        "macos" => run_process("open", &["-a", "Terminal", repo_path], "Opened in Terminal"),
        "windows" => run_process("cmd", &["/C", "start", "cmd", "/K", "cd", "/d", repo_path], "Opened in terminal"),
        _ => run_process("x-terminal-emulator", &["--working-directory", repo_path], "Opened in terminal"),
    }
}

pub fn scan_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn run_git_output(repo_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .map_err(|error| format!("Failed to run git: {error}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(output_message(&output))
    }
}

fn run_git_action(repo_path: &str, args: &[&str], success_message: &str) -> GitActionResult {
    match Command::new("git").arg("-C").arg(repo_path).args(args).output() {
        Ok(output) if output.status.success() => GitActionResult {
            status: GitActionStatus::Success,
            message: non_empty_output(&output).unwrap_or_else(|| success_message.to_string()),
        },
        Ok(output) => GitActionResult {
            status: GitActionStatus::Failed,
            message: output_message(&output),
        },
        Err(error) => GitActionResult {
            status: GitActionStatus::Failed,
            message: format!("Failed to run git: {error}"),
        },
    }
}

fn sync_status(repo_path: &str) -> SyncStatus {
    match run_git_output(repo_path, &["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]) {
        Ok(output) => parse_sync_status(&output).unwrap_or(SyncStatus {
            ahead: 0,
            behind: 0,
            has_upstream: false,
        }),
        Err(error) if is_missing_upstream_error(&error) => SyncStatus {
            ahead: 0,
            behind: 0,
            has_upstream: false,
        },
        Err(_) => SyncStatus {
            ahead: 0,
            behind: 0,
            has_upstream: false,
        },
    }
}

fn is_missing_upstream_error(error: &str) -> bool {
    let message = error.to_lowercase();
    message.contains("no upstream")
        || message.contains("no upstream configured")
        || message.contains("no tracking information")
        || message.contains("unknown revision")
        || message.contains("@{upstream}")
}

fn run_process(executable: &str, args: &[&str], success_message: &str) -> GitActionResult {
    match Command::new(executable).args(args).output() {
        Ok(output) if output.status.success() => GitActionResult {
            status: GitActionStatus::Success,
            message: success_message.to_string(),
        },
        Ok(output) => GitActionResult {
            status: GitActionStatus::Failed,
            message: output_message(&output),
        },
        Err(error) => GitActionResult {
            status: GitActionStatus::Failed,
            message: format!("Failed to run {executable}: {error}"),
        },
    }
}

fn output_message(output: &Output) -> String {
    non_empty_output(output).unwrap_or_else(|| {
        output
            .status
            .code()
            .map(|code| format!("Command failed with exit code {code}"))
            .unwrap_or_else(|| "Command failed".to_string())
    })
}

fn non_empty_output(output: &Output) -> Option<String> {
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if !stderr.is_empty() {
        return Some(stderr);
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if stdout.is_empty() {
        None
    } else {
        Some(stdout)
    }
}

fn parse_last_commit(
    last_commit: Option<&str>,
) -> (Option<String>, Option<String>, Option<String>, Option<String>) {
    let Some(last_commit) = last_commit else {
        return (None, None, None, None);
    };

    let mut parts = last_commit.splitn(4, '|');

    (
        parts.next().map(str::to_string).filter(|value| !value.is_empty()),
        parts.next().map(str::to_string).filter(|value| !value.is_empty()),
        parts.next().map(str::to_string).filter(|value| !value.is_empty()),
        parts.next().map(str::to_string).filter(|value| !value.is_empty()),
    )
}

fn repository_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("repository")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::{fetch_repository, parse_status_counts, parse_sync_status, refresh_repository};
    use crate::models::GitActionStatus;
    use std::process::Command;
    use tempfile::tempdir;

    #[test]
    fn parses_staged_modified_and_untracked_counts() {
        let counts = parse_status_counts("M  staged.rs\n M modified.rs\n?? new.rs\nA  added.rs\n");

        assert_eq!(counts.staged_count, 2);
        assert_eq!(counts.modified_count, 1);
        assert_eq!(counts.untracked_count, 1);
    }

    #[test]
    fn parses_ahead_behind_sync_status() {
        let sync_status = parse_sync_status("2\t3").expect("sync status");

        assert_eq!(sync_status.ahead, 2);
        assert_eq!(sync_status.behind, 3);
        assert!(sync_status.has_upstream);
    }

    #[test]
    fn refresh_repository_allows_missing_origin_remote() {
        let root = tempdir().expect("temp dir");
        Command::new("git")
            .args(["init"])
            .current_dir(root.path())
            .output()
            .expect("git init");
        fs_err_create(root.path().join("README.md"), "# Test\n");
        Command::new("git")
            .args(["add", "README.md"])
            .current_dir(root.path())
            .output()
            .expect("git add");
        Command::new("git")
            .args([
                "-c",
                "user.email=test@example.com",
                "-c",
                "user.name=Test User",
                "commit",
                "-m",
                "initial commit",
            ])
            .current_dir(root.path())
            .output()
            .expect("git commit");

        let status = refresh_repository(root.path().to_str().expect("utf8 path")).expect("refresh");

        assert_eq!(status.name, root.path().file_name().unwrap().to_string_lossy());
        assert!(status.remote_url.is_none());
        assert!(!status.has_upstream);
        assert_eq!(status.ahead, 0);
        assert_eq!(status.behind, 0);
        assert_eq!(status.last_commit_message.as_deref(), Some("initial commit"));
    }

    #[test]
    fn git_action_failure_returns_structured_failed_status() {
        let root = tempdir().expect("temp dir");

        let result = fetch_repository(root.path().to_str().expect("utf8 path"));

        assert_eq!(result.status, GitActionStatus::Failed);
        assert!(!result.message.is_empty());
    }

    fn fs_err_create(path: std::path::PathBuf, contents: &str) {
        std::fs::write(path, contents).expect("write file");
    }
}
