fn main() {
    let current_dir = std::env::current_dir().unwrap();
    let bin_dir = current_dir.join("bin");
    if bin_dir.exists() {
        if let Ok(orig_path) = std::env::var("PATH") {
            let new_path = format!("{};{}", bin_dir.to_string_lossy(), orig_path);
            std::env::set_var("PATH", new_path);
        }
    }
    tauri_build::build()
}

