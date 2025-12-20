"""DataFrame validation and normalization utilities."""

from __future__ import annotations

from typing import Dict, Iterable, List

import pandas as pd

EXPECTED_TABS = {
    "Characters": {
        "required": {"character_id", "attack"},
    },
    "Pigeons": {
        "required": {"pigeon_id", "hp", "picky_rate", "likes_reward"},
    },
    "Weapons": {
        "required": {"weapon_id", "damage", "shots_per_sec"},
    },
    "WeaponEvolutions": {
        "required": {"weapon_id", "evolves_to", "required_upgrade_level"},
    },
    "Augments": {
        "required": {
            "augment_id",
            "tier",
            "target",
            "stat1",
            "op1",
            "val1",
            "stat2",
            "op2",
            "val2",
        },
    },
    "LevelCurve": {
        "required": {"level", "xp_to_next"},
    },
    "Stages": {
        "required": {"stage_id", "chapter_id", "time_limit_sec", "goal_increment_likes"},
    },
    "StageSpawns": {
        "required": {"stage_id", "pigeon_id", "count"},
    },
}


class MissingSheetError(KeyError):
    """Raised when a required sheet is missing."""


class MissingColumnError(KeyError):
    """Raised when a required column is missing."""


def _validate_columns(df: pd.DataFrame, required: Iterable[str], tab: str) -> None:
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise MissingColumnError(f"Missing columns in {tab}: {', '.join(missing)}")


def validate_dfs(dfs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
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

        _validate_columns(df, meta["required"], tab)
        cleaned[tab] = df
    return cleaned


def make_stage_order(dfs: Dict[str, pd.DataFrame], chapter_id: str) -> List[str]:
    """Return the ordered stage_ids for a chapter.

    If an ``order`` column exists on the Stages sheet, use it; otherwise
    preserve the existing row order from the sheet.
    """

    stages = dfs.get("Stages")
    if stages is None:
        raise MissingSheetError("Missing expected sheet/tab 'Stages'")

    filtered = stages[stages["chapter_id"] == chapter_id]
    if filtered.empty:
        return []

    if "order" in filtered.columns:
        filtered = filtered.sort_values("order")

    return [str(sid) for sid in list(filtered["stage_id"])]
