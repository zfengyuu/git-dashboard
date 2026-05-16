use crate::models::{ActivityInput, ActivityItem, GitActionStatus};
use rusqlite::{params, Connection};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

pub fn database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Failed to resolve app data directory: {error}"))?;
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create app data directory {}: {error}", directory.display()))?;
    Ok(directory.join("repopilot.sqlite"))
}

pub fn init_database(path: &Path) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create database directory {}: {error}", parent.display()))?;
    }

    let connection = Connection::open(path).map_err(|error| format!("Failed to open activity database: {error}"))?;
    connection
        .execute(
            "CREATE TABLE IF NOT EXISTS activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repository_name TEXT,
                repository_path TEXT,
                action_type TEXT NOT NULL,
                status TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            )",
            [],
        )
        .map_err(|error| format!("Failed to create activity table: {error}"))?;
    Ok(())
}

pub fn record_activity_at_path(path: &Path, input: ActivityInput) -> Result<ActivityItem, String> {
    init_database(path)?;
    let connection = Connection::open(path).map_err(|error| format!("Failed to open activity database: {error}"))?;
    let created_at = crate::git::scan_timestamp();
    connection
        .execute(
            "INSERT INTO activity (repository_name, repository_path, action_type, status, message, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                input.repository_name,
                input.repository_path,
                input.action_type,
                status_to_string(&input.status),
                input.message,
                created_at,
            ],
        )
        .map_err(|error| format!("Failed to record activity: {error}"))?;
    let id = connection.last_insert_rowid();
    get_activity_by_id(&connection, id)
}

pub fn get_recent_activity(path: &Path, limit: usize) -> Result<Vec<ActivityItem>, String> {
    init_database(path)?;
    let connection = Connection::open(path).map_err(|error| format!("Failed to open activity database: {error}"))?;
    let mut statement = connection
        .prepare(
            "SELECT id, repository_name, repository_path, action_type, status, message, created_at
             FROM activity
             ORDER BY id DESC
             LIMIT ?1",
        )
        .map_err(|error| format!("Failed to prepare activity query: {error}"))?;
    let rows = statement
        .query_map([limit as i64], row_to_activity)
        .map_err(|error| format!("Failed to query activity: {error}"))?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read activity: {error}"))
}

pub fn clear_recent_activity(path: &Path) -> Result<(), String> {
    init_database(path)?;
    let connection = Connection::open(path).map_err(|error| format!("Failed to open activity database: {error}"))?;
    connection
        .execute("DELETE FROM activity", [])
        .map_err(|error| format!("Failed to clear activity: {error}"))?;
    Ok(())
}

fn get_activity_by_id(connection: &Connection, id: i64) -> Result<ActivityItem, String> {
    connection
        .query_row(
            "SELECT id, repository_name, repository_path, action_type, status, message, created_at
             FROM activity
             WHERE id = ?1",
            [id],
            row_to_activity,
        )
        .map_err(|error| format!("Failed to read recorded activity: {error}"))
}

fn row_to_activity(row: &rusqlite::Row<'_>) -> rusqlite::Result<ActivityItem> {
    let status: String = row.get(4)?;
    Ok(ActivityItem {
        id: row.get::<_, i64>(0)?.to_string(),
        repository_name: row.get(1)?,
        repository_path: row.get(2)?,
        action_type: row.get(3)?,
        status: status_from_string(&status),
        message: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn status_to_string(status: &GitActionStatus) -> &'static str {
    match status {
        GitActionStatus::Pending => "pending",
        GitActionStatus::Running => "running",
        GitActionStatus::Success => "success",
        GitActionStatus::Failed => "failed",
        GitActionStatus::Skipped => "skipped",
    }
}

fn status_from_string(status: &str) -> GitActionStatus {
    match status {
        "pending" => GitActionStatus::Pending,
        "running" => GitActionStatus::Running,
        "success" => GitActionStatus::Success,
        "skipped" => GitActionStatus::Skipped,
        _ => GitActionStatus::Failed,
    }
}

#[cfg(test)]
mod tests {
    use super::{clear_recent_activity, get_recent_activity, init_database, record_activity_at_path};
    use crate::models::{ActivityInput, GitActionStatus};
    use tempfile::tempdir;

    #[test]
    fn records_lists_and_clears_recent_activity() {
        let root = tempdir().expect("temp dir");
        let db_path = root.path().join("activity.sqlite");
        init_database(&db_path).expect("database");

        for index in 0..25 {
            record_activity_at_path(
                &db_path,
                ActivityInput {
                    repository_name: Some(format!("repo-{index}")),
                    repository_path: Some(format!("/tmp/repo-{index}")),
                    action_type: "pull".to_string(),
                    status: GitActionStatus::Success,
                    message: format!("Pulled repo-{index}"),
                },
            )
            .expect("record");
        }

        let recent = get_recent_activity(&db_path, 20).expect("recent");
        assert_eq!(recent.len(), 20);
        assert_eq!(recent[0].repository_name.as_deref(), Some("repo-24"));
        assert_eq!(recent[19].repository_name.as_deref(), Some("repo-5"));

        clear_recent_activity(&db_path).expect("clear");
        assert!(get_recent_activity(&db_path, 20).expect("empty").is_empty());
    }
}
