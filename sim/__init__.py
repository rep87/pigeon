"""Lightweight simulation package for a stage-based balancing sandbox."""

from .config import SimConfig
from .report import RunResult, SimReport
from .simulator import run_many, run_one

__all__ = [
    "SimConfig",
    "RunResult",
    "SimReport",
    "run_one",
    "run_many",
]
