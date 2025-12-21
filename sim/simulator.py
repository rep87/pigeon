"""Stage simulation loops."""

from __future__ import annotations

import random
from typing import Dict, Iterable, List

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
) -> tuple[float, float, int, list[Augment], List[str], List[Dict]]:
    """Advance time through level-ups within a stage.

    Returns accumulated likes, elapsed time, resulting level, and applied augments.
    """

    likes_total = 0.0
    time_elapsed = 0.0
    applied: list[Augment] = []
    picked_ids: List[str] = []
    choices: List[Dict] = []

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

        level_before = player.level
        player.level += 1
        player.xp = 0
        offers = _select_augments(augments, offer_tier, rng, offers_per_level)
        picked = rng.choice(offers) if offers else None

        if picked:
            applied.append(picked)
            picked_ids.append(picked.augment_id)

        choices.append(
            {
                "level_before": level_before,
                "offered_augments": [aug.augment_id for aug in offers] if offers else [],
                "picked_augment_id": picked.augment_id if picked else None,
                "offer_tier": offer_tier,
            }
        )

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

    return likes_total, time_elapsed, player.level, applied, picked_ids, choices


def run_one(
    dfs: Dict[str, pd.DataFrame],
    config: SimConfig,
    rng: random.Random | None = None,
    run_id: int = 0,
) -> RunResult:
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
    stage_picks: Dict[str, List[str]] = {}
    all_picks: List[str] = []
    all_choices: List[Dict] = []
    total_likes = 0.0
    reached_stage: str | None = None
    fail_stage: str | None = None

    for stage_index, stage_id in enumerate(stage_order):
        stage_row = cleaned["Stages"][cleaned["Stages"]["stage_id"] == stage_id]
        if stage_row.empty:
            raise SimulationError(f"Stage '{stage_id}' missing from Stages sheet")

        stage_row = stage_row.iloc[0]
        time_limit = float(stage_row["time_limit_sec"])
        required_likes = float(stage_row["goal_total_likes"])

        snapshot = build_stage_snapshot(stage_id, cleaned["StageSpawns"], cleaned["Pigeons"])
        dps = compute_dps(player, weapon)
        likes_rate = (dps / snapshot.avg_effective_hp) * snapshot.avg_reward if snapshot.avg_effective_hp > 0 else 0.0

        likes_gained, elapsed, _, applied_augments, picked_ids, choices = _advance_timer(
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

        if picked_ids:
            stage_picks[stage_id] = stage_picks.get(stage_id, []) + picked_ids
            all_picks.extend(picked_ids)

        if choices:
            for choice in choices:
                choice_with_stage = {
                    **choice,
                    "stage_name": stage_id,
                    "stage_index": stage_index,
                }
                all_choices.append(choice_with_stage)

        total_likes += likes_gained
        passed = total_likes >= required_likes and elapsed <= time_limit
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
                stage_index=stage_index,
                cumulative_likes=total_likes,
                stage_time_limit_sec=time_limit,
                stage_goal_total_likes=required_likes,
                met_goal=passed,
                stage_player_attack=player.attack,
                stage_weapon_damage=weapon.damage,
                stage_weapon_shots_per_sec=weapon.shots_per_sec,
                stage_weapon_upgrade_count=weapon.upgrade_count,
                stage_chosen_augments=stage_picks.get(stage_id, []),
                stage_elapsed_sec=elapsed,
            )
        )

        reached_stage = stage_id
        if not passed:
            fail_stage = stage_id
            break

    reached_index = stage_order.index(reached_stage) if reached_stage in stage_order else -1
    num_stages_passed = sum(1 for s in stage_results if s.passed)
    evolved_count = sum(1 for s in stage_results if s.evolved)

    final_player_stats = {
        "attack": player.attack,
        "attack_speed": player.attack_speed,
        "move_speed": player.move_speed,
        "hp": player.hp,
    }
    final_weapon_stats = {
        "damage": weapon.damage,
        "attack_speed": weapon.shots_per_sec,
        "upgrade_count": weapon.upgrade_count,
    }

    return RunResult(
        passed=all(stage.passed for stage in stage_results) if stage_results else False,
        final_level=player.level,
        total_likes=total_likes,
        final_weapon=weapon.weapon_id,
        stages=stage_results,
        run_id=run_id,
        reached_stage=reached_stage,
        fail_stage=fail_stage,
        reached_stage_index=reached_index,
        num_stages_passed=num_stages_passed,
        evolved_count=evolved_count,
        picked_augments=all_picks,
        picked_augments_by_stage=stage_picks,
        final_player_stats=final_player_stats,
        final_weapon_stats=final_weapon_stats,
        chosen_augments=all_picks,
        final_player_attack=player.attack,
        final_weapon_damage=weapon.damage,
        final_weapon_shots_per_sec=weapon.shots_per_sec,
        final_weapon_upgrade_count=weapon.upgrade_count,
        choices=all_choices,
    )


def run_many(dfs: Dict[str, pd.DataFrame], config: SimConfig) -> SimReport:
    """Execute many runs with independent RNG seeds to build a report."""

    base_seed = config.seed
    run_results = [
        run_one(
            dfs,
            config,
            random.Random(base_seed + i if base_seed is not None else None),
            run_id=i,
        )
        for i in range(config.num_runs)
    ]
    report = SimReport(runs=run_results)
    if len(report.runs) != config.num_runs:
        raise SimulationError(
            f"Expected {config.num_runs} runs, but built {len(report.runs)}"
        )
    return report
