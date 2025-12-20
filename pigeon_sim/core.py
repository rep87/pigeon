"""Core simulator models and logic for pigeon stages."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Tuple
import itertools
import math


@dataclass
class Pigeon:
    """Represents a single pigeon enemy type."""

    pid: str
    name: str
    hp: float
    picky: float  # 0~1, effective DPS multiplier = (1 - picky)
    like_drop: int = 1


@dataclass
class Weapon:
    """Weapon definition with simple DPS calculation."""

    wid: str
    name: str
    satiety_per_hit: float
    shots_per_sec: float
    accuracy: float

    def dps(self) -> float:
        """Return the expected satiety per second for the weapon."""
        return self.satiety_per_hit * self.shots_per_sec * self.accuracy


@dataclass
class Build:
    """Player build containing owned weapons and tree progress."""

    weapons: Dict[str, Weapon] = field(default_factory=dict)
    tree_stage: Dict[str, int] = field(default_factory=dict)

    def total_dps(self) -> float:
        """Sum the DPS of all owned weapons."""
        return sum(w.dps() for w in self.weapons.values())


@dataclass
class Stage:
    """Stage definition holding clear target and spawn counts."""

    name: str
    time_limit: float
    clear_likes: int
    spawns: List[Tuple[str, int]]  # (pid, count)


@dataclass
class RunResult:
    """Outcome of a single simulated stage run."""

    cleared: bool
    clear_time: float
    time_used: float
    end_level: int
    likes_at_end: int
    hearts: int
    level_times: List[float]
    seq: Tuple[str, ...]


def apply_tree_choice(
    build: Build,
    choice: str,
    weapon_db: Dict[str, Weapon],
    tree_defs: Dict[str, Dict],
) -> None:
    """Apply a skill tree upgrade choice to the build.

    Behavior:
    * If the choice is unknown, do nothing.
    * Add the base weapon if it is not owned yet.
    * Apply the next available stage modifiers to that weapon.
    * Track the reached stage count in ``build.tree_stage``.
    * Ignore attempts to apply past the final stage.
    """

    if choice not in tree_defs:
        return

    base_wid = tree_defs[choice]["base_weapon_id"]
    stage_mods = tree_defs[choice]["stages"]
    current_stage = build.tree_stage.get(choice, 0)
    next_stage = current_stage + 1

    if next_stage > len(stage_mods):
        build.tree_stage[choice] = current_stage
        return

    if base_wid not in build.weapons:
        base = weapon_db[base_wid]
        build.weapons[base_wid] = Weapon(**base.__dict__)

    modifiers = stage_mods[next_stage - 1]
    weapon = build.weapons[base_wid]
    for key, delta in modifiers.items():
        if not hasattr(weapon, key):
            raise ValueError(f"Weapon has no attribute '{key}'")
        setattr(weapon, key, getattr(weapon, key) + delta)

    build.tree_stage[choice] = next_stage


def _pick_pid_round_robin(remaining: Dict[str, int], ordered_pids: List[str], rr_index: int) -> tuple[str | None, int]:
    """Pick the next PID using a round robin order."""
    alive = [pid for pid, count in remaining.items() if count > 0]
    if not alive:
        return None, rr_index

    for _ in range(len(ordered_pids)):
        pid = ordered_pids[rr_index % len(ordered_pids)]
        rr_index += 1
        if remaining.get(pid, 0) > 0:
            return pid, rr_index

    return alive[0], rr_index


def _pick_pid_first_available(remaining: Dict[str, int]) -> str | None:
    """Pick the first available PID with remaining count."""
    for pid, count in remaining.items():
        if count > 0:
            return pid
    return None


def simulate_stage_with_choice_seq(
    stage: Stage,
    pigeons: Dict[str, Pigeon],
    weapon_db: Dict[str, Weapon],
    tree_defs: Dict[str, Dict],
    level_xp: Dict[int, int],
    initial_weapons: Iterable[str],
    choice_seq: Tuple[str, ...],
    start_level: int = 1,
    kill_order: str = "round_robin",
) -> RunResult:
    """Simulate a stage by applying level-up choices as pigeons are defeated."""

    build = Build()
    for wid in initial_weapons:
        base = weapon_db[wid]
        build.weapons[wid] = Weapon(**base.__dict__)

    remaining = {pid: count for pid, count in stage.spawns}
    pid_list = list(remaining.keys())
    round_robin_index = 0

    time_elapsed = 0.0
    likes = 0
    hearts = 0
    level = start_level
    xp_progress = 0
    level_times: List[float] = []

    choice_index = 0
    cleared = False

    def pick_pid() -> str | None:
        nonlocal round_robin_index
        if kill_order == "round_robin":
            pid, round_robin_index = _pick_pid_round_robin(remaining, pid_list, round_robin_index)
            return pid
        return _pick_pid_first_available(remaining)

    while time_elapsed < stage.time_limit:
        current_pid = pick_pid()
        if current_pid is None:
            break

        pigeon = pigeons[current_pid]
        total_dps = build.total_dps()
        if total_dps <= 0:
            break

        effective_dps = total_dps * max(0.0, 1.0 - pigeon.picky)
        if effective_dps <= 0:
            break

        time_to_kill = pigeon.hp / effective_dps
        if time_elapsed + time_to_kill > stage.time_limit:
            time_elapsed = stage.time_limit
            break

        time_elapsed += time_to_kill
        remaining[current_pid] -= 1
        likes += pigeon.like_drop
        xp_progress += pigeon.like_drop

        if likes >= stage.clear_likes:
            hearts += likes - stage.clear_likes
            likes = stage.clear_likes
            cleared = True
            break

        while True:
            needed = level_xp.get(level)
            if needed is None or xp_progress < needed:
                break
            xp_progress -= needed
            level += 1
            level_times.append(time_elapsed)

            if choice_index < len(choice_seq):
                apply_tree_choice(build, choice_seq[choice_index], weapon_db, tree_defs)
                choice_index += 1
            else:
                break

    return RunResult(
        cleared=cleared,
        clear_time=time_elapsed if cleared else math.inf,
        time_used=time_elapsed,
        end_level=level,
        likes_at_end=likes,
        hearts=hearts,
        level_times=level_times,
        seq=choice_seq,
    )


def enumerate_and_rank(
    choices: List[str],
    depth: int,
    top_k: int,
    bottom_k: int,
    **sim_kwargs,
):
    """Enumerate all choice sequences and return ranked results."""

    all_sequences = list(itertools.product(choices, repeat=depth))
    results: List[RunResult] = []

    for sequence in all_sequences:
        result = simulate_stage_with_choice_seq(choice_seq=sequence, **sim_kwargs)
        results.append(result)

    results_sorted = sorted(
        results,
        key=lambda r: (
            0 if r.cleared else 1,
            r.clear_time,
            -r.end_level,
            r.time_used,
        ),
    )

    top = results_sorted[:top_k]
    bottom = list(reversed(results_sorted))[:bottom_k]
    return top, bottom, results_sorted


__all__ = [
    "Pigeon",
    "Weapon",
    "Build",
    "Stage",
    "RunResult",
    "apply_tree_choice",
    "simulate_stage_with_choice_seq",
    "enumerate_and_rank",
]
