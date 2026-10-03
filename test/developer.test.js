import test from 'node:test';
import assert from 'node:assert/strict';
import { newPlayer, migrate } from '../src/state/player.js';
import { editCurrency, setLevel, setReforges, prepareReforge, resetSection } from '../src/progression/developer.js';
import { resetStoredData, SAVE_KEY } from '../src/state/save.js';
import { canReforge } from '../src/progression/reforge.js';

test('developer amounts reject invalid values without touching balances',()=>{
  const s=newPlayer();editCurrency(s,'coins','1000','add');editCurrency(s,'coins','20','set');
  assert.equal(s.balances.coins,20);
  for(const value of ['',-1,Infinity,'abc',1e101])assert.throws(()=>editCurrency(s,'coins',value,'set'));
  assert.throws(()=>editCurrency(s,'unknown',1,'add'));assert.equal(s.balances.coins,20);
});
test('setting rune levels clears partial XP consistently without fabricating rolls',()=>{
  const s=newPlayer();s.runeCounts.spark=100;s.rolls=100;
  setLevel(s,'runes','spark','10');assert.equal(s.runeXP.spark,55);
  setLevel(s,'runes','spark',2);assert.equal(s.runeXP.spark,3);
  assert.equal(migrate(s).runes.spark,2);assert.equal(s.rolls,100);assert.equal(s.runeCounts.spark,100);
  assert.throws(()=>setLevel(s,'runes','spark',31));assert.throws(()=>setLevel(s,'upgrades','pad',1.5));
});
test('developer Reforge setup applies milestones and funds the correct next cost',()=>{
  const s=newPlayer();setReforges(s,3);assert.equal(s.garden,true);prepareReforge(s);assert.equal(canReforge(s),true);
  setReforges(s,0);assert.equal(s.garden,false);assert.throws(()=>setReforges(s,10001));
});
test('partial resets preserve other progress and opening history',()=>{
  const s=newPlayer();setLevel(s,'runes','spark',5);s.runeCounts.spark=15;s.rolls=15;s.prestige=3;s.upgrades.pad=4;
  resetSection(s,'runes');assert.equal(s.runeXP.spark,0);assert.equal(migrate(s).runes.spark,0);
  assert.equal(s.runeCounts.spark,15);assert.equal(s.rolls,15);assert.equal(s.upgrades.pad,4);assert.equal(s.prestige,3);
  assert.throws(()=>resetSection(s,'prestige'));
});
test('full reset creates fresh save while erase removes only the game key',()=>{
  const data=new Map([[SAVE_KEY,'old'],['unrelated','keep']]);
  const storage={setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const reset=resetStoredData(storage);assert.equal(reset.ok,true);assert.equal(reset.state.rolls,0);
  assert.equal(JSON.parse(data.get(SAVE_KEY)).prestige,0);
  assert.equal(resetStoredData(storage,true).ok,true);assert.equal(data.has(SAVE_KEY),false);assert.equal(data.get('unrelated'),'keep');
});
test('failed reset or erase reports failure instead of claiming data was removed',()=>{
  const storage={setItem(){throw Error('Quota');},removeItem(){throw Error('Blocked');}};
  assert.deepEqual(resetStoredData(storage),{ok:false});assert.deepEqual(resetStoredData(storage,true),{ok:false});
});
