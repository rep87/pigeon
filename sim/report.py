"""Reporting helpers for simulation runs."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class StageResult:
    """Per-stage outcome."""

    stage_name: str
    passed: bool
    likes_gained: float
    end_level: int
    evolved: bool = False


@dataclass
class RunResult:
    """Single run result record."""

    passed: bool
    final_level: int
    total_likes: float
    final_weapon: str
    stages: List[StageResult] = field(default_factory=list)


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
