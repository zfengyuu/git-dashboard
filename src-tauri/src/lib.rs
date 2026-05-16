pub mod commands;
pub mod database;
pub mod git;
pub mod models;
pub mod scanner;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::scan_workspace,
            commands::refresh_repository,
            commands::refresh_repositories,
            commands::fetch_repository,
            commands::pull_repository,
            commands::push_repository,
            commands::open_in_vscode,
            commands::open_in_terminal,
            commands::get_recent_activity,
            commands::record_activity,
            commands::clear_recent_activity
        ])
        .run(tauri::generate_context!())
        .expect("error while running RepoPilot");
}
