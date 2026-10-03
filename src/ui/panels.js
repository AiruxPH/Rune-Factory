import { currencies, runes, upgrades, pool } from '../content/catalog.js';
import { format } from '../shared/numbers.js';
import { price, rate, probabilities } from '../progression/economy.js';
import { stat } from '../progression/effects.js';
import { runeStats } from '../progression/forge.js';
const labels = { coinsGain:'Coins', energyGain:'Energy', crystalsGain:'Crystals', runeSpeed:'Rune Speed', runeLuck:'Rune Luck', runeBulk:'Rune Bulk' };
const effectText = (effect, level) => effect.operation === 'add'
  ? (effect.stat === 'runeBulk' ? '+' + format(effect.value * level) : '+' + Math.round(effect.value * level * 100) + '%') + ' ' + labels[effect.stat]
  : '×' + (effect.value ** level).toFixed(2) + ' ' + labels[effect.stat];
export function createPanels() {
  document.querySelector('#balances').innerHTML = currencies.map(c => `<div class="balance"><div><span style="color:${c.color}">${c.name}</span><small id="rate-${c.id}"></small></div><strong id="balance-${c.id}">0</strong></div>`).join('');
  document.querySelector('#currency-tabs').innerHTML = currencies.map((c,i) => `<button role="tab" aria-selected="${i===0}" data-currency="${c.id}" style="--accent:${c.color}">${c.name}</button>`).join('');
  document.querySelector('#upgrades').innerHTML = upgrades.map(u => `<article class="upgrade" data-group="${u.currency}"><strong>${u.name}</strong><small id="level-${u.id}"></small><div class="upgrade-icon">${u.currency==='coins'?'◉':u.currency==='energy'?'ϟ':'◆'}</div><p>${u.description}</p><small id="preview-${u.id}"></small><small id="cost-${u.id}"></small><div class="buy-actions"><button data-buy="${u.id}">Buy</button><button data-max="${u.id}">Max</button></div></article>`).join('');
  document.querySelector('#runes').innerHTML = runes.map(r => `<article class="rune" style="--accent:${r.color}"><strong>${r.name}</strong><small>Basic</small><small id="chance-${r.id}"></small><div class="rune-symbol">◆</div><div class="level"><span id="rune-${r.id}"></span><div class="bar"><i id="bar-${r.id}" style="background:${r.color}"></i></div></div><div class="rune-effects" id="effects-${r.id}"></div><small class="max-effects">At max: ${r.effects.map(e=>effectText(e,r.cap)).join(' · ')}</small></article>`).join('');
}
export function renderPanels(state,onPad,nearForge=false) {
  for(const c of currencies){document.querySelector('#balance-'+c.id).textContent=format(state.balances[c.id]);document.querySelector('#rate-'+c.id).textContent=c.method==='gather'?format(rate(state,c.id))+' / node':format(rate(state,c.id))+' / sec'+(c.method==='pad'&&!onPad&&!state.upgrades.autoEnergy?' · pad inactive':'');}
  for(const u of upgrades){
    const level=state.upgrades[u.id], max=level>=u.cap, cost=price(state,u);
    for(const selector of ['data-buy','data-max']){const b=document.querySelector(`[${selector}="${u.id}"]`);b.disabled=max||state.balances[u.currency]<cost;}
    document.querySelector(`[data-buy="${u.id}"]`).textContent=max?'MAXED':'Buy';
    document.querySelector('#level-'+u.id).textContent=`Level ${level} / ${u.cap}`;
    document.querySelector('#cost-'+u.id).textContent=max?'Fully upgraded':format(cost)+' '+u.currency;
    const preview=u.effects[0];
    document.querySelector('#preview-'+u.id).textContent=preview?effectText(preview,level)+(max?'':' → '+effectText(preview,level+1)):level?'Automation active':'Unlock automatic income';
  }
  const selected=document.querySelector('[data-currency][aria-selected="true"]')?.dataset.currency||'coins';
  document.querySelector('#upgrade-balance').textContent=format(state.balances[selected])+' '+selected+' available';
  const chances=probabilities(state);
  runes.forEach((r,i)=>{
    const level=state.runes[r.id];
    document.querySelector('#rune-'+r.id).textContent=level>=r.cap?'LVL '+level+' · MAX':'LVL '+level+' / '+r.cap;
    document.querySelector('#bar-'+r.id).style.width=level/r.cap*100+'%';
    document.querySelector('#chance-'+r.id).textContent='1 / '+format(1/chances[i]);
    document.querySelector('#effects-'+r.id).textContent=level?r.effects.map(e=>effectText(e,level)).join(' · '):'Not collected';
  });
  const stats=runeStats(state);
  document.querySelector('#rune-stats').innerHTML=`<div class="luck">×${format(stats.luck)} Rune Luck</div><div class="bulk">${format(stats.bulk)} Rune Bulk</div><div class="speed">${stats.interval.toFixed(3)}s Rune Speed${stats.interval<=.05?' · MAX':''}</div><div class="rps">${format(stats.rps)} RPS</div>${stats.conversion>1?'<small>Excess speed → ×'+stats.conversion.toFixed(2)+' bulk</small>':''}`;
  const board=document.querySelector('#forge-board');board.hidden=!nearForge;
  board.innerHTML='<strong>Starter rune content</strong>'+runes.map((r,i)=>`<div style="color:${r.color}">${r.name} · ${(chances[i]*100).toFixed(2)}%</div>`).join('')+'<small>'+format(state.rolls)+' opened · '+format(Math.floor(state.balances[pool.currency]/pool.cost))+' affordable rolls</small>'
    +'<section class="opened-runes"><strong>Opened rune quantities</strong>'
    +runes.map(r=>`<div class="opened-row" style="color:${r.color}"><span>${r.name}</span><b>×${format(state.runeCounts[r.id])}</b></div>`).join('')
    +(state.untrackedRolls?'<small>'+format(state.untrackedRolls)+' earlier rolls are untracked</small>':'')+'</section>';
  document.querySelector('#rune-total').textContent=format(state.rolls)+' OPENED';
  document.querySelector('#area-status').textContent=state.garden?'Crystal garden open':'Crystal garden locked';
  document.querySelector('#prestige').disabled=state.balances.coins<1000||state.balances.crystals<25;
  document.querySelector('#prestige-status').textContent=`Reforges: ${state.prestige} · Resource multiplier: ×${(1+state.prestige*.25).toFixed(2)}`;
}
