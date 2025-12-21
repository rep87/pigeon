"""Configuration objects for the simulator."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict


@dataclass
class SimConfig:
    """Top-level simulation configuration."""

    spreadsheet_id: str | None = None
    chapter_id: str = "CH1"
    character_id: str = ""
    starting_weapon_id: str = "BASIC_1"
    offers_per_levelup: int = 3
    offer_tier: str = "SILVER"
    num_runs: int = 200
    seed: int = 42
    evolve_on_stage_clear: bool = True
    evolve_policy: str = "RANDOM"
    weapon_slots_by_chapter: Dict[str, int] = field(default_factory=lambda: {"CH1": 1})
