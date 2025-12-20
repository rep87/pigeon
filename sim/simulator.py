"""Stage simulation loops."""

from __future__ import annotations

import random
from typing import Dict

import pandas as pd

from .config import SimConfig
from .io import make_stage_order, validate_dfs
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


def _select_augments(pool: Iterable[Augment], tier: str, rng: random.Random, count: int) -> list[Augment]:
    filtered = [aug for aug in pool if aug.tier.upper() == tier.upper()]
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
    time_limit: float,
    player: PlayerState,
    level_curve: pd.DataFrame,
    augments: list[Augment],
    offers_per_level: int,
    offer_tier: str,
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
        time_to_level = likes_to_level / likes_rate if likes_rate > 0 else float("inf")
        time_remaining = time_limit - time_elapsed

        if time_remaining <= 0 or time_to_level == float("inf"):
            break

        if time_to_level > time_remaining:
            likes_total += likes_rate * time_remaining
            time_elapsed += time_remaining
            player.xp += likes_rate * time_remaining
            break

        # reach level-up before timer ends
        time_elapsed += time_to_level
        likes_total += time_to_level * likes_rate
        player.xp += time_to_level * likes_rate

        player.level += 1
        player.xp = 0
        offers = _select_augments(augments, offer_tier, rng, offers_per_level)
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

    # add any remaining time without a level-up event
    remaining = time_limit - time_elapsed
    if remaining > 0 and likes_rate > 0:
        likes_total += likes_rate * remaining
        time_elapsed += remaining
        player.xp += likes_rate * remaining

    return likes_total, time_elapsed, player.level, applied


def run_one(dfs: Dict[str, pd.DataFrame], config: SimConfig, rng: random.Random | None = None) -> RunResult:
    """Run a single simulation using the supplied dataframes and configuration."""

    rng = rng or random.Random(config.seed)
    cleaned = validate_dfs(dfs)

    augments = list(normalize_augments(cleaned["Augments"]))
    weapon_templates = build_weapon_lookup(cleaned["Weapons"])
    character_templates = build_character_lookup(cleaned["Characters"])

    if config.character_id not in character_templates:
        raise SimulationError(f"Character '{config.character_id}' not found")
    if config.starting_weapon_id not in weapon_templates:
        raise SimulationError(f"Weapon '{config.starting_weapon_id}' not found")

    stage_order = make_stage_order(cleaned, config.chapter_id)
    if not stage_order:
        raise SimulationError(f"No stages found for chapter '{config.chapter_id}'")

    player = character_templates[config.character_id].copy()
    weapon = weapon_templates[config.starting_weapon_id].copy()

    stage_results: list[StageResult] = []
    total_likes = 0.0
    cumulative_goal = 0.0

    for stage_id in stage_order:
        stage_row = cleaned["Stages"][cleaned["Stages"]["stage_id"] == stage_id]
        if stage_row.empty:
            raise SimulationError(f"Stage '{stage_id}' missing from Stages sheet")

        stage_row = stage_row.iloc[0]
        time_limit = float(stage_row["time_limit_sec"])
        cumulative_goal += float(stage_row["goal_increment_likes"])

        snapshot = build_stage_snapshot(stage_id, cleaned["StageSpawns"], cleaned["Pigeons"])
        dps = compute_dps(player, weapon)
        likes_rate = (dps / snapshot.avg_effective_hp) * snapshot.avg_reward if snapshot.avg_effective_hp > 0 else 0.0

        likes_gained, elapsed, _, applied_augments = _advance_timer(
            likes_rate=likes_rate,
            time_limit=time_limit,
            player=player,
            level_curve=cleaned["LevelCurve"],
            augments=augments,
            offers_per_level=config.offers_per_levelup,
            offer_tier=config.offer_tier,
            rng=rng,
        )

        for aug in applied_augments:
            if aug.target != "WEAPON":
                continue
            apply_augments(weapon, aug)

        total_likes += likes_gained
        passed = total_likes >= cumulative_goal and elapsed <= time_limit
        evolved = False

        if passed and config.evolve_on_stage_clear:
            evolved = maybe_evolve_weapon(
                weapon,
                cleaned["WeaponEvolutions"],
                weapon_templates,
                rng,
                policy=config.evolve_policy,
            )

        stage_results.append(
            StageResult(
                stage_name=stage_id,
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
        total_likes=total_likes,
        final_weapon=weapon.weapon_id,
        stages=stage_results,
    )


def run_many(dfs: Dict[str, pd.DataFrame], config: SimConfig) -> SimReport:
    """Execute many runs with independent RNG seeds to build a report."""

    base_seed = config.seed
    run_results = [
        run_one(
            dfs,
            config,
            random.Random(base_seed + i if base_seed is not None else None),
        )
        for i in range(config.num_runs)
    ]
    return SimReport(runs=run_results)
