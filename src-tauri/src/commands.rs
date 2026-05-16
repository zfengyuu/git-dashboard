use crate::models::{ActivityInput, ActivityItem, GitActionResult, RepositoryStatus};

#[tauri::command]
pub fn scan_workspace(path: String) -> Result<Vec<RepositoryStatus>, String> {
    crate::scanner::scan_workspace(&path)
}

#[tauri::command]
pub fn refresh_repository(repo_path: String) -> Result<RepositoryStatus, String> {
    crate::git::refresh_repository(&repo_path)
}

#[tauri::command]
pub fn refresh_repositories(repo_paths: Vec<String>) -> Result<Vec<RepositoryStatus>, String> {
    repo_paths
        .iter()
        .map(|repo_path| crate::git::refresh_repository(repo_path))
        .collect()
}

#[tauri::command]
pub fn fetch_repository(repo_path: String) -> GitActionResult {
    crate::git::fetch_repository(&repo_path)
}

#[tauri::command]
pub fn pull_repository(repo_path: String) -> GitActionResult {
    crate::git::pull_repository(&repo_path)
}

#[tauri::command]
pub fn push_repository(repo_path: String) -> GitActionResult {
    crate::git::push_repository(&repo_path)
}

#[tauri::command]
pub fn open_in_vscode(repo_path: String, command: Option<String>) -> GitActionResult {
    crate::git::open_in_vscode(&repo_path, command)
}

#[tauri::command]
pub fn open_in_terminal(repo_path: String, command: Option<String>) -> GitActionResult {
    crate::git::open_in_terminal(&repo_path, command)
}

#[tauri::command]
pub fn get_recent_activity(app: tauri::AppHandle, limit: Option<usize>) -> Result<Vec<ActivityItem>, String> {
    let path = crate::database::database_path(&app)?;
    crate::database::init_database(&path)?;
    crate::database::get_recent_activity(&path, limit.unwrap_or(20))
}

#[tauri::command]
pub fn record_activity(app: tauri::AppHandle, input: ActivityInput) -> Result<ActivityItem, String> {
    let path = crate::database::database_path(&app)?;
    crate::database::init_database(&path)?;
    crate::database::record_activity_at_path(&path, input)
}

#[tauri::command]
pub fn clear_recent_activity(app: tauri::AppHandle) -> Result<(), String> {
    let path = crate::database::database_path(&app)?;
    crate::database::init_database(&path)?;
    crate::database::clear_recent_activity(&path)
}
