import unittest

from pigeon_sim.core import (
    Pigeon,
    Weapon,
    Stage,
)
from pigeon_sim.search import enumerate_and_rank


class TestEnumeration(unittest.TestCase):
    def test_returns_all_sequences(self):
        pigeons = {
            "P1": Pigeon("P1", "Pigeon", hp=1.0, picky=0.0, like_drop=1),
        }
        weapon_db = {
            "W1": Weapon("W1", "Basic", satiety_per_hit=10.0, shots_per_sec=1.0, accuracy=1.0),
        }
        tree_defs = {
            "A": {"base_weapon_id": "W1", "stages": [{"satiety_per_hit": 0.0}]},
            "B": {"base_weapon_id": "W1", "stages": [{"satiety_per_hit": 0.0}]},
        }
        level_xp = {1: 1}
        stage = Stage(name="Test", time_limit=10.0, clear_likes=1, spawns=[("P1", 1)])

        choices = ["A", "B"]
        top, bottom, all_results = enumerate_and_rank(
            choices=choices,
            depth=2,
            top_k=2,
            bottom_k=2,
            stage=stage,
            pigeons=pigeons,
            weapon_db=weapon_db,
            tree_defs=tree_defs,
            level_xp=level_xp,
            initial_weapons=["W1"],
        )

        self.assertEqual(len(all_results), len(choices) ** 2)
        self.assertEqual(len(top), 2)
        self.assertEqual(len(bottom), 2)


if __name__ == "__main__":
    unittest.main()
