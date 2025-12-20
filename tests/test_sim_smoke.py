import unittest

import pandas as pd

from sim.config import SimConfig
from sim.simulator import run_many, run_one


class SimSmokeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dfs = {
            "Characters": pd.DataFrame([
                {"character_id": "CHAR_001", "attack": 2.0},
            ]),
            "Pigeons": pd.DataFrame(
                [
                    {"pigeon_id": 1, "hp": 10, "picky_rate": 0.1, "likes_reward": 1.0},
                    {"pigeon_id": 2, "hp": 20, "picky_rate": 0.2, "likes_reward": 2.0},
                ]
            ),
            "Weapons": pd.DataFrame(
                [
                    {"weapon_id": "BASIC_1", "damage": 1.0, "shots_per_sec": 2.0, "accuracy": 1.0},
                    {"weapon_id": "BASIC_EVOLVED", "damage": 2.0, "shots_per_sec": 2.0, "accuracy": 1.0},
                ]
            ),
            "WeaponEvolutions": pd.DataFrame(
                [
                    {"weapon_id": "BASIC_1", "evolves_to": "BASIC_EVOLVED", "required_upgrade_level": 2},
                ]
            ),
            "Augments": pd.DataFrame(
                [
                    {
                        "augment_id": "A1",
                        "tier": "SILVER",
                        "target": "PLAYER",
                        "stat1": "attack",
                        "op1": "ADD",
                        "val1": 0.5,
                        "stat2": None,
                        "op2": None,
                        "val2": None,
                    },
                    {
                        "augment_id": "A2",
                        "tier": "SILVER",
                        "target": "WEAPON",
                        "stat1": "damage",
                        "op1": "ADD",
                        "val1": 0.5,
                        "stat2": None,
                        "op2": None,
                        "val2": None,
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
                    {"stage_id": "CH1_S1", "chapter_id": "CH1", "time_limit_sec": 30, "goal_increment_likes": 5},
                ]
            ),
            "StageSpawns": pd.DataFrame(
                [
                    {"stage_id": "CH1_S1", "pigeon_id": 1, "count": 3},
                    {"stage_id": "CH1_S1", "pigeon_id": 2, "count": 1},
                ]
            ),
        }

    def test_run_one(self) -> None:
        config = SimConfig(
            chapter_id="CH1",
            character_id="CHAR_001",
            starting_weapon_id="BASIC_1",
            seed=1,
            num_runs=1,
        )
        result = run_one(self.dfs, config)
        self.assertTrue(result.stages)
        self.assertTrue(result.total_likes > 0)
        self.assertEqual(result.stages[0].stage_name, "CH1_S1")

    def test_run_many_with_evolution(self) -> None:
        config = SimConfig(
            chapter_id="CH1",
            character_id="CHAR_001",
            starting_weapon_id="BASIC_1",
            seed=2,
            num_runs=3,
        )
        report = run_many(self.dfs, config)
        self.assertEqual(len(report.runs), 3)
        # evolution requires two weapon augments; ensure at least one run hits it
        evolved_runs = [stage.evolved for run in report.runs for stage in run.stages]
        self.assertTrue(any(evolved_runs))


if __name__ == "__main__":
    unittest.main()
