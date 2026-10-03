import { world } from '../content/world.js';
import { earn, rate, unlockGarden } from '../progression/economy.js';
import { ForgeCollector } from '../progression/forge.js';
import { summarizeRolls } from '../ui/roll-feedback.js';

export class World {
  constructor(canvas, getState, notify) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.getState = getState; this.notify = notify;
    this.player = { ...world.spawn }; this.keys = new Set(); this.forge = new ForgeCollector();
    this.rollFeedback = ''; this.feedbackResults = []; this.feedbackClock = 0; this.feedbackAge = 0;
    this.nodes = world.nodes.map(n => ({...n, cooldown:0}));
    window.addEventListener('keydown', event => {
      if (document.querySelector('dialog[open]') || ['INPUT','SELECT','TEXTAREA','BUTTON'].includes(event.target.tagName)) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key)) event.preventDefault();
      this.keys.add(event.key.toLowerCase());
      if (event.key.toLowerCase() === 'e' && !event.repeat) this.interact();
    });
    window.addEventListener('keyup', event => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }
  reset() { this.rollFeedback = ''; this.feedbackResults = []; this.feedbackClock = 0; this.feedbackAge = 0; this.lastRune = ''; this.player = {...world.spawn}; this.forge.reset(); this.nodes.forEach(n => n.cooldown = 0); }
  teleport(target) {
    if(target==='garden'&&!this.getState().garden)return false;
    const destinations={spawn:world.spawn,pad:{x:world.pad.x+world.pad.w/2,y:world.pad.y+world.pad.h/2},forge:{x:world.forge.x+world.forge.w/2,y:world.forge.y+world.forge.h/2},garden:{x:760,y:220}};
    if(!destinations[target])return false;
    this.player={...destinations[target]};this.keys.clear();this.forge.reset();return true;
  }
  inside(rect, x=this.player.x, y=this.player.y) { return x > rect.x && x < rect.x+rect.w && y > rect.y && y < rect.y+rect.h; }
  nearby(rect) { return this.player.x > rect.x-45 && this.player.x < rect.x+rect.w+45 && this.player.y > rect.y-45 && this.player.y < rect.y+rect.h+45; }
  nearForge() { return this.nearby(world.forge); }
  onPad() { return this.inside(world.pad); }
  interact() {
    const state = this.getState();
    if (this.nearby(world.gate) && !state.garden) {
      this.notify(unlockGarden(state) ? 'Crystal garden unlocked!' : 'You need 100 coins to open the garden.'); return;
    }
    this.notify('Stand on the mint pad for Energy, or stand on the violet rune forge to roll automatically.');
  }
  blocked(x,y) {
    const walls = this.getState().garden ? world.walls : [...world.walls, world.gate];
    return walls.some(r => x+12 > r.x && x-12 < r.x+r.w && y+12 > r.y && y-12 < r.y+r.h);
  }
  update(seconds, simulationSeconds) {
    let dx = Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft'));
    let dy = Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'));
    const length = Math.hypot(dx,dy) || 1;
    const x = Math.max(35,Math.min(925,this.player.x+dx/length*210*seconds));
    const y = Math.max(35,Math.min(605,this.player.y+dy/length*210*seconds));
    if (!this.blocked(x,this.player.y)) this.player.x=x;
    if (!this.blocked(this.player.x,y)) this.player.y=y;
    const results = this.forge.update(this.getState(), simulationSeconds, this.inside(world.forge));
    this.feedbackClock += seconds; this.feedbackAge += seconds;
    if (results.length) {
      this.feedbackResults.push(...results); this.feedbackAge = 0;
      const result = results.at(-1);
      this.lastRune = result.rune.name + (result.capped ? ' · MAX' : ' · level ' + this.getState().runes[result.rune.id]);
    }
    if (this.feedbackClock >= 1) {
      if (this.feedbackResults.length) this.rollFeedback = summarizeRolls(this.feedbackResults);
      this.feedbackResults = []; this.feedbackClock = 0;
    }
    if (this.feedbackAge > 5) this.rollFeedback = '';
    const state = this.getState();
    for (const node of this.nodes) {
      node.cooldown = Math.max(0,node.cooldown-simulationSeconds);
      if (state.garden && node.cooldown===0 && Math.hypot(this.player.x-node.x,this.player.y-node.y)<28) {
        earn(state,'crystals',rate(state,'crystals')); node.cooldown=4;
      }
    }
  }
  prompt() {
    if (this.nearby(world.gate) && !this.getState().garden) return 'Crystal garden · 100 coins · press E';
    if (this.inside(world.forge)) return this.getState().balances.energy < 20 ? 'Auto forge · waiting for 20 Energy' : 'Auto rolling · ' + (this.lastRune || '20 Energy per rune');
    if (this.nearby(world.forge)) return 'Stand inside the forge to roll automatically';
    if (this.onPad()) return 'Charging Energy · stay on the pad';
    return this.getState().garden && this.player.x>690 ? 'Walk over crystals to collect · respawn 4s' : 'Explore your workshop';
  }
  draw() {
    const c=this.ctx, state=this.getState(); c.clearRect(0,0,960,640);
    c.fillStyle='#131e28';c.fillRect(0,0,960,640);
    c.strokeStyle='#20303b';c.lineWidth=1;
    for(let x=0;x<960;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,640);c.stroke();}
    for(let y=0;y<640;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(960,y);c.stroke();}
    c.fillStyle='#182b2b';c.fillRect(690,20,250,600);
    const box=(r,color,label,subtitle)=>{c.fillStyle=color+'22';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle=color;c.lineWidth=2;c.strokeRect(r.x,r.y,r.w,r.h);c.fillStyle=color;c.textAlign='center';c.font='bold 17px system-ui';c.fillText(label,r.x+r.w/2,r.y+45);c.font='13px system-ui';c.fillText(subtitle,r.x+r.w/2,r.y+72);};
    box(world.pad,'#70dfbf','ENERGY PAD','Stand here to charge');box(world.forge,'#b6a0ff','RUNE FORGE','Stand here · auto roll');
    c.textAlign='left';c.fillStyle='#79909e';c.font='12px system-ui';c.fillText('01 / WORKSHOP',45,65);c.fillText('02 / CRYSTAL GARDEN',715,65);
    c.fillStyle='#344952';for(const wall of world.walls)c.fillRect(wall.x,wall.y,wall.w,wall.h);
    if(!state.garden){c.fillStyle='#aa8951';c.fillRect(world.gate.x,world.gate.y,world.gate.w,world.gate.h);c.save();c.translate(645,340);c.rotate(-Math.PI/2);c.fillStyle='#e6c68b';c.font='bold 14px system-ui';c.fillText('LOCKED · 100 COINS',0,0);c.restore();}
    for(const n of this.nodes){c.globalAlpha=state.garden?(n.cooldown>0?.2:1):.15;c.fillStyle='#b6a0ff';c.beginPath();c.moveTo(n.x,n.y-17);c.lineTo(n.x+12,n.y);c.lineTo(n.x,n.y+17);c.lineTo(n.x-12,n.y);c.closePath();c.fill();}c.globalAlpha=1;
    const {x,y}=this.player;c.fillStyle='#0005';c.beginPath();c.ellipse(x,y+15,16,6,0,0,Math.PI*2);c.fill();c.fillStyle='#f3d995';c.fillRect(x-11,y-12,22,25);c.fillStyle='#fff6ce';c.fillRect(x-9,y-16,18,9);c.fillStyle='#26333d';c.fillRect(x-5,y-3,3,3);c.fillRect(x+3,y-3,3,3);
    c.fillStyle='#e9eff2';c.textAlign='center';c.font='12px system-ui';c.fillText('YOU',x,y-28);
  }
}
