from __future__ import annotations

import random
import unittest

import pandas as pd

from sim.config import SimConfig
from sim.simulator import run_many, run_one


class SimSmokeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dfs = {
            "Characters": pd.DataFrame([{"name": "Hero", "attack": 2.0}]),
            "Pigeons": pd.DataFrame(
                [
                    {"pigeon_id": "P1", "hp": 10, "picky_rate": 0.1, "likes_reward": 1.0},
                    {"pigeon_id": "P2", "hp": 20, "picky_rate": 0.2, "likes_reward": 2.0},
                ]
            ),
            "Weapons": pd.DataFrame(
                [
                    {"weapon_id": "W1", "damage": 1.0, "shots_per_sec": 2.0, "accuracy": 1.0},
                    {"weapon_id": "W2", "damage": 2.0, "shots_per_sec": 2.0, "accuracy": 1.0},
                ]
            ),
            "WeaponEvolutions": pd.DataFrame(
                [
                    {"weapon_id": "W1", "evolves_to": "W2", "required_upgrade_level": 2},
                ]
            ),
            "Augments": pd.DataFrame(
                [
                    {"augment_id": "A1", "rarity": "SILVER", "target": "PLAYER", "stat": "attack", "op": "ADD", "val": 0.5},
                    {
                        "augment_id": "A2",
                        "rarity": "SILVER",
                        "target": "WEAPON",
                        "stat": "damage",
                        "op": "ADD",
                        "val": 0.5,
                        "applies_to_weapon_id": "W1",
                    },
                ]
            ),
            "LevelCurve": pd.DataFrame(
                [
                    {"level": 1, "xp_to_next": 2},
                    {"level": 2, "xp_to_next": 2},
                ]
            ),
            "Stages": pd.DataFrame(
                [
                    {"stage_name": "S1", "time_limit_sec": 30, "goal_total_likes": 5},
                ]
            ),
            "StageSpawns": pd.DataFrame(
                [
                    {"stage_name": "S1", "pigeon_id": "P1", "count": 3},
                    {"stage_name": "S1", "pigeon_id": "P2", "count": 1},
                ]
            ),
        }

    def test_run_one(self) -> None:
        config = SimConfig(character_name="Hero", starting_weapon_id="W1", stage_order=["S1"], rng_seed=1)
        result = run_one(self.dfs, config)
        self.assertTrue(result.stages)
        self.assertTrue(result.total_likes > 0)
        self.assertEqual(result.stages[0].stage_name, "S1")

    def test_run_many_with_evolution(self) -> None:
        config = SimConfig(character_name="Hero", starting_weapon_id="W1", stage_order=["S1"], rng_seed=2)
        report = run_many(self.dfs, config, runs=3)
        self.assertEqual(len(report.runs), 3)
        # evolution requires two weapon augments; ensure at least one run hits it
        evolved_runs = [stage.evolved for run in report.runs for stage in run.stages]
        self.assertTrue(any(evolved_runs))


if __name__ == "__main__":
    unittest.main()
