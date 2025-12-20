import math
import unittest

from pigeon_sim.core import (
    Pigeon,
    Weapon,
    Build,
    Stage,
    apply_tree_choice,
    simulate_stage_with_choice_seq,
)


class TestApplyTreeChoice(unittest.TestCase):
    def test_increments_stage_and_modifies_weapon(self):
        weapon_db = {
            "BASE": Weapon("BASE", "Base", 1.0, 1.0, 1.0),
        }
        tree_defs = {
            "TREE": {
                "base_weapon_id": "BASE",
                "stages": [
                    {"satiety_per_hit": 1.0},
                    {"shots_per_sec": 1.0},
                ],
            }
        }

        build = Build()
        apply_tree_choice(build, "TREE", weapon_db, tree_defs)
        self.assertEqual(build.tree_stage["TREE"], 1)
        self.assertAlmostEqual(build.weapons["BASE"].satiety_per_hit, 2.0)

        apply_tree_choice(build, "TREE", weapon_db, tree_defs)
        self.assertEqual(build.tree_stage["TREE"], 2)
        self.assertAlmostEqual(build.weapons["BASE"].shots_per_sec, 2.0)

        # further application should not change stage
        apply_tree_choice(build, "TREE", weapon_db, tree_defs)
        self.assertEqual(build.tree_stage["TREE"], 2)


class TestSimulation(unittest.TestCase):
    def test_clear_when_likes_enough(self):
        pigeons = {
            "P1": Pigeon("P1", "Pigeon", hp=5.0, picky=0.0, like_drop=2),
        }
        weapon_db = {
            "BASE": Weapon("BASE", "Base", satiety_per_hit=5.0, shots_per_sec=1.0, accuracy=1.0),
        }
        tree_defs = {}
        level_xp = {1: 10}
        stage = Stage(name="Test", time_limit=100.0, clear_likes=2, spawns=[("P1", 1)])

        result = simulate_stage_with_choice_seq(
            stage=stage,
            pigeons=pigeons,
            weapon_db=weapon_db,
            tree_defs=tree_defs,
            level_xp=level_xp,
            initial_weapons=["BASE"],
            choice_seq=(),
        )

        self.assertTrue(result.cleared)
        self.assertLess(result.clear_time, math.inf)


if __name__ == "__main__":
    unittest.main()
