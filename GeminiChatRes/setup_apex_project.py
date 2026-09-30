import sqlite3

DB_NAME = "master_reloading.db"

def search_recipes(cartridge_query=None, powder_query=None):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    sql = """
        SELECT 
            c.name as cartridge,
            bm.name || ' ' || b.name || ' (' || b.weight_grains || 'gr)' as bullet,
            pm.name || ' ' || p.name as powder,
            prm.name || ' ' || pr.model_name as primer,
            r.min_charge_grains || ' - ' || r.max_charge_grains || ' gr' as charge_range,
            r.min_velocity_fps || ' - ' || r.max_velocity_fps || ' fps' as velocity_range,
            s.name || ' (' || s.edition || ')' as source
        FROM recipes r
        JOIN cartridges c ON r.cartridge_id = c.id
        JOIN bullets b ON r.bullet_id = b.id
        JOIN manufacturers bm ON b.manufacturer_id = bm.id
        JOIN powders p ON r.powder_id = p.id
        JOIN manufacturers pm ON p.manufacturer_id = pm.id
        JOIN primers pr ON r.primer_id = pr.id
        JOIN manufacturers prm ON pr.manufacturer_id = prm.id
        JOIN sources s ON r.source_id = s.id
        WHERE 1=1
    """
    params = []
    if cartridge_query:
        sql += " AND c.name LIKE ?"
        params.append(f"%{cartridge_query}%")
    if powder_query:
        sql += " AND p.name LIKE ?"
        params.append(f"%{powder_query}%")

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    print(f"\n--- FOUND {len(rows)} MATCHING MASTER LOAD RECIPES ---")
    for r in rows:
        print(f"\n[{r['cartridge']}]")
        print(f"  Bullet:   {r['bullet']}")
        print(f"  Powder:   {r['powder']}")
        print(f"  Primer:   {r['primer']}")
        print(f"  Charge:   {r['charge_range']}")
        print(f"  Velocity: {r['velocity_range']}")
        print(f"  Source:   {r['source']}")

if __name__ == "__main__":
    # Example Searches:
    search_recipes(cartridge_query="308")
    search_recipes(powder_query="Titegroup")