import json
import sqlite3
from typing import Any, Dict

DB_NAME = "reloading.db"
JSON_FILE = "recipes.json"

def get_or_create(cursor: sqlite3.Cursor, table: str, search_fields: Dict[str, Any], insert_fields: Dict[str, Any]) -> int:
    """Helper to select an existing ID or insert a new row and return the ID."""
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

def import_json_data():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    # 1. Initialize schema
    with open("schema.sql", "r") as f:
        cursor.executescript(f.read())
        
    # 2. Load JSON recipes
    with open(JSON_FILE, "r") as f:
        recipes_data = json.load(f)
        
    count = 0
    for r in recipes_data:
        # Resolve Cartridge
        cartridge_id = get_or_create(
            cursor, "cartridges",
            {"name": r["cartridge"]},
            {"name": r["cartridge"], "category": r.get("cartridge_category", "rifle"), "saami_max_psi": r.get("saami_max_psi")}
        )
        
        # Resolve Source
        source_id = get_or_create(
            cursor, "sources",
            {"name": r["source"]["name"], "edition": r["source"].get("edition", "Default")},
            {"name": r["source"]["name"], "edition": r["source"].get("edition", "Default"), "publication_year": r["source"].get("publication_year")}
        )
        
        # Resolve Bullet Manufacturer
        bullet_mfg_id = get_or_create(
            cursor, "manufacturers",
            {"name": r["bullet"]["manufacturer"]},
            {"name": r["bullet"]["manufacturer"]}
        )
        
        # Resolve Bullet
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
        
        # Resolve Powder Manufacturer
        powder_mfg_id = get_or_create(
            cursor, "manufacturers",
            {"name": r["powder"]["manufacturer"]},
            {"name": r["powder"]["manufacturer"]}
        )
        
        # Resolve Powder
        powder_id = get_or_create(
            cursor, "powders",
            {"manufacturer_id": powder_mfg_id, "name": r["powder"]["name"]},
            {
                "manufacturer_id": powder_mfg_id,
                "name": r["powder"]["name"],
                "burn_rate_class": r["powder"].get("burn_rate_class", "rifle_medium")
            }
        )
        
        # Insert Recipe
        cursor.execute("""
            INSERT INTO recipes (
                cartridge_id, bullet_id, powder_id, source_id, primer_description,
                case_brand, test_barrel_length_in, test_twist_rate, published_coal_in,
                min_charge_grains, min_velocity_fps, max_charge_grains, max_velocity_fps,
                max_pressure, pressure_unit, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cartridge_id, bullet_id, powder_id, source_id, r.get("primer"),
            r.get("case_brand"), r["test_barrel_length_in"], r.get("test_twist_rate"),
            r["published_coal_in"], r["min_charge_grains"], r["min_velocity_fps"],
            r["max_charge_grains"], r["max_velocity_fps"], r.get("max_pressure"),
            r.get("pressure_unit", "PSI"), r.get("notes")
        ))
        count += 1

    conn.commit()
    conn.close()
    print(f"Successfully imported {count} recipes into {DB_NAME}.")

if __name__ == "__main__":
    import_json_data()