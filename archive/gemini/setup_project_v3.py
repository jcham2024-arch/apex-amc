import json
import sqlite3
import os

DB_NAME = "master_reloading.db"
SEED_FILE = "master_seed_data.json"

SCHEMA_SQL = """
-- Cartridges / Calibers
CREATE TABLE IF NOT EXISTS cartridges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) DEFAULT 'rifle' CHECK(category IN ('rifle', 'handgun', 'shotgun')),
    saami_max_psi INTEGER
);

-- Component & Powder Manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Primers Table
CREATE TABLE IF NOT EXISTS primers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer_id INTEGER NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    primer_type VARCHAR(50) NOT NULL,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
    UNIQUE(manufacturer_id, model_name)
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

-- Published Sources / Manuals
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,
    edition VARCHAR(50),
    publication_year INTEGER,
    UNIQUE(name, edition)
);

-- Master Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartridge_id INTEGER NOT NULL,
    bullet_id INTEGER NOT NULL,
    powder_id INTEGER NOT NULL,
    primer_id INTEGER NOT NULL,
    source_id INTEGER NOT NULL,
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
    FOREIGN KEY (primer_id) REFERENCES primers(id),
    FOREIGN KEY (source_id) REFERENCES sources(id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_lookup ON recipes(cartridge_id, bullet_id, powder_id, primer_id);
CREATE INDEX IF NOT EXISTS idx_bullets_search ON bullets(manufacturer_id, weight_grains);
CREATE INDEX IF NOT EXISTS idx_powders_search ON powders(manufacturer_id);
"""

def get_or_create(cursor, table, search_fields, insert_fields):
    where_clause = " AND ".join([f"{k} = ?" for k in search_fields.keys()])
    query = f"SELECT id FROM {table} WHERE {where_clause}"
    cursor.execute(query, list(search_fields.values()))
    row = cursor.fetchone()
    
    if row:
        return row[0]
    
    keys = ", ".join(insert_fields.keys())
    placeholders = ", ".join(["?"] * len(insert_fields))
    insert_query = f"INSERT INTO {table} ({keys}) VALUES ({placeholders})"
    cursor.execute(insert_query, list(insert_fields.values()))
    return cursor.lastrowid

def build_database():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)
        print(f"Removed existing database: {DB_NAME}")

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Build Schema
    cursor.executescript(SCHEMA_SQL)
    print("Database schema created successfully.")

    # 2. Load Seed Data
    with open(SEED_FILE, "r") as f:
        data = json.load(f)

    recipe_count = 0
    for r in data:
        # Cartridge
        cartridge_id = get_or_create(
            cursor, "cartridges",
            {"name": r["cartridge"]},
            {"name": r["cartridge"], "category": r.get("cartridge_category", "rifle"), "saami_max_psi": r.get("saami_max_psi")}
        )

        # Source
        source_id = get_or_create(
            cursor, "sources",
            {"name": r["source"]["name"], "edition": r["source"].get("edition", "Current")},
            {"name": r["source"]["name"], "edition": r["source"].get("edition", "Current"), "publication_year": r["source"].get("publication_year")}
        )

        # Bullet Manufacturer & Bullet
        bullet_mfg_id = get_or_create(cursor, "manufacturers", {"name": r["bullet"]["manufacturer"]}, {"name": r["bullet"]["manufacturer"]})
        bullet_id = get_or_create(
            cursor, "bullets",
            {"manufacturer_id": bullet_mfg_id, "name": r["bullet"]["name"], "weight_grains": r["bullet"]["weight_grains"]},
            {
                "manufacturer_id": bullet_mfg_id,
                "name": r["bullet"]["name"],
                "weight_grains": r["bullet"]["weight_grains"],
                "diameter_inches": r["bullet"]["diameter_inches"],
                "bc_g1": r["bullet"].get("bc_g1"),
                "bc_g7": r["bullet"].get("bc_g7")
            }
        )

        # Powder Manufacturer & Powder
        powder_mfg_id = get_or_create(cursor, "manufacturers", {"name": r["powder"]["manufacturer"]}, {"name": r["powder"]["manufacturer"]})
        powder_id = get_or_create(
            cursor, "powders",
            {"manufacturer_id": powder_mfg_id, "name": r["powder"]["name"]},
            {"manufacturer_id": powder_mfg_id, "name": r["powder"]["name"], "burn_rate_class": r["powder"].get("burn_rate_class", "rifle_medium")}
        )

        # Primer Manufacturer & Primer
        primer_mfg_id = get_or_create(cursor, "manufacturers", {"name": r["primer"]["manufacturer"]}, {"name": r["primer"]["manufacturer"]})
        primer_id = get_or_create(
            cursor, "primers",
            {"manufacturer_id": primer_mfg_id, "model_name": r["primer"]["model"]},
            {"manufacturer_id": primer_mfg_id, "model_name": r["primer"]["model"], "primer_type": r["primer"]["type"]}
        )

        # Insert Recipe
        cursor.execute("""
            INSERT INTO recipes (
                cartridge_id, bullet_id, powder_id, primer_id, source_id, case_brand,
                test_barrel_length_in, test_twist_rate, published_coal_in, min_charge_grains,
                min_velocity_fps, max_charge_grains, max_velocity_fps, max_pressure, pressure_unit, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cartridge_id, bullet_id, powder_id, primer_id, source_id, r.get("case_brand"),
            r["test_barrel_length_in"], r.get("test_twist_rate"), r["published_coal_in"],
            r["min_charge_grains"], r["min_velocity_fps"], r["max_charge_grains"],
            r["max_velocity_fps"], r.get("max_pressure"), r.get("pressure_unit", "PSI"), r.get("notes")
        ))
        recipe_count += 1

    conn.commit()
    
    # 3. Print Summary Stats
    print("\n--- MASTER DATABASE GENERATED ---")
    print(f"Total Cartridges:    {cursor.execute('SELECT COUNT(*) FROM cartridges').fetchone()[0]}")
    print(f"Total Manufacturers: {cursor.execute('SELECT COUNT(*) FROM manufacturers').fetchone()[0]}")
    print(f"Total Projectiles:   {cursor.execute('SELECT COUNT(*) FROM bullets').fetchone()[0]}")
    print(f"Total Powders:       {cursor.execute('SELECT COUNT(*) FROM powders').fetchone()[0]}")
    print(f"Total Primers:       {cursor.execute('SELECT COUNT(*) FROM primers').fetchone()[0]}")
    print(f"Total Recipes:       {recipe_count}")
    
    conn.close()

if __name__ == "__main__":
    build_database()