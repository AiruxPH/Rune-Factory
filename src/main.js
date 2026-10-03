import { setupDeveloper } from './ui/developer.js';
import { validateContent } from './content/catalog.js';
import { load, save, resetStoredData } from './state/save.js';
import { canReforge } from './progression/reforge.js';
import { tick, buy, buyMax, reforge } from './progression/economy.js';
import { World } from './game/world.js';
import { setupDialogs } from './ui/dialogs.js';
import { createPanels, renderPanels } from './ui/panels.js';
validateContent();
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Unavailable');},setItem(){throw Error('Unavailable');}};}
const loaded=load(storage);let state=loaded.state, autosave=!loaded.error, erased=false;
let speed=1, last=performance.now(), uiElapsed=0, saveElapsed=0, toastTimer;
const status=document.querySelector('#save-status');
status.textContent=loaded.error||'Local save ready';
function notify(message){const toast=document.querySelector('#toast');toast.textContent=message;toast.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.style.display='none',3500);}
const world=new World(document.querySelector('#world'),()=>state,notify);
createPanels();
setupDialogs(world);
function persist(){if(!autosave)return;status.textContent=save(storage,state)?'Saved locally':'Save unavailable · progress is in memory';}
document.querySelector('#save').onclick=()=>{if(!autosave&&!erased){notify(loaded.error);return;}if(erased){autosave=true;erased=false;}persist();};
document.querySelector('#interact').onclick=()=>world.interact();
document.querySelectorAll('[data-buy]').forEach(button=>button.onclick=()=>{if(buy(state,button.dataset.buy))notify('Upgrade purchased');});
document.querySelectorAll('[data-max]').forEach(button=>button.onclick=()=>{const count=buyMax(state,button.dataset.max);if(count)notify(count+' upgrades purchased');});
document.querySelector('#prestige').onclick=()=>{if(canReforge(state)&&confirm(document.querySelector('#reforge-description').textContent+' Reforge now?')){if(reforge(state)){world.reset();persist();notify('Workshop reforged. Resource gains increased!');}}};
setupDeveloper({ getState:()=>state, world, notify,
  setSpeed:value=>{speed=value;world.keys.clear();},
  changed:()=>{world.forge.reset();persist();renderPanels(state,world.onPad(),world.nearForge(),world.rollFeedback);},
  resetData:erase=>{
    const result=resetStoredData(storage,erase);
    if(!result.ok){notify('Reset failed: browser storage is unavailable. Existing progress was kept.');return;}
    state=result.state;autosave=!erase;erased=erase;speed=1;saveElapsed=0;
    document.querySelector('#speed').value='1';world.reset();world.keys.clear();
    status.textContent=erase?'Saved data erased · Save now to enable saving':'Fresh progress saved';
    document.querySelector('#dev-status').textContent=status.textContent;
    renderPanels(state,false);notify(status.textContent);
  }
});
const directions={up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'};
document.querySelectorAll('[data-move]').forEach(button=>{button.onpointerdown=event=>{event.preventDefault();button.setPointerCapture(event.pointerId);world.keys.add(directions[button.dataset.move]);};for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>world.keys.delete(directions[button.dataset.move]));});
// Active play only: no catch-up income, pad gain, or node collection while hidden.
document.addEventListener('visibilitychange',()=>{world.keys.clear();last=performance.now();if(document.hidden)persist();});
window.addEventListener('pagehide',persist);
function frame(now){const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=now;if(!document.hidden){if(speed>0&&!document.querySelector('#debug-panel').open){world.update(elapsed,elapsed*speed);tick(state,elapsed*speed,{onPad:world.onPad()});}uiElapsed+=elapsed;saveElapsed+=elapsed;if(uiElapsed>=.1){renderPanels(state,world.onPad(),world.nearForge(),world.rollFeedback);document.querySelector('#prompt').textContent=world.prompt();uiElapsed=0;}if(saveElapsed>=5){persist();saveElapsed=0;}world.draw();}requestAnimationFrame(frame);}
renderPanels(state,false);requestAnimationFrame(frame);
