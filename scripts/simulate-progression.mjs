// Deterministic economy check, not a substitute for a human playtest.
// Normal time, no grants. Three-second travel between stations, one garden
// node every four seconds, and the same purchases suggested by the goal guide.
import { newPlayer } from '../src/state/player.js';
import { tick, buy, unlockGarden, earn, rate, reforge } from '../src/progression/economy.js';
import { ForgeCollector } from '../src/progression/forge.js';
import { seededRandom } from '../src/shared/numbers.js';

export function simulate(seed) {
  const state=newPlayer(), forge=new ForgeCollector(), random=seededRandom(seed);
  const events={};let station='pad', destination='pad', travel=3, node=0;
  for(let step=0;step<9000;step++){
    const dt=.1,time=(step+1)*dt;
    if(!state.upgrades.income)buy(state,'income');
    if(state.rolls && state.upgrades.pad<3)buy(state,'pad');
    if(state.upgrades.pad>=3)buy(state,'autoEnergy');
    if(state.upgrades.autoEnergy&&!state.garden&&station==='gate'&&!travel)unlockGarden(state);
    if(state.garden && state.upgrades.income<5)buy(state,'income');
    const target=!state.rolls?(state.balances.energy>=20?'forge':'pad'):
      !state.upgrades.autoEnergy?'pad':!state.garden?'gate':
      state.balances.crystals<25?'garden':'forge';
    if(target!==destination && travel===0){destination=target;travel=3;}
    if(travel>0){travel=Math.max(0,travel-dt);if(travel===0)station=destination;}
    forge.update(state,dt,travel===0&&station==='forge',random);
    tick(state,dt,{onPad:travel===0&&station==='pad'});
    node=Math.max(0,node-dt);
    if(!travel&&station==='garden'&&node===0){earn(state,'crystals',rate(state,'crystals'));node=4;}
    for(const [key,done] of Object.entries({firstUpgrade:state.upgrades.income>0,firstRune:state.rolls>0,automation:state.upgrades.autoEnergy>0,garden:state.garden}))
      if(done&&!events[key])events[key]=Math.round(time);
    if(reforge(state))return {seed,...events,firstReforge:Math.round(time),runesOpened:state.rolls};
  }
  throw Error(`Seed ${seed}: first Reforge not reached in 15 minutes`);
}
if(process.argv[1]?.endsWith('simulate-progression.mjs')) console.table([1,42,99,2026,777].map(simulate));
