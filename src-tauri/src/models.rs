use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryStatus {
    pub name: String,
    pub path: String,
    pub current_branch: String,
    pub is_clean: bool,
    pub modified_count: usize,
    pub staged_count: usize,
    pub untracked_count: usize,
    pub ahead: usize,
    pub behind: usize,
    pub has_upstream: bool,
    pub last_commit_hash: Option<String>,
    pub last_commit_message: Option<String>,
    pub last_commit_author: Option<String>,
    pub last_commit_time: Option<String>,
    pub remote_url: Option<String>,
    pub last_scanned_at: String,
    pub error: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StatusCounts {
    pub modified_count: usize,
    pub staged_count: usize,
    pub untracked_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatus {
    pub ahead: usize,
    pub behind: usize,
    pub has_upstream: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GitActionResult {
    pub status: GitActionStatus,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum GitActionStatus {
    Pending,
    Running,
    Success,
    Failed,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityInput {
    pub repository_name: Option<String>,
    pub repository_path: Option<String>,
    pub action_type: String,
    pub status: GitActionStatus,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ActivityItem {
    pub id: String,
    pub repository_name: Option<String>,
    pub repository_path: Option<String>,
    pub action_type: String,
    pub status: GitActionStatus,
    pub message: String,
    pub created_at: String,
}
