"""Configuration objects for the simulator."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class SimConfig:
    """Top-level simulation configuration.

    Attributes:
        character_name: Name of the character to simulate. Must exist in the
            Characters sheet.
        starting_weapon_id: Identifier of the starting weapon.
        stage_order: Ordered list of stage names to simulate.
        rng_seed: Optional seed for deterministic sampling.
        offers_per_level: Number of augment offers presented at each level-up.
        offer_rarity: Which rarity tier to pull level-up augments from. Defaults
            to "SILVER" as a simple MVP assumption.
    """

    character_name: str
    starting_weapon_id: str
    stage_order: List[str] = field(default_factory=list)
    rng_seed: Optional[int] = None
    offers_per_level: int = 3
    offer_rarity: str = "SILVER"
