use crate::models::RepositoryStatus;
use std::fs;
use std::path::{Path, PathBuf};

const IGNORED_DIRS: &[&str] = &[
    "node_modules",
    "dist",
    "build",
    ".next",
    ".cache",
    "target",
    "vendor",
];

pub fn scan_workspace(path: &str) -> Result<Vec<RepositoryStatus>, String> {
    let root = PathBuf::from(path);

    if !root.exists() {
        return Err(format!("Workspace does not exist: {path}"));
    }

    if !root.is_dir() {
        return Err(format!("Workspace is not a directory: {path}"));
    }

    let mut repositories = Vec::new();
    scan_dir(&root, &mut repositories)?;
    repositories.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));
    Ok(repositories)
}

fn scan_dir(path: &Path, repositories: &mut Vec<RepositoryStatus>) -> Result<(), String> {
    if should_ignore(path) {
        return Ok(());
    }

    if is_git_repository(path) {
        repositories.push(repository_status_for_path(path));
        return Ok(());
    }

    let entries = fs::read_dir(path).map_err(|error| format!("Failed to read {}: {error}", path.display()))?;

    for entry in entries {
        let entry = entry.map_err(|error| format!("Failed to read entry in {}: {error}", path.display()))?;
        let child_path = entry.path();

        if child_path.is_dir() {
            scan_dir(&child_path, repositories)?;
        }
    }

    Ok(())
}

fn should_ignore(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| IGNORED_DIRS.contains(&name))
        .unwrap_or(false)
}

fn is_git_repository(path: &Path) -> bool {
    path.join(".git").exists()
}

fn repository_status_for_path(path: &Path) -> RepositoryStatus {
    let path_string = path.to_string_lossy().to_string();

    crate::git::refresh_repository(&path_string).unwrap_or_else(|error| RepositoryStatus {
        name: repository_name(path),
        path: path_string,
        current_branch: "Unknown".to_string(),
        is_clean: false,
        modified_count: 0,
        staged_count: 0,
        untracked_count: 0,
        ahead: 0,
        behind: 0,
        has_upstream: false,
        last_commit_hash: None,
        last_commit_message: None,
        last_commit_author: None,
        last_commit_time: None,
        remote_url: None,
        last_scanned_at: crate::git::scan_timestamp(),
        error: Some(error.clone()),
        error_message: Some(error),
    })
}

fn repository_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("repository")
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::scan_workspace;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn finds_git_repositories_and_ignores_excluded_folders() {
        let root = tempdir().expect("temp dir");
        let app_repo = root.path().join("apps/web-app");
        let ignored_repo = root.path().join("node_modules/vendor-package");
        fs::create_dir_all(app_repo.join(".git")).expect("app repo");
        fs::create_dir_all(ignored_repo.join(".git")).expect("ignored repo");

        let repositories = scan_workspace(root.path().to_str().expect("utf8 path")).expect("scan");

        assert_eq!(repositories.len(), 1);
        assert_eq!(repositories[0].name, "web-app");
        assert_eq!(repositories[0].path, app_repo.to_string_lossy());
    }
}
