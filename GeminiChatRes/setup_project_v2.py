import math
import sqlite3
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

DB_NAME = "reloading.db"

app = FastAPI(
    title="Apex AMC - Reloading Recipe & Ladder API",
    description="Query published load data and calculate barrel-length scaled work-up ladders.",
    version="1.0.0"
)

# --- Pydantic Response & Request Schemas ---

class LadderStep(BaseModel):
    step: int
    charge_grains: float = Field(..., description="Powder charge weight in grains")
    estimated_fps: int = Field(..., description="Estimated muzzle velocity in feet per second")
    is_max: bool = Field(..., description="Flag indicating if this is the maximum safe published load")

class LadderResponse(BaseModel):
    recipe_id: int
    cartridge: str
    bullet: str
    powder: str
    source: str
    published_coal_in: float
    user_target_coal_in: float
    test_barrel_length_in: float
    user_barrel_length_in: float
    coal_warning: Optional[str] = None
    ladder: List[LadderStep]


# --- Helper Functions ---

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Enables dict-like column access
    return conn


def calculate_velocity_scaling(published_fps: float, test_length: float, user_length: float, burn_class: str) -> float:
    """Homann / Fraser Expansion Model: V_target = V_test * (L_target / L_test)^n"""
    exponent_map = {
        "pistol": 0.15,
        "rifle_medium": 0.22,
        "rifle_slow": 0.29,
        "shotgun": 0.15
    }
    n = exponent_map.get(burn_class, 0.22)
    scaling_factor = math.pow(user_length / test_length, n)
    return published_fps * scaling_factor


# --- API Endpoints ---

@app.get("/recipes/{recipe_id}/ladder", response_model=LadderResponse, summary="Get Scaled Reloading Ladder")
def get_recipe_ladder(
    recipe_id: int,
    user_barrel_length: float = Query(..., gt=0, description="User's firearm barrel length in inches (e.g., 18.0)"),
    user_target_coal: Optional[float] = Query(None, gt=0, description="User's intended Overall Length in inches (e.g., 2.780)"),
    steps_count: int = Query(5, ge=3, le=10, description="Number of ladder work-up steps (between 3 and 10)")
):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Query normalized tables via joins
    query = """
        SELECT 
            r.id as recipe_id,
            r.published_coal_in,
            r.test_barrel_length_in,
            r.min_charge_grains,
            r.min_velocity_fps,
            r.max_charge_grains,
            r.max_velocity_fps,
            c.name as cartridge_name,
            b.weight_grains as bullet_weight,
            b.name as bullet_name,
            bm.name as bullet_mfg,
            p.name as powder_name,
            p.burn_rate_class,
            pm.name as powder_mfg,
            s.name as source_name,
            s.edition as source_edition
        FROM recipes r
        JOIN cartridges c ON r.cartridge_id = c.id
        JOIN bullets b ON r.bullet_id = b.id
        JOIN manufacturers bm ON b.manufacturer_id = bm.id
        JOIN powders p ON r.powder_id = p.id
        JOIN manufacturers pm ON p.manufacturer_id = pm.id
        JOIN sources s ON r.source_id = s.id
        WHERE r.id = ?
    """
    cursor.execute(query, (recipe_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Recipe ID {recipe_id} not found.")

    published_coal = row["published_coal_in"]
    target_coal = user_target_coal if user_target_coal is not None else published_coal

    # COAL Seating Depth Safety Warning
    coal_warning = None
    if target_coal < published_coal:
        diff = round(published_coal - target_coal, 3)
        coal_warning = (
            f"WARNING: Target COAL ({target_coal}\") is {diff}\" shorter than published COAL ({published_coal}\"). "
            "Seating deeper reduces internal combustion volume and rapidly spikes chamber pressure! "
            "Always begin testing at or below minimum charge."
        )

    # Calculate Velocity Scaling Ratios
    min_scaled_fps = calculate_velocity_scaling(
        row["min_velocity_fps"], row["test_barrel_length_in"], user_barrel_length, row["burn_rate_class"]
    )
    max_scaled_fps = calculate_velocity_scaling(
        row["max_velocity_fps"], row["test_barrel_length_in"], user_barrel_length, row["burn_rate_class"]
    )

    # Compute Linear Ladder Increments
    charge_step = (row["max_charge_grains"] - row["min_charge_grains"]) / (steps_count - 1)
    fps_step = (max_scaled_fps - min_scaled_fps) / (steps_count - 1)

    ladder_steps = []
    for i in range(steps_count):
        current_charge = row["min_charge_grains"] + (charge_step * i)
        current_fps = min_scaled_fps + (fps_step * i)
        
        ladder_steps.append(
            LadderStep(
                step=i + 1,
                charge_grains=round(current_charge, 1),
                estimated_fps=round(current_fps),
                is_max=(i == steps_count - 1)
            )
        )

    return LadderResponse(
        recipe_id=row["recipe_id"],
        cartridge=row["cartridge_name"],
        bullet=f"{row['bullet_mfg']} {row['bullet_name']} ({row['bullet_weight']}gr)",
        powder=f"{row['powder_mfg']} {row['powder_name']}",
        source=f"{row['source_name']} ({row['source_edition']})",
        published_coal_in=published_coal,
        user_target_coal_in=target_coal,
        test_barrel_length_in=row["test_barrel_length_in"],
        user_barrel_length_in=user_barrel_length,
        coal_warning=coal_warning,
        ladder=ladder_steps
    )