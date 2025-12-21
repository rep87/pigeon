"""Reporting helpers for simulation runs and exports."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

import pandas as pd


@dataclass
class StageResult:
    """Per-stage outcome."""

    stage_name: str
    passed: bool
    likes_gained: float
    end_level: int
    evolved: bool = False
    stage_index: int = -1
    cumulative_likes: float = 0.0
    stage_time_limit_sec: float = 0.0
    stage_goal_total_likes: float = 0.0
    met_goal: bool = False
    stage_player_attack: float | None = None
    stage_weapon_damage: float | None = None
    stage_weapon_shots_per_sec: float | None = None
    stage_weapon_upgrade_count: int | None = None
    stage_chosen_augments: List[str] = field(default_factory=list)
    stage_elapsed_sec: float | None = None


@dataclass
class RunResult:
    """Single run result record."""

    passed: bool
    final_level: int
    total_likes: float
    final_weapon: str
    stages: List[StageResult] = field(default_factory=list)
    run_id: int = 0
    reached_stage: Optional[str] = None
    reached_stage_index: int = -1
    fail_stage: Optional[str] = None
    num_stages_passed: int = 0
    evolved_count: int = 0
    picked_augments: List[str] = field(default_factory=list)
    picked_augments_by_stage: Dict[str, List[str]] = field(default_factory=dict)
    final_player_stats: Dict[str, float] = field(default_factory=dict)
    final_weapon_stats: Dict[str, float] = field(default_factory=dict)
    chosen_augments: List[str] = field(default_factory=list)
    final_player_attack: float | None = None
    final_weapon_damage: float | None = None
    final_weapon_shots_per_sec: float | None = None
    final_weapon_upgrade_count: int | None = None
    choices: List[Dict] = field(default_factory=list)


@dataclass
class SimReport:
    """Aggregated run report."""

    runs: List[RunResult]

    @property
    def success_rate(self) -> float:
        if not self.runs:
            return 0.0
        return sum(1 for r in self.runs if r.passed) / len(self.runs)

    @property
    def average_final_level(self) -> float:
        if not self.runs:
            return 0.0
        return sum(r.final_level for r in self.runs) / len(self.runs)

    def top_runs(self, k: int = 3) -> List[RunResult]:
        return sorted(self.runs, key=lambda r: r.total_likes, reverse=True)[:k]

    def bottom_runs(self, k: int = 3) -> List[RunResult]:
        return sorted(self.runs, key=lambda r: r.total_likes)[:k]

    def to_dfs(self) -> Dict[str, pd.DataFrame]:
        """Export core telemetry into pandas DataFrames for analysis."""

        runs_records = []
        stages_records = []
        choices_records = []

        for run in self.runs:
            runs_records.append(
                {
                    "run_id": run.run_id,
                    "passed": run.passed,
                    "final_level": run.final_level,
                    "total_likes": run.total_likes,
                    "final_weapon": run.final_weapon,
                    "reached_stage": run.reached_stage,
                    "reached_stage_index": run.reached_stage_index,
                    "fail_stage": run.fail_stage,
                    "num_stages_passed": run.num_stages_passed,
                    "evolved_count": run.evolved_count,
                    "chosen_augments": "|".join(run.chosen_augments),
                    "chosen_augments_count": len(run.chosen_augments),
                    "final_player_attack": run.final_player_attack
                    if run.final_player_attack is not None
                    else run.final_player_stats.get("attack"),
                    "final_weapon_damage": run.final_weapon_damage
                    if run.final_weapon_damage is not None
                    else run.final_weapon_stats.get("damage"),
                    "final_weapon_shots_per_sec": run.final_weapon_shots_per_sec
                    if run.final_weapon_shots_per_sec is not None
                    else run.final_weapon_stats.get("attack_speed")
                    or run.final_weapon_stats.get("shots_per_sec"),
                    "final_weapon_upgrade_count": run.final_weapon_upgrade_count
                    if run.final_weapon_upgrade_count is not None
                    else run.final_weapon_stats.get("upgrade_count"),
                }
            )

            for stage in run.stages:
                stages_records.append(
                    {
                        "run_id": run.run_id,
                        "stage_name": stage.stage_name,
                        "stage_index": stage.stage_index,
                        "passed": stage.passed,
                        "likes_gained": stage.likes_gained,
                        "cumulative_likes": stage.cumulative_likes,
                        "end_level": stage.end_level,
                        "evolved": stage.evolved,
                        "stage_time_limit_sec": stage.stage_time_limit_sec,
                        "stage_goal_total_likes": stage.stage_goal_total_likes,
                        "stage_player_attack": stage.stage_player_attack,
                        "stage_weapon_damage": stage.stage_weapon_damage,
                        "stage_weapon_shots_per_sec": stage.stage_weapon_shots_per_sec,
                        "stage_weapon_upgrade_count": stage.stage_weapon_upgrade_count,
                        "stage_chosen_augments": "|".join(stage.stage_chosen_augments),
                    }
                )

            for choice_index, choice in enumerate(run.choices):
                choices_records.append(
                    {
                        "run_id": run.run_id,
                        "stage_name": choice.get("stage_name"),
                        "stage_index": choice.get("stage_index"),
                        "level_before": choice.get("level_before"),
                        "offered_augments": "|".join(choice.get("offered_augments", [])),
                        "picked_augment_id": choice.get("picked_augment_id"),
                        "offer_tier": choice.get("offer_tier"),
                    }
                )

        runs_df = pd.DataFrame(runs_records)
        stages_df = pd.DataFrame(stages_records)
        choices_df = pd.DataFrame(choices_records)
        return {"runs": runs_df, "stages": stages_df, "choices": choices_df}

    def summary_text(self, top_k: int = 5) -> str:
        """Return a formatted summary string built from exported DataFrames."""

        dfs = self.to_dfs()
        runs_df = dfs["runs"]
        choices_df = dfs["choices"]

        if runs_df.empty:
            return "No runs recorded."

        def _col(df: pd.DataFrame, name: str) -> List:
            return list(df[name]) if name in df.columns else []

        def _mean(values: List[float]) -> float:
            clean = [v for v in values if v is not None]
            return (sum(clean) / len(clean)) if clean else 0.0

        def _median(values: List[float]) -> float:
            clean = sorted(v for v in values if v is not None)
            if not clean:
                return 0.0
            mid = len(clean) // 2
            if len(clean) % 2 == 1:
                return float(clean[mid])
            return float((clean[mid - 1] + clean[mid]) / 2)

        lines = []
        pass_rate = _mean([1 if v else 0 for v in _col(runs_df, "passed")]) * 100
        lines.append(f"Pass rate: {pass_rate:.1f}%")

        for col, label in (("final_level", "Final level"), ("total_likes", "Total likes")):
            values = _col(runs_df, col)
            if values:
                lines.append(f"{label} mean={_mean(values):.2f}, median={_median(values):.2f}")

        from collections import Counter

        fail_stages = [f for f in _col(runs_df, "fail_stage") if f]
        if fail_stages:
            top_fail = Counter(fail_stages).most_common(3)
            lines.append("Top fail stages: " + ", ".join(f"{k} ({v})" for k, v in top_fail))

        reached_indexes = _col(runs_df, "reached_stage_index")
        if reached_indexes:
            reach_counts = Counter(reached_indexes).most_common(5)
            lines.append(
                "Reached stage index distribution: "
                + ", ".join(f"{int(k)} ({v})" for k, v in reach_counts)
            )

        if not choices_df.empty:
            augment_ids = []
            for offered in _col(choices_df, "offered_augments"):
                if isinstance(offered, str) and offered:
                    augment_ids.extend(offered.split("|"))
            top_offers = Counter(augment_ids).most_common(top_k)
            if top_offers:
                lines.append(
                    "Top offered augments: " + ", ".join(f"{k} ({v})" for k, v in top_offers)
                )

            picks = _col(choices_df, "picked_augment_id")
            top_picks = Counter([p for p in picks if p]).most_common(top_k)
            if top_picks:
                lines.append(
                    "Top picked augments: " + ", ".join(f"{k} ({v})" for k, v in top_picks)
                )

            success_ids = {
                rid
                for rid, passed in zip(_col(runs_df, "run_id"), _col(runs_df, "passed"))
                if passed
            }
            success_picks = [
                pick
                for pick, run_id in zip(_col(choices_df, "picked_augment_id"), _col(choices_df, "run_id"))
                if run_id in success_ids and pick
            ]
            if success_picks:
                top_success_picks = Counter(success_picks).most_common(top_k)
                lines.append(
                    "Top picks (successful runs): "
                    + ", ".join(f"{k} ({v})" for k, v in top_success_picks)
                )

        return "\n".join(lines)
