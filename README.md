# Rune Factory

A modular, top-down 2D incremental game prototype. Original temporary content inspired by currency collection and rune progression systems. No external dependencies or build step.

## Run locally

Install Node.js 20 or newer, open this folder in your IDE, then run:

```sh
npm run dev
```

Open http://localhost:5173. Use `npm test` for economy/save checks and `npm run check` for JavaScript syntax checks. This is a static ES-module app: any static web server can serve it. Opening index.html directly with file:// will not work.

## First loop

Coins grow passively. Walk with WASD or arrows onto the mint pad to earn Energy. Stand inside the violet forge to roll automatically at 8 openings per second, boosted by Rune Speed. Every opening costs 20 Energy; rolling waits when Energy runs out and stops when you leave. There is no interaction key or cooldown. Buy coin upgrades in the sidebar. Open the garden gate for 100 coins with E, then walk over crystal nodes. Nodes respawn after four simulation seconds. Reforge after reaching 1,000 coins and 25 crystals. Touch devices have directional buttons.

Every roll costs Energy, including duplicates and capped runes. One successful roll adds one level until that rune’s cap. Additive effects increase the base multiplier; multiplicative effects compound per level. The stat order is `(1 + additive effects) × multiplicative effects × reforge multiplier`. Luck flattens relative weights using `weight ** (1 / luck)` and normalizes them. These are prototype rules, not claimed reproductions of Noob Incremental.

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

This first version pauses while the tab is hidden and has no offline income, accounts, cloud saves, multiplayer, audio, inventory equipment, or automatic rune rolling. Rune Speed increases the continuous automatic rolling rate. Currency balances are a transparent left HUD. Upgrades, runes, Reforge and testing controls open in modal panels; rune and upgrade lists use pagination. The map fits the viewport, so no scrolling camera is needed yet. Numbers use JavaScript floating point with a 1e100 ceiling; unlimited late-game numbers require a future large-number adapter. Graphics are placeholders. Debug tools are intentionally exposed for testing and must be gated before a competitive release.


## Rune batching and currency boards

Each currency has a dedicated upgrade tab, paid with that currency. Coin upgrades improve coin income, Rune Speed and Bulk. Energy upgrades improve energy income, automation and Bulk. Crystal upgrades improve crystal yield, Luck and Speed. Buy purchases one level; Max buys all affordable levels up to the cap.

The base opening interval is 0.125 seconds (8 batches/sec), divided by Rune Speed. The final interval cannot be less than 0.05 seconds. Excess speed proportionally multiplies Rune Bulk: `conversion = max(1, 0.05 / rawInterval)`, `effectiveBulk = baseBulk * conversion`, `RPS = effectiveBulk / interval`. For example, 5× Speed yields a raw interval of 0.025s, so the final interval is 0.05s and effective bulk doubles. Fractional bulk carries between funded batches. Each individual rune consumes 20 Energy, and a partially affordable batch opens only what can be paid for. Leaving the forge or exhausting funds clears unfinished work.

The HUD shows effective Luck, Bulk, interval and theoretical RPS (funding may limit actual production). A nearby forge board shows pool chances and affordable openings. Rune cards show current level/effects and maximum bonuses. Existing v1 saves migrate to v2, retain known levels, and initialize the new upgrades at zero. Existing pad/automation levels are retained even though their future purchases now cost Energy.
