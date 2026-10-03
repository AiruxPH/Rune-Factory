import { currencies, runes, upgrades } from '../content/catalog.js';
import { editCurrency, setLevel, setReforges, prepareReforge, resetSection } from '../progression/developer.js';

export function setupDeveloper({ getState, changed, notify, world, setSpeed, resetData }) {
  const panel = document.querySelector('#debug-panel');
  const q = selector => panel.querySelector(selector);
  const options = entries => entries.map(x => `<option value="${x.id}">${x.name}</option>`).join('');
  q('#dev-currency').innerHTML = options(currencies);
  q('#dev-rune').innerHTML = options(runes);
  q('#dev-upgrade').innerHTML = options(upgrades);
  const run = action => { try { action(); changed(); report('Applied. Progress changes are saved when saving is enabled.'); } catch (error) { report(error.message); } };
  function report(message) { q('#dev-status').textContent = message; notify(message); }
  panel.querySelectorAll('[data-dev-tab]').forEach(button => button.onclick = () => {
    panel.querySelectorAll('[data-dev-tab]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    panel.querySelectorAll('[data-dev-section]').forEach(s => s.hidden = s.dataset.devSection !== button.dataset.devTab);
  });
  panel.querySelectorAll('[data-currency-edit]').forEach(button => button.onclick = () => run(() => editCurrency(getState(), q('#dev-currency').value, q('#dev-amount').value, button.dataset.currencyEdit)));
  panel.querySelectorAll('[data-grant]').forEach(button => button.onclick = () => run(() => currencies.forEach(c => editCurrency(getState(), c.id, button.dataset.grant, 'add'))));
  const syncInputs = [];
  for (const [kind, key, entries] of [['runes','rune',runes],['upgrades','upgrade',upgrades]]) {
    const select = q('#dev-'+key), input = q('#dev-'+key+'-level');
    const sync = () => { const item=entries.find(x=>x.id===select.value); input.max=item.cap; input.value=getState()[kind][item.id]; q('#dev-'+key+'-cap').textContent='Maximum level: '+item.cap; };
    select.onchange = sync; sync(); syncInputs.push(sync);
    q('#dev-set-'+key).onclick = () => run(() => setLevel(getState(),kind,select.value,input.value));
    q('#dev-max-'+key).onclick = () => run(() => { for(const item of entries)setLevel(getState(),kind,item.id,item.cap); sync(); });
  }
  new MutationObserver(() => { if(panel.open){syncInputs.forEach(sync=>sync());q('#dev-prestige').value=getState().prestige;} }).observe(panel,{attributes:true,attributeFilter:['open']});
  q('#dev-reforges').onclick = () => run(() => { setReforges(getState(),q('#dev-prestige').value);world.reset(); });
  q('#dev-ready').onclick = () => run(() => prepareReforge(getState()));
  q('#dev-garden').onclick = () => run(() => { getState().garden=true; });
  q('#speed').onchange = event => { setSpeed(Number(event.target.value)); report(Number(event.target.value)===0?'Simulation paused.':'Simulation speed updated.'); };
  panel.querySelectorAll('[data-teleport]').forEach(button => button.onclick = () => {
    if (!world.teleport(button.dataset.teleport)) { report('Unlock the garden first.'); return; }
    panel.close(); report('Teleported to '+button.textContent+'.');
  });
  panel.querySelectorAll('[data-reset-section]').forEach(button => button.onclick = () => {
    const section=button.dataset.resetSection;
    if(confirm(`Reset ${section} to zero? ${section==='runes'?'Rune copy progress resets too; lifetime opening counts remain.':'Other progress remains.'}`))run(()=>resetSection(getState(),section));
  });
  q('#dev-reset').onclick = () => { if(confirm('Reset ALL progress, including runes, opening counts, upgrades and Reforges? A fresh save will replace this browser’s save.')) resetData(false); };
  q('#dev-erase').onclick = () => { if(confirm('Delete this browser’s Rune Factory save and clear all current progress? Saving stays paused until you press Save now.')) resetData(true); };
  document.addEventListener('keydown', event => {
    if(event.code!=='KeyD'||!event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||event.repeat||event.target.closest('input,select,textarea,[contenteditable="true"]'))return;
    if(document.querySelector('dialog[open]') && !panel.open)return;
    event.preventDefault();world.keys.clear();if(panel.open)panel.close();else panel.showModal();
  });
}
