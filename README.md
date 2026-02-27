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
    "Characters": pd.DataFrame([
        {
            "character_id": "CHAR_001",
            "name": "Hero",
            "base_attack": 2.0,
            "base_attack_speed": 1.0,
            "base_move_speed": 1.0,
            "base_hp": 10.0,
            "fatigue_resist": 0.0,
            "notes": "demo",
        }
    ]),
    "Pigeons": pd.DataFrame([
        {
            "pigeon_id": 1,
            "name": "P1",
            "hp": 10,
            "move_speed": 1.0,
            "fatigue": 0.0,
            "fatigue_speed": 0.0,
            "picky_rate": 0.1,
            "good_reward": 1.0,
            "behavior_key": "B",
            "behavior_desc": "basic",
            "notes": "",
        },
        {
            "pigeon_id": 2,
            "name": "P2",
            "hp": 20,
            "move_speed": 1.0,
            "fatigue": 0.0,
            "fatigue_speed": 0.0,
            "picky_rate": 0.2,
            "good_reward": 2.0,
            "behavior_key": "B",
            "behavior_desc": "basic",
            "notes": "",
        },
    ]),
    "Weapons": pd.DataFrame([
        {
            "weapon_id": "BASIC_1",
            "family": "BASIC",
            "weapon_tier": "T1",
            "name": "Starter",
            "base_damage": 1.0,
            "base_attack_speed": 2.0,
            "notes": "",
        },
        {
            "weapon_id": "BASIC_EVOLVED",
            "family": "BASIC",
            "weapon_tier": "T2",
            "name": "Starter+",
            "base_damage": 2.0,
            "base_attack_speed": 2.0,
            "notes": "",
        },
    ]),
    "WeaponEvolutions": pd.DataFrame([
        {
            "from_weapon_id": "BASIC_1",
            "to_weapon_id": "BASIC_EVOLVED",
            "required_upgrade_level": 2,
            "notes": "",
        }
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
            "notes": "",
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
            "notes": "",
        },
    ]),
    "LevelCurve": pd.DataFrame([
        {"level": 1, "xp_to_next": 2},
        {"level": 2, "xp_to_next": 2},
    ]),
    "Stages": pd.DataFrame([
        {
            "stage_id": "CH1_S1",
            "chapter_id": "CH1",
            "time_limit_sec": 30,
            "goal_increment_likes": 5,
            "goal_total_likes": None,
            "notes": "",
        },
        {
            "stage_id": "CH1_S2",
            "chapter_id": "CH1",
            "time_limit_sec": 30,
            "goal_increment_likes": 8,
            "goal_total_likes": None,
            "notes": "",
        },
    ]),
    "StageSpawns": pd.DataFrame([
        {"stage_id": "CH1_S1", "pigeon_id": 1, "count": 3, "notes": ""},
        {"stage_id": "CH1_S1", "pigeon_id": 2, "count": 1, "notes": ""},
        {"stage_id": "CH1_S2", "pigeon_id": 1, "count": 4, "notes": ""},
    ]),
}

config = SimConfig(chapter_id="CH1", character_id="CHAR_001", starting_weapon_id="BASIC_1")
report = run_many(dfs, config)
print("Success rate:", report.success_rate)

# Export DataFrames for plotting/analysis
dfs_out = report.to_dfs()
print(report.summary_text())
print(dfs_out["runs"].head())
print(dfs_out["choices"].head())
```

## Development

Run the small test suite:

```
python -m unittest discover -s tests
```

## GitHub PR troubleshooting

If creating a PR fails with a message similar to "GitHub resource not found", verify that the
local repository has a configured remote and that you have access to it.

```bash
git remote -v
```

If no `origin` is listed, add one and push your branch first:

```bash
git remote add origin <your_repo_url>
git push -u origin <branch_name>
```

Then open the PR again from GitHub (or your PR tool). Most "resource not found" errors in this
project were caused by the branch not being connected to an accessible remote repository.
