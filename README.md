# Rune Factory

A modular, top-down 2D incremental game prototype. Original temporary content inspired by currency collection and rune progression systems. No external dependencies or build step.

## Run locally

Install Node.js 20 or newer, open this folder in your IDE, then run:

```sh
npm run dev
```

Open http://localhost:5173. Use `npm test` for economy/save checks and `npm run check` for JavaScript syntax checks. This is a static ES-module app: any static web server can serve it. Opening index.html directly with file:// will not work.

## First loop

Coins grow passively. Walk with WASD or arrows onto the mint pad to earn Energy. Stand inside the violet forge to roll automatically at 8 openings per second, boosted by Rune Speed. Every opening costs 20 Energy; rolling waits when Energy runs out and stops when you leave. There is no interaction key or cooldown. Buy currency upgrades in the Upgrades popup. Open the garden gate for 100 coins with E, then walk over crystal nodes. Nodes respawn after four simulation seconds. Reforge after reaching 1,000 coins and 25 crystals. Touch devices have directional buttons.

Every roll costs Energy, including duplicates and capped runes. The first copy unlocks level 1. Level 2 needs two more copies, level 3 needs three more, and so on. Rune cards display progress to the next level. Additive effects increase the base multiplier; multiplicative effects compound per level. The stat order is `(1 + additive effects) × multiplicative effects × reforge multiplier`. Luck applies bounded rarity bonuses: `strength = (luck - 1) / (luck - 1 + 4)`, then `weight * (1 + 3 * strength * luckAffinity)`, normalized across the pool. Rare runes benefit more while rarity ordering remains intact. These are prototype rules, not claimed reproductions of Noob Incremental.

## Code map

- `src/content/catalog.js`: currencies, rune pool, rune effects, upgrades and validation.
- `src/content/world.js`: map dimensions, collection pad, forge, gate and nodes.
- `src/progression/economy.js`: income, purchases, weighted rolls, unlocks and resets.
- `src/progression/effects.js`: shared bonus calculation.
- `src/state/player.js`: initial state, normalization and migration boundary.
- `src/state/save.js`: versioned local storage with failure handling.
- `src/game/world.js`: input, movement, collision, collection triggers and drawing.
- `src/ui/`: panels and responsive styling.
- `src/main.js`: composition and central update loop.
- `src/shared/numbers.js`: formatting, numeric boundary and seeded test randomness.

Add currencies and rune effects in the catalog; update content validation for new stat families. A new collection mechanic needs its own trigger implementation in the world and/or progression layer. Content definitions are separate from stored ownership. Labels may change, but IDs must remain stable. For schema changes, increment the save version and add an explicit migration in player.js. Do not reuse retired IDs.

## Testing tools and limitations

Developer tools grant resources, unlock the garden, and accelerate progression by 5× or 20×. Movement remains at normal speed. Reset local save asks for confirmation. Autosave runs every five active seconds and when leaving/hiding the page. Saves belong to this browser and origin. Invalid or future saves pause autosave to avoid overwriting the original data; Reset local save explicitly starts over.

This first version pauses while the tab is hidden and has no offline income, accounts, cloud saves, multiplayer, audio, inventory equipment. Rune Speed increases the continuous automatic rolling rate. Currency balances are a transparent left HUD. Upgrades, runes, Reforge and testing controls open in modal panels; rune and upgrade cards scroll horizontally inside their popups. The map fits the viewport, so no scrolling camera is needed yet. Numbers use JavaScript floating point with a 1e100 ceiling; unlimited late-game numbers require a future large-number adapter. Graphics are placeholders. Debug tools are intentionally exposed for testing and must be gated before a competitive release.


## Rune batching and currency boards

Each currency has a dedicated upgrade tab, paid with that currency. Coin upgrades improve coin income, Rune Speed and Bulk. Energy upgrades improve energy income, automation and Bulk. Crystal upgrades improve crystal yield, Luck and Speed. Buy purchases one level; Max buys all affordable levels up to the cap.

The base opening interval is 0.125 seconds (8 batches/sec), divided by Rune Speed. The final interval cannot be less than 0.05 seconds. Excess speed proportionally multiplies Rune Bulk: `conversion = max(1, 0.05 / rawInterval)`, `effectiveBulk = baseBulk * conversion`, `RPS = effectiveBulk / interval`. For example, 5× Speed yields a raw interval of 0.025s, so the final interval is 0.05s and effective bulk doubles. Fractional bulk carries between funded batches. Each individual rune consumes 20 Energy, and a partially affordable batch opens only what can be paid for. Leaving the forge or exhausting funds clears unfinished work.

The HUD shows effective Luck, Bulk, interval and theoretical RPS (funding may limit actual production). A nearby forge board shows pool chances and affordable openings. Rune cards show current level/effects and maximum bonuses. Legacy saves migrate to the current schema, retain known levels, and initialize missing upgrades at zero. Existing pad/automation levels are retained even though their future purchases now cost Energy.


## Popup navigation

Rune cards are one continuous horizontal row. Use a mouse wheel over the cards, a horizontal trackpad gesture, touch swipe, the scrollbar, or Left/Right while the card region is focused. Upgrade tabs filter the same scrollable row to the selected currency and reset its horizontal position. No Previous/Next controls are used. The page itself stays fixed; constrained-height popup content may scroll internally to keep controls reachable. The currency and rune-stat HUD share a vertical flow to prevent overlap, and the world panel stretches across the available viewport width.


## Opened rune quantities

The nearby forge board includes a live quantity breakdown beneath the pool content. These lifetime opening counts are separate from capped rune levels, survive Reforge and are saved with schema v3. Old saves retain their total rolls and levels; since earlier versions did not record per-rune history, those earlier rolls are labeled untracked and accurate per-rune counting begins on upgrade.


## Early progression and Reforge milestones

A compact NEXT guide suggests first purchases, the first rune, automation, the garden and the first Reforge. These are suggestions, not prerequisites. The forge board separates maximum rolling speed from Energy-supported output, showing full-speed cost, automated income and estimated reserve duration. A short result strip groups recent openings and highlights first discoveries, level gains and rare finds.

Reforge 1 grants permanent Energy automation. Reforge 2 keeps the garden open. Reforge 3 adds one permanent base Rune Bulk, which participates in the existing excess-speed conversion. Every Reforge still adds 25 percentage points to resource gains. Costs increase from 1,000 coins and 25 crystals: coins double each time, while crystals increase by 25. Purchased upgrades and currencies reset; rune levels, partial copy progress and lifetime opening counts remain.

Schema v4 adds runeXP. Old levels are converted to the minimum copies needed for that level, preserving their effects without guessing historical duplicates. Existing Reforge counts receive the applicable milestones. The browser storage key stays unchanged.

Run `node scripts/simulate-progression.mjs` for a reproducible normal-speed economy simulation across five seeds. It uses no resource grants, models three-second station travel and one crystal node every four seconds, and follows the suggested upgrades. This is a pacing check, not a human playtest or a measurement of navigation and menu usability. Balance values remain prototype defaults.
