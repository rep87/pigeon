# Pigeon / 오늘도 모이 난사 중

> **TL;DR (EN):** A small browser-game prototype that tries to translate Vampire Survivors-like growth into feeding pigeons instead of defeating enemies.
> What worked: movement, feeding projectiles, pigeons, level/stat systems, and a simple game loop could be built quickly.
> What still needs human judgment: translating genre mechanics into a new emotion, asset reaction, feeding feel, and balance. (as of 2026-07, using Codex)

`pigeon` is an AI-assisted browser-game prototype.

GitHub Pages:

https://rep87.github.io/pigeon/

## What This Tested

The starting idea was to take the structure of a Vampire Survivors-like game and change its emotional core.

Instead of defeating enemies, the player throws food to pigeons. The goal was to create the feeling of feeding, abundance, and pigeons gathering happily, rather than combat power.

## What Worked

- Basic movement
- Food projectiles
- Pigeon spawning
- Level and stat structure
- Shop/debug-style controls in the prototype
- A browser-local game loop that could be iterated quickly

This confirmed that AI can reproduce the outer structure of a familiar genre quickly.

## What Did Not Work Yet

(2026-07, Codex 기준) the genre structure did not automatically translate into the intended feeling.

Damage, attack speed, range, projectile count, and growth numbers make sense in a combat game. They do not automatically become the pleasure of feeding pigeons. The prototype needed stronger pigeon reactions, better feeding feedback, and a growth system designed around fullness, variety, and crowd behavior rather than attack stats.

## Main Lesson

Importing a genre structure is easier than translating the emotion of that genre into a new theme.

For a future retry, the feeding system should be designed first, and the numbers should support that feeling rather than copy combat stats.

## Related Collection

This project is part of:

[AI Game Prototyping Experiments](https://github.com/rep87/ai-game-prototyping-experiments)

## Canonical Local Source

The current canonical local folder is:

```text
C:\Users\bangs\.gemini\antigravity\game_pigeon_3
```

`game_pigeon_3 - 복사본` is treated as a local archive / earlier asset-heavy copy.

## Status

- Prototype / experiment
- Not a finished game
- Code sync is not being changed in this README-only update
