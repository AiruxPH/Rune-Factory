import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, migrate } from '../src/state/player.js';
import { save, load, SAVE_KEY } from '../src/state/save.js';
import { tick, buy, roll, reforge, probabilities, unlockGarden } from '../src/progression/economy.js';
import { stat } from '../src/progression/effects.js';
import { validateContent } from '../src/content/catalog.js';
import { seededRandom } from '../src/shared/numbers.js';

test('content references are valid', () => validateContent());
test('income is independent of frame rate; pad requires presence', () => {
  const a=newPlayer(), b=newPlayer(); tick(a,10);
  for(let i=0;i<100;i++) tick(b,.1);
  assert.ok(Math.abs(a.balances.coins-b.balances.coins)<1e-9);
  assert.equal(a.balances.energy,0); tick(a,2,{onPad:true});
  assert.equal(a.balances.energy,6); a.upgrades.autoEnergy=1; tick(a,1);
  assert.equal(a.balances.energy,9);
});
test('purchases and unlocks enforce affordability', () => {
  const s=newPlayer(); assert.equal(buy(s,'income'),false);
  assert.equal(unlockGarden(s),false); s.balances.coins=100;
  assert.equal(unlockGarden(s),true); assert.equal(s.balances.coins,0);
  assert.equal(unlockGarden(s),false); assert.equal(buy(s,'unknown'),false);
});
test('bonus order combines additions, multipliers and reforge', () => {
  const s=newPlayer(); s.runes.spark=2; s.upgrades.income=1; s.runes.nexus=2; s.prestige=1;
  assert.ok(Math.abs(stat(s,'coinsGain')-1.7*1.15**2*1.25)<1e-10);
});
test('rune openings charge currency and cap duplicate levels', () => {
  const s=newPlayer(); assert.equal(roll(s,()=>0),null);
  s.balances.energy=60; s.runes.spark=30;
  assert.equal(roll(s,()=>0).capped,true); assert.equal(s.runes.spark,30);
  assert.equal(s.balances.energy,40); assert.equal(roll(s,()=>.99999).rune.id,'nexus');
  assert.equal(s.runes.nexus,1);
});
test('luck increases rare probability and normalizes weights', () => {
  const s=newPlayer(), base=probabilities(s); s.runes.fortune=10;
  const lucky=probabilities(s); assert.ok(lucky.at(-1)>base.at(-1));
  assert.ok(Math.abs(lucky.reduce((a,b)=>a+b)-1)<1e-12);
});
test('seeded randomness reproduces a sequence', () => {
  const a=seededRandom(42), b=seededRandom(42);
  assert.deepEqual(Array.from({length:100},a),Array.from({length:100},b));
});
test('reforge keeps runes and clears resettable progress', () => {
  const s=newPlayer(); s.runes.nexus=2; s.upgrades.income=3; s.garden=true;
  assert.equal(reforge(s),false); s.balances.coins=1000; s.balances.crystals=25;
  assert.equal(reforge(s),true); assert.equal(s.runes.nexus,2);
  assert.equal(s.upgrades.income,0); assert.equal(s.garden,false); assert.equal(s.prestige,1);
  assert.deepEqual(s.balances,{coins:0,energy:0,crystals:0});
});
test('migration normalizes values, fills defaults and rejects future versions', () => {
  const s=migrate({version:0,balances:{coins:-5,energy:10},runes:{spark:999},upgrades:{income:2.9}});
  assert.equal(s.balances.coins,0); assert.equal(s.balances.crystals,0);
  assert.equal(s.runes.spark,30); assert.equal(s.upgrades.income,2);
  assert.throws(()=>migrate({version:999}));
});
test('save roundtrip and failure handling preserve existing data', () => {
  const data=new Map(); const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  const s=newPlayer(); s.balances.coins=123;
  assert.equal(save(storage,s),true); assert.equal(load(storage).state.balances.coins,123);
  data.set(SAVE_KEY,'broken'); assert.ok(load(storage).error); assert.equal(data.get(SAVE_KEY),'broken');
  assert.equal(save({setItem(){throw Error('Quota');}},s),false);
});

import { ForgeCollector } from '../src/progression/forge.js';
test('forge rolls immediately on entry and stops on exit', () => {
  const state=newPlayer(), forge=new ForgeCollector(); state.balances.energy=100;
  assert.equal(forge.update(state,0,true,()=>0).length,1);
  assert.equal(state.balances.energy,80);
  assert.equal(forge.update(state,10,false,()=>0).length,0);
  assert.equal(state.rolls,1);
});
test('automatic rolling is time-based and does not accrue unpaid rolls', () => {
  const a=newPlayer(), b=newPlayer(), fa=new ForgeCollector(), fb=new ForgeCollector();
  a.balances.energy=b.balances.energy=1000;
  fa.update(a,1,true,()=>0);
  for(let i=0;i<10;i++) fb.update(b,.1,true,()=>0);
  assert.equal(a.rolls,b.rolls); assert.equal(a.rolls,9);
  const empty=newPlayer(), f=new ForgeCollector(); f.update(empty,100,true,()=>0);
  empty.balances.energy=20; assert.equal(f.update(empty,.125,true,()=>0).length,1);
  assert.equal(empty.balances.energy,0);
});

import { runeStats } from '../src/progression/forge.js';
import { buyMax } from '../src/progression/economy.js';
test('speed interval caps at .05 and excess speed proportionally multiplies bulk', () => {
  const s=newPlayer(); s.upgrades.forge=20;
  const stats=runeStats(s);
  assert.equal(stats.interval,.05); assert.equal(stats.rawInterval,.025);
  assert.equal(stats.conversion,2); assert.equal(stats.bulk,2); assert.equal(stats.rps,40);
  s.upgrades.coinBulk=2;
  assert.equal(runeStats(s).bulk,6); assert.equal(runeStats(s).rps,120);
});
test('bulk charges per individual rune and partial batches cannot overspend', () => {
  const s=newPlayer(); s.upgrades.coinBulk=4; s.balances.energy=45;
  const f=new ForgeCollector();
  assert.equal(f.update(s,0,true,()=>0).length,2);
  assert.equal(s.balances.energy,5); assert.equal(s.rolls,2);
  assert.equal(f.update(s,1,true,()=>0).length,0);
});
test('speed boosts beyond the cap preserve time-based throughput', () => {
  const a=newPlayer(),b=newPlayer();
  for(const s of [a,b]){s.upgrades.forge=20;s.upgrades.coinBulk=2;s.balances.energy=10000;}
  const fa=new ForgeCollector(),fb=new ForgeCollector();fa.update(a,1,true,()=>0);
  for(let i=0;i<100;i++)fb.update(b,.01,true,()=>0);
  assert.equal(a.rolls,b.rolls);assert.equal(a.rolls,126);
});
test('currency-specific upgrades charge their own currency and Max respects caps', () => {
  const s=newPlayer();s.balances.coins=10000;
  assert.equal(buy(s,'pad'),false);s.balances.energy=25;
  assert.equal(buy(s,'pad'),true);assert.equal(s.balances.energy,0);assert.equal(s.balances.coins,10000);
  s.balances.coins=1e10;assert.equal(buyMax(s,'income'),20);assert.equal(buyMax(s,'income'),0);
});
test('v1 saves retain existing upgrades while new stats initialize to defaults', () => {
  const s=migrate({version:1,upgrades:{pad:4,forge:10,autoEnergy:1},runes:{nexus:2}});
  assert.equal(s.version,2);assert.equal(s.upgrades.pad,4);assert.equal(s.upgrades.forge,10);
  assert.equal(s.upgrades.coinBulk,0);assert.equal(s.runes.nexus,2);
});
