import { validateContent } from './content/catalog.js';
import { load, save, SAVE_KEY } from './state/save.js';
import { newPlayer } from './state/player.js';
import { tick, buy, earn, reforge } from './progression/economy.js';
import { World } from './game/world.js';
import { createPanels, renderPanels } from './ui/panels.js';
validateContent();
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}};}
const loaded=load(storage);let state=loaded.state, autosave=!loaded.error;
let speed=1, last=performance.now(), uiElapsed=0, saveElapsed=0, toastTimer;
const status=document.querySelector('#save-status');
status.textContent=loaded.error||'Local save ready';
function notify(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.display='none',3500);}
const world=new World(document.querySelector('#world'),()=>state,notify);
createPanels();
function persist(){if(!autosave)return;status.textContent=save(storage,state)?'Saved locally':'Save unavailable · progress is in memory';}
document.querySelector('#save').onclick=()=>{if(!autosave){notify(loaded.error);return;}persist();};
document.querySelector('#interact').onclick=()=>world.interact();
document.querySelectorAll('[data-buy]').forEach(button=>button.onclick=()=>{if(buy(state,button.dataset.buy))notify('Upgrade purchased');});
document.querySelector('#prestige').onclick=()=>{if(confirm('Reforge? Currencies, upgrades, and the garden unlock will reset. Runes remain.')){if(reforge(state)){world.reset();persist();notify('Workshop reforged. Resource gains increased!');}}};
document.querySelector('#grant').onclick=()=>{for(const id of ['coins','energy','crystals'])earn(state,id,1000);notify('Testing resources granted');};
document.querySelector('#unlock').onclick=()=>{state.garden=true;notify('Garden unlocked for testing');};
document.querySelector('#speed').onchange=event=>{speed=Number(event.target.value);};
document.querySelector('#wipe').onclick=()=>{if(confirm('Erase this browser’s Rune Factory progress and start fresh?')){try{storage.removeItem(SAVE_KEY);}catch{}state=newPlayer();autosave=true;world.reset();persist();notify('Fresh workshop started');}};
const directions={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'};
document.querySelectorAll('[data-move]').forEach(button=>{button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);world.keys.add(directions[button.dataset.move]);};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>world.keys.delete(directions[button.dataset.move]));});
// Active play only: no catch-up income, pad gain, or node collection while hidden.
document.addEventListener('visibilitychange',()=>{world.keys.clear();last=performance.now();if(document.hidden)persist();});
window.addEventListener('pagehide',persist);
function frame(now){const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(!document.hidden){world.update(elapsed,elapsed*speed);tick(state,elapsed*speed,{onPad:world.onPad()});uiElapsed+=elapsed;saveElapsed+=elapsed;if(uiElapsed>=.1){renderPanels(state,world.onPad());document.querySelector('#prompt').textContent=world.prompt();uiElapsed=0;}if(saveElapsed>=5){persist();saveElapsed=0;}world.draw();}requestAnimationFrame(frame);}
renderPanels(state,false);requestAnimationFrame(frame);
