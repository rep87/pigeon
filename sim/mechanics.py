"""Core mechanics and helper utilities for the simulator."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence

import pandas as pd

from .state import PlayerState, WeaponState


@dataclass
class StageSnapshot:
    """Computed stats for a stage before simulation."""

    avg_effective_hp: float
    avg_reward: float


@dataclass
class Augment:
    """Normalized augment row."""

    augment_id: str
    tier: str
    target: str
    effects: Sequence[tuple[str, str, float]]


def build_stage_snapshot(stage_id: str, spawns_df: pd.DataFrame, pigeons_df: pd.DataFrame) -> StageSnapshot:
    """Calculate aggregated effective HP and reward for a stage.

    Args:
        stage_id: Stage identifier to filter spawns.
        spawns_df: DataFrame with columns [stage_id, pigeon_id, count].
        pigeons_df: DataFrame with columns [pigeon_id, hp, picky_rate, good_reward].

    Returns:
        StageSnapshot with averaged effective hp and reward values.
    """

    stage_spawns = spawns_df[spawns_df["stage_id"] == stage_id]
    if stage_spawns.empty:
        return StageSnapshot(avg_effective_hp=1.0, avg_reward=0.0)

    merged = stage_spawns.merge(pigeons_df, on="pigeon_id", how="left")
    denom = (1 - merged["picky_rate"]).clip(lower=1e-6)
    merged["effective_hp"] = merged["hp"] / denom
    merged["weighted_hp"] = merged["effective_hp"] * merged["count"]
    merged["weighted_reward"] = merged["good_reward"] * merged["count"]

    total_count = merged["count"].sum()
    avg_effective_hp = merged["weighted_hp"].sum() / max(total_count, 1e-6)
    avg_reward = merged["weighted_reward"].sum() / max(total_count, 1e-6)

    return StageSnapshot(avg_effective_hp=avg_effective_hp, avg_reward=avg_reward)


def compute_dps(player: PlayerState, weapon: WeaponState) -> float:
    """Compute a simple damage-per-second metric from player and weapon stats."""

    return player.attack * weapon.damage * weapon.shots_per_sec * weapon.accuracy


def apply_augments(target: PlayerState | WeaponState, augment: Augment) -> None:
    """Apply an augment to the provided target.

    Args:
        target: PlayerState or WeaponState that will be mutated.
        augment: The augment definition to apply.
    """

    for stat, op, val in augment.effects:
        if not hasattr(target, stat):
            continue

        current = getattr(target, stat)
        if op == "ADD":
            updated = current + val
        elif op == "MUL":
            updated = current * val
        else:
            raise ValueError(f"Unsupported augment op: {op}")

        setattr(target, stat, updated)

    if isinstance(target, WeaponState) and augment.target == "WEAPON":
        target.upgrade_count += 1


def maybe_evolve_weapon(
    weapon: WeaponState,
    evolutions: pd.DataFrame,
    weapons_lookup: Dict[str, WeaponState],
    rng,
    policy: str = "RANDOM",
) -> bool:
    """Attempt to evolve the weapon based on upgrade count.

    Returns True if an evolution occurred.
    """

    candidates = evolutions[evolutions["from_weapon_id"] == weapon.weapon_id]
    eligible_rows = [
        row
        for _, row in candidates.iterrows()
        if float(row.get("required_upgrade_level", 0)) <= weapon.upgrade_count
    ]
    if not eligible_rows:
        return False

    if policy.upper() == "FIRST":
        if eligible_rows and hasattr(candidates, "sort_values") and "order" in candidates.columns:
            chosen = candidates.sort_values("order").iloc[0]
        else:
            chosen = eligible_rows[0]
    else:
        chosen = rng.choice(eligible_rows) if len(eligible_rows) > 1 else eligible_rows[0]

    target_id = chosen["to_weapon_id"]
    if target_id not in weapons_lookup:
        return False

    evolved = weapons_lookup[target_id].copy()
    preserved_upgrades = weapon.upgrade_count
    weapon.weapon_id = evolved.weapon_id
    weapon.damage = evolved.damage
    weapon.shots_per_sec = evolved.shots_per_sec
    weapon.accuracy = evolved.accuracy
    weapon.upgrade_count = preserved_upgrades
    return True


def _collect_effects(row: pd.Series) -> List[tuple[str, str, float]]:
    effects: List[tuple[str, str, float]] = []
    try:
        is_missing = pd.isna  # type: ignore[attr-defined]
    except AttributeError:  # pragma: no cover - fallback for stubby pandas
        def is_missing(value: object) -> bool:
            try:
                return value is None or value != value
            except Exception:
                return True

    for idx in (1, 2):
        stat_key = f"stat{idx}"
        op_key = f"op{idx}"
        val_key = f"val{idx}"
        if stat_key not in row or is_missing(row[stat_key]):
            continue
        raw_val = row.get(val_key, 0)
        val = 0.0 if is_missing(raw_val) else float(raw_val)
        effects.append((str(row[stat_key]), str(row.get(op_key, "ADD")).upper(), val))
    return effects


def normalize_augments(df: pd.DataFrame) -> Iterable[Augment]:
    """Yield normalized augment rows."""

    for _, row in df.iterrows():
        yield Augment(
            augment_id=str(row["augment_id"]),
            tier=str(row.get("tier", "SILVER")),
            target=str(row["target"]).upper(),
            effects=_collect_effects(row),
        )


def build_weapon_lookup(weapons_df: pd.DataFrame) -> Dict[str, WeaponState]:
    """Create WeaponState templates keyed by weapon_id."""

    lookup: Dict[str, WeaponState] = {}
    for _, row in weapons_df.iterrows():
        lookup[str(row["weapon_id"])] = WeaponState(
            weapon_id=str(row["weapon_id"]),
            damage=float(row.get("base_damage", 0)),
            shots_per_sec=float(row.get("base_attack_speed", 0)),
            accuracy=float(row.get("accuracy", 1.0)),
            upgrade_count=0,
        )
    return lookup


def build_character_lookup(characters_df: pd.DataFrame) -> Dict[str, PlayerState]:
    """Create PlayerState templates keyed by character_id."""

    lookup: Dict[str, PlayerState] = {}
    for _, row in characters_df.iterrows():
        lookup[str(row["character_id"])] = PlayerState(
            character_id=str(row["character_id"]),
            attack=float(row.get("base_attack", 1.0)),
            level=1,
            xp=0.0,
        )
    return lookup
