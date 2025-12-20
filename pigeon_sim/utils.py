"""Utility helpers for presenting simulator results."""
from __future__ import annotations

from typing import Iterable

from .core import RunResult


def summarize_results(results: Iterable[RunResult]) -> str:
    """Return a simple text summary of run results."""

    lines = ["cleared\tclear_time\tend_level\thearts\tseq"]
    for res in results:
        seq = ",".join(res.seq)
        clear_time = "inf" if res.clear_time == float("inf") else f"{res.clear_time:.3f}"
        lines.append(
            f"{res.cleared}\t{clear_time}\t{res.end_level}\t{res.hearts}\t{seq}"
        )
    return "\n".join(lines)


__all__ = ["summarize_results"]
