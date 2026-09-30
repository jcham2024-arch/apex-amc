-- Cartridges / Calibers (e.g., .308 Winchester, 9mm Luger)
CREATE TABLE IF NOT EXISTS cartridges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'rifle' CHECK(category IN ('rifle', 'handgun', 'shotgun')),
    saami_max_psi INTEGER
);

-- Component Manufacturers (e.g., Sierra, Hodgdon, Hornady, Federal)
CREATE TABLE IF NOT EXISTS manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Bullets / Projectiles
CREATE TABLE IF NOT EXISTS bullets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    weight_grains DECIMAL(6,2) NOT NULL,
    diameter_inches DECIMAL(5,3) NOT NULL,
    bc_g1 DECIMAL(5,3),
    bc_g7 DECIMAL(5,3),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    UNIQUE(manufacturer_id, name, weight_grains)
);

-- Powders
CREATE TABLE IF NOT EXISTS powders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    burn_rate_class VARCHAR(50) CHECK(burn_rate_class IN ('pistol', 'rifle_medium', 'rifle_slow', 'shotgun')),
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    UNIQUE(manufacturer_id, name)
);

-- Data Sources / Manuals (Attribution & Compliance)
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    edition VARCHAR(50),
    publication_year INTEGER,
    url TEXT,
    UNIQUE(name, edition)
);

-- Core Reloading Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id INTEGER NOT NULL,
    bullet_id INTEGER NOT NULL,
    powder_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
    primer_description VARCHAR(100),
    case_brand VARCHAR(100),
    test_barrel_length_in DECIMAL(4,2) NOT NULL,
    test_twist_rate VARCHAR(20),
    published_coal_in DECIMAL(5,3) NOT NULL,
    min_charge_grains DECIMAL(5,2) NOT NULL,
    min_velocity_fps INTEGER NOT NULL,
    max_charge_grains DECIMAL(5,2) NOT NULL,
    max_velocity_fps INTEGER NOT NULL,
    max_pressure INTEGER,
    pressure_unit VARCHAR(10) DEFAULT 'PSI' CHECK(pressure_unit IN ('PSI', 'CUP')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cartridge_id) REFERENCES cartridges(id),
    FOREIGN KEY (bullet_id) REFERENCES bullets(id),
    FOREIGN KEY (powder_id) REFERENCES powders(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

-- Indexes for instant recipe filtering in UI searches
CREATE INDEX IF NOT EXISTS idx_recipes_lookup ON recipes(cartridge_id, bullet_id, powder_id);
CREATE INDEX IF NOT EXISTS idx_bullets_search ON bullets(manufacturer_id, weight_grains);