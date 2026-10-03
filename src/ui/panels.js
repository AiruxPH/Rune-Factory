import { currencies, runes, upgrades } from '../content/catalog.js';
import { format } from '../shared/numbers.js';
import { price, rate, probabilities } from '../progression/economy.js';
export function createPanels() {
  document.querySelector('#balances').innerHTML=currencies.map(c=>`<div class="balance"><div><span style="color:${c.color}">${c.name}</span><small id="rate-${c.id}"></small></div><strong id="balance-${c.id}">0</strong></div>`).join('');
  document.querySelector('#upgrades').innerHTML=upgrades.map(u=>`<div class="upgrade"><div><strong>${u.name}</strong><small>${u.description}</small><small id="level-${u.id}"></small></div><button data-buy="${u.id}"></button></div>`).join('');
  document.querySelector('#runes').innerHTML=runes.map(r=>`<div class="rune"><div><strong style="color:${r.color}">${r.name}</strong><small id="chance-${r.id}"></small><small>${r.effects.map(e=>e.operation==='add'?`+${Math.round(e.value*100)}% ${e.stat} / level`:`×${e.value} ${e.stat} / level`).join(' · ')}</small></div><div class="level"><span id="rune-${r.id}"></span><div class="bar"><i id="bar-${r.id}" style="background:${r.color}"></i></div></div></div>`).join('');
}
export function renderPanels(state,onPad) {
  for(const c of currencies){document.querySelector('#balance-'+c.id).textContent=format(state.balances[c.id]);document.querySelector('#rate-'+c.id).textContent=c.method==='gather'?format(rate(state,c.id))+' / node':format(rate(state,c.id))+' / sec'+(c.method==='pad'&&!onPad&&!state.upgrades.autoEnergy?' · pad inactive':'');}
  for(const u of upgrades){const button=document.querySelector(`[data-buy="${u.id}"]`);const max=state.upgrades[u.id]>=u.cap;button.textContent=max?'MAX':format(price(state,u))+' '+u.currency;button.disabled=max||state.balances[u.currency]<price(state,u);document.querySelector('#level-'+u.id).textContent=`Level ${state.upgrades[u.id]} / ${u.cap}`;}
  const chances=probabilities(state);runes.forEach((r,i)=>{document.querySelector('#rune-'+r.id).textContent=state.runes[r.id]+' / '+r.cap;document.querySelector('#bar-'+r.id).style.width=state.runes[r.id]/r.cap*100+'%';document.querySelector('#chance-'+r.id).textContent=(chances[i]*100).toFixed(2)+'% current chance';});
  document.querySelector('#rune-total').textContent=format(state.rolls)+' OPENED';
  document.querySelector('#area-status').textContent=state.garden?'Crystal garden open':'Crystal garden locked';
  document.querySelector('#prestige').disabled=state.balances.coins<1000||state.balances.crystals<25;
  document.querySelector('#prestige-status').textContent=`Reforges: ${state.prestige} · Resource multiplier: ×${(1+state.prestige*.25).toFixed(2)}`;
}
