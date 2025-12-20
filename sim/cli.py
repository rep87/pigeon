"""Small CLI wrapper for ad-hoc simulations."""

from __future__ import annotations

import argparse
import pickle
import random
from pathlib import Path
from typing import Any, Dict

import pandas as pd

from .config import SimConfig
from .report import SimReport
from .simulator import run_many


def load_pickle(path: Path) -> Dict[str, pd.DataFrame]:
    with path.open("rb") as f:
        obj = pickle.load(f)
    if not isinstance(obj, dict):
        raise ValueError("Pickle must contain a dict[str, DataFrame]")
    return obj


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Balance sim runner")
    parser.add_argument("--sheet-json", type=Path, required=True, help="Pickled dict of DataFrames")
    parser.add_argument("--character", required=True)
    parser.add_argument("--weapon", required=True)
    parser.add_argument("--stages", nargs="+", required=True)
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--seed", type=int, default=None)

    args = parser.parse_args(argv)
    dfs = load_pickle(args.sheet_json)

    config = SimConfig(
        character_name=args.character,
        starting_weapon_id=args.weapon,
        stage_order=args.stages,
        rng_seed=args.seed,
    )

    report: SimReport = run_many(dfs, config, runs=args.runs)

    print(f"Ran {len(report.runs)} simulations. Success rate: {report.success_rate:.2%}")
    top = report.top_runs(3)
    if top:
        print("Top runs:")
        for run in top:
            print(f"  likes={run.total_likes:.1f}, final_level={run.final_level}, weapon={run.final_weapon}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
