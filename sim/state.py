"""State tracking for the simulator."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PlayerState:
    """Mutable player state during a run."""

    character_id: str
    attack: float
    attack_speed: float
    move_speed: float
    hp: float
    level: int = 1
    xp: float = 0.0

    def copy(self) -> "PlayerState":
        """Return a shallow copy for branching simulations."""

        return PlayerState(
            character_id=self.character_id,
            attack=self.attack,
            attack_speed=self.attack_speed,
            move_speed=self.move_speed,
            hp=self.hp,
            level=self.level,
            xp=self.xp,
        )


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
