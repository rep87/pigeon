"""Stage simulation loops."""

from __future__ import annotations

import random
from typing import Dict

import pandas as pd

from .config import SimConfig
from .io import normalize_inputs
from .mechanics import (
    Augment,
    apply_augments,
    build_character_lookup,
    build_stage_snapshot,
    build_weapon_lookup,
    compute_dps,
    maybe_evolve_weapon,
    normalize_augments,
)
from .report import RunResult, SimReport, StageResult
from .state import PlayerState, WeaponState


class SimulationError(RuntimeError):
    """General simulation failure."""


def _select_augments(pool: Iterable[Augment], rarity: str, rng: random.Random, count: int) -> list[Augment]:
    filtered = [aug for aug in pool if aug.rarity.upper() == rarity.upper()]
    if not filtered:
        return []
    return rng.sample(filtered, k=min(count, len(filtered)))


def _xp_to_next(level_curve: pd.DataFrame, level: int) -> float:
    matches = level_curve[level_curve["level"] == level]
    if matches.empty:
        return float(level_curve["xp_to_next"].iloc[-1])
    return float(matches.iloc[0]["xp_to_next"])


def _advance_timer(
    likes_rate: float,
    goal: float,
    time_limit: float,
    player: PlayerState,
    level_curve: pd.DataFrame,
    augments: list[Augment],
    offers_per_level: int,
    offer_rarity: str,
    rng: random.Random,
) -> tuple[float, float, int, list[Augment]]:
    """Advance time through level-ups within a stage.

    Returns accumulated likes, elapsed time, resulting level, and applied augments.
    """

    likes_total = 0.0
    time_elapsed = 0.0
    applied: list[Augment] = []

    while likes_rate > 0 and time_elapsed < time_limit:
        xp_needed = _xp_to_next(level_curve, player.level)
        likes_to_level = xp_needed - player.xp
        time_to_level = likes_to_level / likes_rate

        time_to_goal = (goal - likes_total) / likes_rate if goal > likes_total else 0
        time_remaining = time_limit - time_elapsed

        if time_remaining <= 0:
            break

        if time_to_goal <= 0:
            break

        # if timer expires before any threshold
        next_event_time = min(time_to_goal, time_to_level)
        if next_event_time > time_remaining:
            likes_total += likes_rate * time_remaining
            time_elapsed += time_remaining
            player.xp += likes_rate * time_remaining
            break

        if time_to_goal < time_to_level:
            likes_total += likes_rate * time_to_goal
            time_elapsed += time_to_goal
            player.xp += likes_rate * time_to_goal
            break

        # reach level-up before goal
        time_elapsed += time_to_level
        likes_total += time_to_level * likes_rate
        player.xp += time_to_level * likes_rate

        player.level += 1
        player.xp = 0
        offers = _select_augments(augments, offer_rarity, rng, offers_per_level)
        if offers:
            picked = rng.choice(offers)
            applied.append(picked)
        else:
            picked = None

        if picked and picked.target == "PLAYER":
            apply_augments(player, picked)
        elif picked and picked.target == "WEAPON":
            # weapon upgrades handled by caller once chosen
            pass

    return likes_total, time_elapsed, player.level, applied


def run_one(dfs: Dict[str, pd.DataFrame], config: SimConfig, rng: random.Random | None = None) -> RunResult:
    """Run a single simulation using the supplied dataframes and configuration."""

    rng = rng or random.Random(config.rng_seed)
    cleaned = normalize_inputs(dfs)

    augments = list(normalize_augments(cleaned["Augments"]))
    weapon_templates = build_weapon_lookup(cleaned["Weapons"])
    character_templates = build_character_lookup(cleaned["Characters"])

    if config.character_name not in character_templates:
        raise SimulationError(f"Character '{config.character_name}' not found")
    if config.starting_weapon_id not in weapon_templates:
        raise SimulationError(f"Weapon '{config.starting_weapon_id}' not found")

    player = character_templates[config.character_name].copy()
    weapon = weapon_templates[config.starting_weapon_id].copy()

    stage_results: list[StageResult] = []

    for stage_name in config.stage_order:
        if stage_name not in set(cleaned["Stages"]["stage_name"]):
            raise SimulationError(f"Stage '{stage_name}' missing from Stages sheet")

        stage_row = cleaned["Stages"][cleaned["Stages"]["stage_name"] == stage_name].iloc[0]
        time_limit = float(stage_row["time_limit_sec"])
        goal = float(stage_row["goal_total_likes"])

        snapshot = build_stage_snapshot(stage_name, cleaned["StageSpawns"], cleaned["Pigeons"])
        dps = compute_dps(player, weapon)
        likes_rate = (dps / snapshot.avg_effective_hp) * snapshot.avg_reward if snapshot.avg_effective_hp > 0 else 0.0

        likes_gained, elapsed, _, applied_augments = _advance_timer(
            likes_rate=likes_rate,
            goal=goal,
            time_limit=time_limit,
            player=player,
            level_curve=cleaned["LevelCurve"],
            augments=augments,
            offers_per_level=config.offers_per_level,
            offer_rarity=config.offer_rarity,
            rng=rng,
        )

        # apply weapon augments post level-up selections
        for aug in applied_augments:
            if aug.target != "WEAPON":
                continue
            if aug.applies_to_weapon_id and aug.applies_to_weapon_id != weapon.weapon_id:
                continue
            apply_augments(weapon, aug)

        passed = likes_gained >= goal and elapsed <= time_limit
        evolved = False

        if passed:
            evolved = maybe_evolve_weapon(weapon, cleaned["WeaponEvolutions"], weapon_templates)

        stage_results.append(
            StageResult(
                stage_name=stage_name,
                passed=passed,
                likes_gained=likes_gained,
                end_level=player.level,
                evolved=evolved,
            )
        )

        if not passed:
            break

    return RunResult(
        passed=all(stage.passed for stage in stage_results) if stage_results else False,
        final_level=player.level,
        total_likes=sum(stage.likes_gained for stage in stage_results),
        final_weapon=weapon.weapon_id,
        stages=stage_results,
    )


def run_many(dfs: Dict[str, pd.DataFrame], config: SimConfig, runs: int = 10) -> SimReport:
    """Execute many runs with independent RNG seeds to build a report."""

    run_results = [
        run_one(
            dfs,
            config,
            random.Random(config.rng_seed + i if config.rng_seed is not None else None),
        )
        for i in range(runs)
    ]
    return SimReport(runs=run_results)
