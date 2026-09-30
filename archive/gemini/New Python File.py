import os

# Mapping of original timestamp filenames to their functional app filenames
RENAME_MAP = {
    # Initial Web & DB Setup
    "gemini-code-1790529482282.js": "web_app_entry.js",
    "gemini-code-1790529541217.sql": "schema_v1_sqlite.sql",
    "gemini-code-1790529552010.json": "package_v1.json",
    
    # Early Python Orchestration Scripts
    "gemini-code-1790529556760.py": "setup_project_v1.py",
    "gemini-code-1790529611141.py": "setup_project_v2.py",
    "gemini-code-1790529718184.json": "package_v2.json",
    "gemini-code-1790529753894.py": "setup_project_v3.py",
    "gemini-code-1790529759975.py": "setup_apex_project.py", # Latest full Python script
    
    # Core Application Component Exports
    "gemini-code-1790530194884.js": "App.jsx",
    "gemini-code-1790530287141.js": "App_Navigation.jsx",
    
    # Services & Database Layers
    "gemini-code-1790530525571.js": "databaseService.js",
    "gemini-code-1790530568961.js": "backupService.js",
    "gemini-code-1790530610976.js": "useBallisticsDb.js",
    "gemini-code-1790530624145.js": "databaseService_v2.js",
    "gemini-code-1790530785428.js": "backupService_v2.js",
    
    # Typescript Definitions & Utils
    "gemini-code-1790530992769.ts": "types_ballistics.ts",
    "gemini-code-1790530996322.ts": "types_database.ts",
    "gemini-code-1790530999210.ts": "types_backup.ts",
    "gemini-code-1790531002449.js": "unitConversions.js",
    "gemini-code-1790531007291.ts": "types_conversions.ts",
    "gemini-code-1790531011566.js": "atmosphereUtils.js",
    
    # Database Schemas & Hooks
    "gemini-code-1790531298447.sql": "schema_v2_sqlite.sql",
    "gemini-code-1790531301077.js": "useBallisticsDb_v2.js",
    
    # Screens - Batch 1
    "gemini-code-1790531474021.js": "DopeCardScreen.jsx",
    "gemini-code-1790531483558.js": "PowderTempSensitivityScreen.jsx",
    "gemini-code-1790531556144.js": "RayleighGroupCalculator.jsx",
    "gemini-code-1790531562861.js": "TransonicStabilityScreen.jsx",
    "gemini-code-1790531574426.js": "RifleProfileScreen.jsx",
    
    # Screens & Components - Batch 2
    "gemini-code-1790531962298.js": "BackupRestoreScreen.jsx",
    "gemini-code-1790531968598.js": "DopeCardScreen_v2.jsx",
    "gemini-code-1790531972224.js": "PowderTempSensitivityScreen_v2.jsx",
    "gemini-code-1790532007534.js": "RayleighGroupCalculator_v2.jsx",
    "gemini-code-1790532011225.js": "TransonicStabilityScreen_v2.jsx",
    "gemini-code-1790532015290.js": "RifleProfileScreen_v2.jsx",
    "gemini-code-1790532052602.js": "BackupRestoreScreen_v2.jsx",
    
    # Final Module Exports
    "gemini-code-1790532101048.js": "App_Final.jsx",
    "gemini-code-1790532191076.js": "databaseService_final.js",
    "gemini-code-1790532194438.js": "backupService_final.js",
    "gemini-code-1790532197600.js": "useBallisticsDb_final.js",
    "gemini-code-1790532412415.js": "DopeCardScreen_final.jsx",
    "gemini-code-1790532415790.js": "PowderTempSensitivityScreen_final.jsx",
    "gemini-code-1790532418275.js": "RayleighGroupCalculator_final.jsx",
    "gemini-code-1790532495705.js": "TransonicStabilityScreen_final.jsx",
    "gemini-code-1790532499552.js": "RifleProfileScreen_final.jsx"
}

def rename_files():
    renamed_count = 0
    skipped_count = 0

    print("=== Starting File Renaming Process ===\n")
    for old_name, new_name in RENAME_MAP.items():
        if os.path.exists(old_name):
            try:
                os.rename(old_name, new_name)
                print(f"[SUCCESS] Renamed: {old_name} -> {new_name}")
                renamed_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to rename {old_name}: {e}")
        else:
            print(f"[SKIP] File not found: {old_name}")
            skipped_count += 1

    print(f"\nCompleted: {renamed_count} files renamed, {skipped_count} skipped.")

if __name__ == "__main__":
    rename_files()
    input("\nPress ENTER to exit...")