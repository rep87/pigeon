"""Helpers for brute-force search over upgrade choices."""
from __future__ import annotations

from typing import List, Tuple

from .core import RunResult, enumerate_and_rank as _enumerate_and_rank


def enumerate_and_rank(
    choices: List[str],
    depth: int,
    top_k: int,
    bottom_k: int,
    **sim_kwargs,
) -> Tuple[List[RunResult], List[RunResult], List[RunResult]]:
    """Public wrapper around :func:`pigeon_sim.core.enumerate_and_rank`."""

    return _enumerate_and_rank(
        choices=choices,
        depth=depth,
        top_k=top_k,
        bottom_k=bottom_k,
        **sim_kwargs,
    )


__all__ = ["enumerate_and_rank"]
