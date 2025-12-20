"""Core mechanics and helper utilities for the simulator."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable

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
    rarity: str
    target: str
    stat: str
    op: str
    val: float
    applies_to_weapon_id: str | None = None


def build_stage_snapshot(stage_name: str, spawns_df: pd.DataFrame, pigeons_df: pd.DataFrame) -> StageSnapshot:
    """Calculate aggregated effective HP and reward for a stage.

    Args:
        stage_name: Stage identifier to filter spawns.
        spawns_df: DataFrame with columns [stage_name, pigeon_id, count].
        pigeons_df: DataFrame with columns [pigeon_id, hp, picky_rate, likes_reward].

    Returns:
        StageSnapshot with averaged effective hp and reward values.
    """

    stage_spawns = spawns_df[spawns_df["stage_name"] == stage_name]
    if stage_spawns.empty:
        return StageSnapshot(avg_effective_hp=1.0, avg_reward=0.0)

    merged = stage_spawns.merge(pigeons_df, on="pigeon_id", how="left")
    denom = (1 - merged["picky_rate"]).clip(lower=1e-6)
    merged["effective_hp"] = merged["hp"] / denom
    merged["weighted_hp"] = merged["effective_hp"] * merged["count"]
    merged["weighted_reward"] = merged["likes_reward"] * merged["count"]

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

    op = augment.op.upper()
    stat = augment.stat

    if not hasattr(target, stat):
        return

    current = getattr(target, stat)
    if op == "ADD":
        updated = current + augment.val
    elif op == "MUL":
        updated = current * augment.val
    else:
        raise ValueError(f"Unsupported augment op: {augment.op}")

    setattr(target, stat, updated)

    if isinstance(target, WeaponState):
        target.upgrade_count += 1


def maybe_evolve_weapon(
    weapon: WeaponState,
    evolutions: pd.DataFrame,
    weapons_lookup: Dict[str, WeaponState],
) -> bool:
    """Attempt to evolve the weapon based on upgrade count.

    Returns True if an evolution occurred.
    """

    candidates = evolutions[evolutions["weapon_id"] == weapon.weapon_id]
    if candidates.empty:
        return False

    row = candidates.iloc[0]
    required = float(row.get("required_upgrade_level", 0))
    if weapon.upgrade_count < required:
        return False

    target_id = row["evolves_to"]
    if target_id not in weapons_lookup:
        return False

    evolved = weapons_lookup[target_id].copy()
    weapon.weapon_id = evolved.weapon_id
    weapon.damage = evolved.damage
    weapon.shots_per_sec = evolved.shots_per_sec
    weapon.accuracy = evolved.accuracy
    weapon.upgrade_count = 0
    return True


def normalize_augments(df: pd.DataFrame) -> Iterable[Augment]:
    """Yield normalized augment rows."""

    for _, row in df.iterrows():
        yield Augment(
            augment_id=str(row["augment_id"]),
            rarity=str(row.get("rarity", "SILVER")),
            target=str(row["target"]).upper(),
            stat=str(row["stat"]),
            op=str(row["op"]).upper(),
            val=float(row["val"]),
            applies_to_weapon_id=str(row["applies_to_weapon_id"])
            if "applies_to_weapon_id" in row and pd.notna(row["applies_to_weapon_id"])
            else None,
        )


def build_weapon_lookup(weapons_df: pd.DataFrame) -> Dict[str, WeaponState]:
    """Create WeaponState templates keyed by weapon_id."""

    lookup: Dict[str, WeaponState] = {}
    for _, row in weapons_df.iterrows():
        lookup[str(row["weapon_id"])] = WeaponState(
            weapon_id=str(row["weapon_id"]),
            damage=float(row["damage"]),
            shots_per_sec=float(row["shots_per_sec"]),
            accuracy=float(row.get("accuracy", 1.0)),
            upgrade_count=0,
        )
    return lookup


def build_character_lookup(characters_df: pd.DataFrame) -> Dict[str, PlayerState]:
    """Create PlayerState templates keyed by character name."""

    lookup: Dict[str, PlayerState] = {}
    for _, row in characters_df.iterrows():
        lookup[str(row["name"])] = PlayerState(
            name=str(row["name"]),
            attack=float(row.get("attack", row.get("base_attack", 1.0))),
            level=1,
            xp=0.0,
        )
    return lookup
