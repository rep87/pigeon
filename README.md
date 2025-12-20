# Pigeon Simulator

Minimal, dependency-free discrete-event simulator for balancing an indie pigeon game.

## Installation

Install directly from Git:

```
pip install git+<repo_url>
```

## Quickstart (Colab friendly)

```python
from pigeon_sim import (
    Pigeon,
    Weapon,
    Stage,
    apply_tree_choice,
    simulate_stage_with_choice_seq,
    enumerate_and_rank,
)

# Define your data
pigeons = {
    "P01": Pigeon(pid="P01", name="Common", hp=10, picky=0.1, like_drop=1),
}

weapon_db = {
    "BASE": Weapon(wid="BASE", name="Peck", satiety_per_hit=1.0, shots_per_sec=2.0, accuracy=1.0),
    "SPICY_BASE": Weapon(wid="SPICY_BASE", name="Spicy", satiety_per_hit=2.0, shots_per_sec=1.0, accuracy=1.0),
}

tree_defs = {
    "SPICY": {
        "base_weapon_id": "SPICY_BASE",
        "stages": [
            {"satiety_per_hit": 1.0},
            {"shots_per_sec": 0.5},
        ],
    }
}

stage = Stage(name="Test", time_limit=30, clear_likes=3, spawns=[("P01", 3)])
level_xp = {1: 1, 2: 2}
initial_weapons = ["BASE"]
choices = ["SPICY"]

# Enumerate all two-level sequences
(top, bottom, all_results) = enumerate_and_rank(
    choices=choices,
    depth=2,
    top_k=3,
    bottom_k=3,
    stage=stage,
    pigeons=pigeons,
    weapon_db=weapon_db,
    tree_defs=tree_defs,
    level_xp=level_xp,
    initial_weapons=initial_weapons,
)

best = top[0]
print("Cleared:", best.cleared, "Clear time:", best.clear_time, "End level:", best.end_level)
```

## Development

Run the small test suite:

```
python -m unittest discover -s tests
```
