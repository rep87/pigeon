"""State tracking for the simulator."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PlayerState:
    """Mutable player state during a run."""

    name: str
    attack: float
    level: int = 1
    xp: float = 0.0

    def copy(self) -> "PlayerState":
        """Return a shallow copy for branching simulations."""

        return PlayerState(name=self.name, attack=self.attack, level=self.level, xp=self.xp)


@dataclass
class WeaponState:
    """Mutable weapon state during a run."""

    weapon_id: str
    damage: float
    shots_per_sec: float
    accuracy: float
    upgrade_count: int = 0

    def copy(self) -> "WeaponState":
        """Return a shallow copy for branching simulations."""

        return WeaponState(
            weapon_id=self.weapon_id,
            damage=self.damage,
            shots_per_sec=self.shots_per_sec,
            accuracy=self.accuracy,
            upgrade_count=self.upgrade_count,
        )
