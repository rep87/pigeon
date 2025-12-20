"""DataFrame validation and normalization utilities."""

from __future__ import annotations

from typing import Dict, Iterable

import pandas as pd

EXPECTED_TABS = {
    "Characters": {
        "required": {"name", "attack"},
    },
    "Pigeons": {
        "required": {"pigeon_id", "hp", "picky_rate", "likes_reward"},
    },
    "Weapons": {
        "required": {"weapon_id", "damage", "shots_per_sec", "accuracy"},
    },
    "WeaponEvolutions": {
        "required": {"weapon_id", "evolves_to", "required_upgrade_level"},
    },
    "Augments": {
        "required": {"augment_id", "target", "stat", "op", "val", "rarity"},
    },
    "LevelCurve": {
        "required": {"level", "xp_to_next"},
    },
    "Stages": {
        "required": {"stage_name", "time_limit_sec", "goal_total_likes"},
    },
    "StageSpawns": {
        "required": {"stage_name", "pigeon_id", "count"},
    },
}


class MissingSheetError(KeyError):
    """Raised when a required sheet is missing."""


class MissingColumnError(KeyError):
    """Raised when a required column is missing."""


def _validate_columns(df: pd.DataFrame, required: Iterable[str]) -> None:
    missing = set(required) - set(df.columns)
    if missing:
        raise MissingColumnError(f"Missing columns: {', '.join(sorted(missing))}")


def normalize_inputs(dfs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """Validate presence of required sheets/columns and return clean copies."""

    cleaned: Dict[str, pd.DataFrame] = {}
    for tab, meta in EXPECTED_TABS.items():
        if tab not in dfs:
            raise MissingSheetError(f"Missing expected sheet/tab '{tab}'")
        df = dfs[tab].copy()

        if tab == "Characters" and "attack" not in df.columns and "base_attack" in df.columns:
            df["attack"] = df["base_attack"]
        if tab == "Weapons" and "accuracy" not in df.columns:
            df["accuracy"] = 1.0

        _validate_columns(df, meta["required"])
        cleaned[tab] = df
    return cleaned
