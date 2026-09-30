-- Extended Firearm Profile Table
CREATE TABLE IF NOT EXISTS firearm_profiles (
    id TEXT PRIMARY KEY NOT NULL,
    nickname TEXT NOT NULL,                  -- e.g., "Competition Chassis Rifle"
    action_type TEXT,                        -- 'Bolt', 'Semi-Auto', 'Lever'
    caliber TEXT NOT NULL,                   -- e.g., "6.5 Creedmoor"
    
    -- Barrel Specs
    barrel_length_inches REAL NOT NULL,      -- e.g., 24.0
    twist_rate_inches REAL NOT NULL,         -- e.g., 8.0 (for 1:8")
    barrel_contour TEXT,                     -- 'Pencil', 'Medium Palma', 'Proof Carbon', 'Bull'
    
    -- Scope & Optics Specs
    scope_make_model TEXT,                   -- e.g., "Vortex Razor HD Gen III 6-36x56"
    scope_focal_plane TEXT,                  -- 'FFP', 'SFP'
    scope_click_unit TEXT DEFAULT 'MOA',      -- 'MOA', 'MIL'
    click_value REAL DEFAULT 0.25,           -- 0.25 or 0.1
    total_elevation_travel_units REAL,      -- e.g., 120 MOA
    mount_cant_units REAL DEFAULT 0.0,       -- e.g., 20.0 MOA
    ring_height_inches REAL,                 -- e.g., 1.25
    
    -- Trigger & Stock Specs
    trigger_type TEXT,                       -- 'Single Stage', 'Two Stage'
    trigger_pull_weight_lbs REAL,            -- e.g., 1.5
    stock_chassis_type TEXT,                 -- 'Traditional Wood', 'Fiberglass', 'Aluminum Chassis'
    
    -- Muzzle Device
    muzzle_device_type TEXT                  -- 'Bare Muzzle', 'Brake', 'Suppressor'
);