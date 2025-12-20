"""DataFrame validation and normalization utilities."""

from __future__ import annotations

from typing import Dict, Iterable, List

import pandas as pd

EXPECTED_TABS = {
    "Characters": {
        "required": {
            "character_id",
            "name",
            "base_attack",
            "base_attack_speed",
            "base_move_speed",
            "base_hp",
            "fatigue_resist",
            "notes",
        },
    },
    "Pigeons": {
        "required": {
            "pigeon_id",
            "name",
            "hp",
            "move_speed",
            "fatigue",
            "fatigue_speed",
            "picky_rate",
            "good_reward",
            "behavior_key",
            "behavior_desc",
            "notes",
        },
    },
    "Weapons": {
        "required": {
            "weapon_id",
            "family",
            "weapon_tier",
            "name",
            "base_damage",
            "base_attack_speed",
            "notes",
        },
    },
    "WeaponEvolutions": {
        "required": {"from_weapon_id", "to_weapon_id", "required_upgrade_level", "notes"},
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
            "notes",
        },
    },
    "LevelCurve": {
        "required": {"level", "xp_to_next"},
    },
    "Stages": {
        "required": {
            "stage_id",
            "chapter_id",
            "time_limit_sec",
            "goal_increment_likes",
            "goal_total_likes",
            "notes",
        },
    },
    "StageSpawns": {
        "required": {"stage_id", "pigeon_id", "count", "notes"},
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


def _is_missing(value: object) -> bool:
    try:
        import pandas as real_pd  # type: ignore

        return bool(real_pd.isna(value))  # type: ignore[attr-defined]
    except Exception:
        try:
            return value is None or value != value
        except Exception:
            return True


def _fill_goal_totals(stages: pd.DataFrame) -> pd.DataFrame:
    """Fill missing goal_total_likes values using cumulative increments per chapter."""

    if hasattr(stages, "rows"):
        filled = stages.copy()
        chapters = []
        for row in getattr(filled, "rows", []):
            chapter = row.get("chapter_id")
            if chapter not in chapters:
                chapters.append(chapter)

        for chapter_id in chapters:
            indices = [
                i for i, row in enumerate(getattr(filled, "rows", [])) if row.get("chapter_id") == chapter_id
            ]
            order_present = any("order" in filled.rows[i] for i in indices) if getattr(filled, "rows", None) else False
            sorted_indices = (
                sorted(indices, key=lambda idx: filled.rows[idx].get("order", idx)) if order_present else indices
            )

            cumulative = 0.0
            for idx in sorted_indices:
                row = filled.rows[idx]
                cumulative += float(row.get("goal_increment_likes", 0))
                if _is_missing(row.get("goal_total_likes")):
                    row["goal_total_likes"] = cumulative

        return filled

    import pandas as pd  # type: ignore

    def _fill_group(group: pd.DataFrame) -> pd.DataFrame:
        ordered = group.sort_values("order") if "order" in group.columns else group
        cumulative = ordered["goal_increment_likes"].cumsum()
        needs_fill = ordered["goal_total_likes"].isna()
        ordered.loc[needs_fill, "goal_total_likes"] = cumulative[needs_fill]
        return ordered

    return (
        stages.groupby("chapter_id", group_keys=False)
        .apply(_fill_group)
        .sort_index()
    )


def validate_dfs(dfs: Dict[str, pd.DataFrame]) -> Dict[str, pd.DataFrame]:
    """Validate presence of required sheets/columns and return clean copies."""

    cleaned: Dict[str, pd.DataFrame] = {}
    for tab, meta in EXPECTED_TABS.items():
        if tab not in dfs:
            raise MissingSheetError(f"Missing expected sheet/tab '{tab}'")
        df = dfs[tab].copy()
        _validate_columns(df, meta["required"], tab)

        if tab == "Stages":
            df = _fill_goal_totals(df)

        cleaned[tab] = df
    return cleaned


def print_schema_expectations() -> None:
    """Print the required columns for each expected tab."""

    for tab, meta in EXPECTED_TABS.items():
        cols = sorted(meta["required"])
        extra_note = " (allows extra columns)" if tab == "Augments" else ""
        print(f"{tab}:{extra_note}\n  - " + ", ".join(cols))


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
