# Pigeon Simulator

Minimal, dependency-free discrete-event simulator for balancing an indie pigeon game.

## Installation

Install directly from Git:

```
pip install git+<repo_url>
```

## Quickstart (Colab friendly)

```python
import pandas as pd

from sim import SimConfig, run_many

dfs = {
    "Characters": pd.DataFrame([{"character_id": "CHAR_001", "attack": 2.0}]),
    "Pigeons": pd.DataFrame([
        {"pigeon_id": 1, "hp": 10, "picky_rate": 0.1, "likes_reward": 1.0},
        {"pigeon_id": 2, "hp": 20, "picky_rate": 0.2, "likes_reward": 2.0},
    ]),
    "Weapons": pd.DataFrame([
        {"weapon_id": "BASIC_1", "damage": 1.0, "shots_per_sec": 2.0, "accuracy": 1.0},
        {"weapon_id": "BASIC_EVOLVED", "damage": 2.0, "shots_per_sec": 2.0, "accuracy": 1.0},
    ]),
    "WeaponEvolutions": pd.DataFrame([
        {"weapon_id": "BASIC_1", "evolves_to": "BASIC_EVOLVED", "required_upgrade_level": 2},
    ]),
    "Augments": pd.DataFrame([
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
    ]),
    "LevelCurve": pd.DataFrame([
        {"level": 1, "xp_to_next": 2},
        {"level": 2, "xp_to_next": 2},
    ]),
    "Stages": pd.DataFrame([
        {"stage_id": "CH1_S1", "chapter_id": "CH1", "time_limit_sec": 30, "goal_increment_likes": 5},
        {"stage_id": "CH1_S2", "chapter_id": "CH1", "time_limit_sec": 30, "goal_increment_likes": 8},
    ]),
    "StageSpawns": pd.DataFrame([
        {"stage_id": "CH1_S1", "pigeon_id": 1, "count": 3},
        {"stage_id": "CH1_S1", "pigeon_id": 2, "count": 1},
        {"stage_id": "CH1_S2", "pigeon_id": 1, "count": 4},
    ]),
}

config = SimConfig(chapter_id="CH1", character_id="CHAR_001", starting_weapon_id="BASIC_1")
report = run_many(dfs, config)
print("Success rate:", report.success_rate)
```

## Development

Run the small test suite:

```
python -m unittest discover -s tests
```
