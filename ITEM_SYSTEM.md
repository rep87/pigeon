# Item And Card System (2026-03-04)

## Core Loop
- Level-up presents 3 random cards.
- Player picks 1 card.
- Picked card:
  - Raises linked item level by +1.
  - Applies two stat bonuses (main + sub).

## Card Pool Rules
- Total cards: 18 (6 items x A/AS/S variants).
- One level-up roll cannot include multiple variants of the same item.
  - Example: `커피(A)`, `커피(AS)`, `커피(S)` cannot appear together.
- `커피` card group has slightly higher appearance weight for Salaryman.

## Player Start (Salaryman)
- Starts with `커피` item level `3`.
- Permanent bonus: coffee item duration `+50%`.
- Because coffee level is already 3, coffee is in drop pool from run start.

## Item Drop Rules
- Item drop chance is evaluated per unlocked item.
- Each unlocked item uses `5%` drop chance.
- Item is unlocked for drop only when item level >= 1.
- Atomic bomb code remains, but atomic is excluded from normal drop pool.

## Item Levels And Effects

### Coffee
- Lv1-2: 2-shot
- Lv3-4: 3-shot
- Lv5+: 5-shot
- Active duration: 5s (stacking), Salaryman coffee uses x1.5 duration.

### Cheongyang Chili
- Lv1-2: attack speed x2
- Lv3-4: attack speed x3
- Lv5+: attack speed x4
- Active duration: 5s (stacking).

### Ramen
- Lv1-2: satiety gain x2
- Lv3-4: satiety gain x3
- Lv5+: satiety gain x4
- Active duration: 5s (stacking).

### Lunch Box
- Lv1-2: feed size x3
- Lv3-4: feed size x4
- Lv5+: feed size x5
- Active duration: 5s (stacking).

### Energy Drink
- Lv1-2: move speed x2
- Lv3-4: move speed x2 + trail (3s)
- Lv5+: move speed x2 + trail (5s)
- Trail touching birds grants small satiety.
- Active duration: 5s (stacking).

### Bacchus
- Lv1-2: pierce 1
- Lv3-4: pierce 2
- Lv5+: pierce 4
- Active duration: 5s (stacking).

## Card Stat Bonuses
- A/AS/S variants map to the requested stat pairs:
  - Coffee: ASPD +5 plus one sub.
  - Chili: ASPD +8 plus one sub.
  - Ramen: ATK +8 plus one sub.
  - Lunch: SIZE +8 plus one sub.
  - Energy: MOVE +10 plus one sub.
  - Bacchus: RANGE +10 plus one sub.

## UI
- Card UI:
  - Top: item variant name (for example `커피(A)`).
  - Middle: item level-up effect text.
  - Bottom: stat bonus text.
  - Current item level shown as `LV x/5`.
- Slot and buff labels show current item version:
  - base / `+` / `++` from current item level tier.
