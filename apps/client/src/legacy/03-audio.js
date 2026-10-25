// Ported from prototype/ball-battle.html (lines 848-989). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- AUDIO (procedural) ---------- */
const AU={ctx:null,master:null,mus:null,fx:null,musOn:true,fxOn:true,track:null,step:0,next:0,last:{},nb:null};
try{AU.musOn=localStorage.getItem('bb-music')!=='0';AU.fxOn=localStorage.getItem('bb-sfx')!=='0'}catch(e){}
function auInit(){
  if(AU.ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  try{const c=new AC();AU.ctx=c;const comp=c.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=5;comp.attack.value=0.003;comp.release.value=0.2;comp.connect(c.destination);
    AU.master=c.createGain();AU.master.gain.value=0.9;AU.master.connect(comp);
    AU.mus=c.createGain();AU.mus.gain.value=AU.musOn?0.3:0;AU.mus.connect(AU.master);
    AU.fx=c.createGain();AU.fx.gain.value=AU.fxOn?0.85:0;AU.fx.connect(AU.master);
    const nb=c.createBuffer(1,c.sampleRate,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=nb;
    setInterval(auSched,30);return true}catch(e){AU.ctx=null;return false}}
function auWake(){if(!auInit())return;Object.values(MUSIC_FILES).flat().forEach(musicLoad);if(AU.ctx.state==='suspended')AU.ctx.resume();musicFor()}
document.addEventListener('pointerdown',auWake,{capture:true});document.addEventListener('keydown',auWake,{capture:true});
const mtof=m=>440*Math.pow(2,(m-69)/12);
function tone(f,d,o){o=o||{};const c=AU.ctx,t=o.at||c.currentTime,os=c.createOscillator(),g=c.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(f,t);if(o.to)os.frequency.exponentialRampToValueAtTime(Math.max(20,o.to),t+(o.slide||d));if(o.det)os.detune.value=o.det;
  const v=o.vol==null?0.3:o.vol,a=o.atk||0.005;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  let n=os;if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.setValueAtTime(o.lp,t);if(o.lpTo)fl.frequency.exponentialRampToValueAtTime(o.lpTo,t+d);fl.Q.value=o.q||1;os.connect(fl);n=fl}
  n.connect(g);g.connect(o.out||AU.fx);os.start(t);os.stop(t+d+0.05)}
function noise(d,o){o=o||{};const c=AU.ctx,t=o.at||c.currentTime,s=c.createBufferSource(),g=c.createGain(),fl=c.createBiquadFilter();s.buffer=AU.nb;s.loop=true;fl.type=o.ft||'lowpass';fl.frequency.setValueAtTime(o.f||2000,t);if(o.fTo)fl.frequency.exponentialRampToValueAtTime(o.fTo,t+d);fl.Q.value=o.q||0.8;
  const v=o.vol==null?0.3:o.vol;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(v,t+(o.atk||0.004));g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  s.connect(fl);fl.connect(g);g.connect(o.out||AU.fx);s.start(t,Math.random()*0.5);s.stop(t+d+0.05)}
const arp=(notes,gap,o)=>notes.forEach((m,i)=>tone(mtof(m),o.d||0.18,Object.assign({},o,{at:AU.ctx.currentTime+i*gap})));
const SFX={
  click:()=>tone(880,0.06,{type:'triangle',vol:0.12,to:1200,slide:0.04}),
  tap:()=>{noise(0.12,{f:900,fTo:3000,ft:'bandpass',vol:0.12,q:2});tone(300,0.08,{type:'sine',vol:0.08,to:520})},
  hit:()=>{tone(170+Math.random()*40,0.12,{type:'sine',vol:0.32,to:70});noise(0.06,{f:2500,vol:0.12})},
  hitBig:()=>{tone(120,0.22,{type:'sine',vol:0.5,to:45});noise(0.14,{f:1800,fTo:400,vol:0.28});tone(90,0.2,{type:'square',vol:0.06,to:50,lp:600})},
  ability:()=>{tone(520,0.25,{type:'sawtooth',vol:0.08,to:1400,lp:2400});tone(780,0.3,{type:'triangle',vol:0.1,to:1560,slide:0.15});noise(0.3,{f:600,fTo:5000,ft:'bandpass',vol:0.1,q:1.5})},
  boomS:()=>{tone(110,0.4,{type:'sine',vol:0.45,to:35});noise(0.45,{f:1600,fTo:200,vol:0.32})},
  zapS:()=>{noise(0.12,{f:4000,ft:'highpass',vol:0.12});tone(1400,0.1,{type:'square',vol:0.05,to:300,lp:3000})},
  pickup:()=>arp([76,80,83,88],0.06,{type:'triangle',vol:0.14,d:0.16}),
  count:()=>tone(660,0.15,{type:'square',vol:0.09,lp:2200}),
  go:()=>{tone(990,0.35,{type:'square',vol:0.1,lp:3000});tone(1320,0.35,{type:'triangle',vol:0.1})},
  emote:()=>{tone(600,0.08,{type:'sine',vol:0.15,to:900});tone(900,0.12,{type:'sine',vol:0.12,to:1300,at:AU.ctx.currentTime+0.07})},
  roundWin:()=>arp([67,71,74,79],0.09,{type:'square',vol:0.09,d:0.22,lp:2600}),
  roundLose:()=>arp([67,63,60,55],0.12,{type:'triangle',vol:0.12,d:0.3}),
  win:()=>{arp([62,66,69,74,78,81,86],0.07,{type:'square',vol:0.08,d:0.25,lp:3000});arp([50,57,62],0.24,{type:'triangle',vol:0.18,d:0.6})},
  lose:()=>{arp([62,61,58,55,50],0.17,{type:'triangle',vol:0.14,d:0.4});tone(98,1.1,{type:'sawtooth',vol:0.06,lp:400,at:AU.ctx.currentTime+0.7})},
  reel:()=>tone(1500+Math.random()*200,0.03,{type:'square',vol:0.04,lp:4000}),
  reelHit:()=>{tone(392,0.3,{type:'square',vol:0.09,lp:2000});tone(587,0.35,{type:'triangle',vol:0.12,at:AU.ctx.currentTime+0.06})},
  chestDrop:()=>{tone(90,0.3,{type:'sine',vol:0.5,to:40});noise(0.25,{f:700,fTo:200,vol:0.25})},
  chestShake:()=>{noise(0.08,{f:1200,ft:'bandpass',vol:0.15,q:3});tone(220,0.06,{type:'square',vol:0.05,lp:800})},
  chestOpen:()=>{noise(0.6,{f:500,fTo:8000,ft:'bandpass',vol:0.22,q:0.7});arp([72,76,79,84,88],0.05,{type:'triangle',vol:0.13,d:0.4});tone(130,0.4,{type:'sine',vol:0.4,to:60})},
  reveal:()=>{tone(1046,0.25,{type:'triangle',vol:0.12});tone(1568,0.3,{type:'sine',vol:0.08,at:AU.ctx.currentTime+0.05});noise(0.15,{f:6000,ft:'highpass',vol:0.05})},
  revealBig:()=>{arp([72,79,84,88,91,96],0.06,{type:'square',vol:0.07,d:0.5,lp:5000});noise(0.8,{f:3000,fTo:9000,ft:'bandpass',vol:0.1})},
  coin:()=>{tone(1318,0.08,{type:'square',vol:0.06,lp:5000});tone(1976,0.25,{type:'square',vol:0.06,lp:5000,at:AU.ctx.currentTime+0.07})},
  upgrade:()=>{arp([60,64,67,72,76,79,84],0.05,{type:'triangle',vol:0.13,d:0.3});noise(0.6,{f:2000,fTo:8000,ft:'bandpass',vol:0.08})},
  /* finisher palette */
  finishHim:()=>{tone(55,1.6,{type:'sawtooth',vol:0.16,lp:300,lpTo:120});tone(41,1.8,{type:'sine',vol:0.4,to:30});noise(1.2,{f:300,fTo:80,vol:0.25});
    [0,0.18].forEach(d=>tone(mtof(50),0.6,{type:'square',vol:0.08,lp:700,at:AU.ctx.currentTime+0.25+d}))},
  finGo:()=>{noise(0.4,{f:200,fTo:6000,ft:'bandpass',vol:0.25,q:1.2});tone(80,0.35,{type:'sine',vol:0.45,to:200})},
  fatality:()=>{tone(36,2,{type:'sine',vol:0.5,to:30});tone(73,1.6,{type:'sawtooth',vol:0.1,lp:500,lpTo:150});[0,0.22,0.44].forEach((d,i)=>{tone(mtof([50,53,56][i]),0.5,{type:'square',vol:0.08,lp:1200,at:AU.ctx.currentTime+d});noise(0.2,{f:900,vol:0.18,at:AU.ctx.currentTime+d})})},
  punch:()=>{tone(140,0.14,{type:'sine',vol:0.5,to:55});noise(0.09,{f:3000,fTo:600,vol:0.3})},
  uppercut:()=>{noise(0.35,{f:300,fTo:5000,ft:'bandpass',vol:0.3});tone(90,0.3,{type:'sine',vol:0.55,to:40});tone(300,0.4,{type:'triangle',vol:0.1,to:1600,at:AU.ctx.currentTime+0.05})},
  twinkle:()=>arp([96,100,103],0.07,{type:'sine',vol:0.08,d:0.3}),
  volley:()=>{for(let i=0;i<6;i++)noise(0.12,{f:3500,ft:'bandpass',vol:0.08,q:3,at:AU.ctx.currentTime+i*0.035})},
  thunk:()=>{tone(260,0.07,{type:'square',vol:0.07,to:90,lp:1500});noise(0.04,{f:2000,vol:0.1})},
  charge:()=>{tone(200,0.6,{type:'sawtooth',vol:0.07,to:1600,lp:3000,slide:0.55});noise(0.6,{f:500,fTo:6000,ft:'bandpass',vol:0.08})},
  shatter:()=>{noise(0.6,{f:5000,fTo:1500,ft:'highpass',vol:0.25});tone(100,0.35,{type:'sine',vol:0.45,to:40});for(let i=0;i<6;i++)tone(2000+Math.random()*2500,0.15,{type:'triangle',vol:0.05,at:AU.ctx.currentTime+Math.random()*0.25})},
  drain:()=>{tone(300,1.9,{type:'sawtooth',vol:0.05,to:120,lp:900});noise(1.9,{f:400,fTo:200,ft:'bandpass',vol:0.12,q:4})},
  burp:()=>tone(110,0.45,{type:'sawtooth',vol:0.16,to:80,lp:500,det:0}),
  jump:()=>tone(200,0.3,{type:'square',vol:0.07,to:900,lp:2000}),
  slam:()=>{tone(70,0.6,{type:'sine',vol:0.7,to:28});noise(0.5,{f:900,fTo:120,vol:0.4})},
  gas:()=>noise(0.9,{f:700,fTo:300,ft:'bandpass',vol:0.15,q:0.6}),
  melt:()=>{for(let i=0;i<8;i++)tone(200+Math.random()*300,0.1,{type:'sine',vol:0.08,to:80+Math.random()*80,at:AU.ctx.currentTime+i*0.2})},
  freeze:()=>{noise(1.0,{f:6000,fTo:2500,ft:'highpass',vol:0.12});arp([84,91,96],0.12,{type:'sine',vol:0.06,d:0.6})},
  tink:()=>tone(2600,0.4,{type:'sine',vol:0.12}),
  fuse:()=>noise(0.9,{f:5000,ft:'highpass',vol:0.08}),
  boom:()=>{tone(60,1.0,{type:'sine',vol:0.75,to:24});noise(1.2,{f:2000,fTo:100,vol:0.5});tone(110,0.6,{type:'sawtooth',vol:0.08,to:40,lp:500})},
  cough:()=>{[0,0.18].forEach(d=>noise(0.12,{f:600,ft:'bandpass',vol:0.2,q:2,at:AU.ctx.currentTime+d}))},
  thud:()=>{tone(80,0.3,{type:'sine',vol:0.45,to:40});noise(0.15,{f:400,vol:0.2})},
  zap:()=>{noise(0.18,{f:3000,ft:'highpass',vol:0.18});tone(1800,0.15,{type:'sawtooth',vol:0.05,to:200,lp:4000})},
  thunder:()=>{noise(1.6,{f:1500,fTo:80,vol:0.55});tone(45,1.3,{type:'sine',vol:0.5,to:28})},
  crackle:()=>{for(let i=0;i<10;i++)noise(0.04,{f:5000,ft:'highpass',vol:0.12,at:AU.ctx.currentTime+Math.random()*0.5})},
  chime:()=>arp([84,88,91,96],0.08,{type:'sine',vol:0.08,d:0.9}),
  beam:()=>{tone(400,1.0,{type:'sawtooth',vol:0.05,to:800,lp:2000});tone(600,1.0,{type:'sine',vol:0.08,det:12})},
  glass:()=>{noise(0.7,{f:6000,fTo:2000,ft:'highpass',vol:0.28});for(let i=0;i<10;i++)tone(2500+Math.random()*3000,0.2,{type:'sine',vol:0.05,at:AU.ctx.currentTime+Math.random()*0.35})},
  whoosh:()=>noise(0.45,{f:300,fTo:3000,ft:'bandpass',vol:0.22,q:1.5}),
  possess:()=>{tone(220,1.0,{type:'sine',vol:0.12,to:110,det:0});tone(233,1.0,{type:'sine',vol:0.1,to:116})},
  yank:()=>{tone(300,0.4,{type:'triangle',vol:0.12,to:1200});noise(0.3,{f:800,fTo:4000,ft:'bandpass',vol:0.15})},
  deflate:()=>{tone(500,1.0,{type:'sawtooth',vol:0.06,to:90,lp:1200});noise(1.0,{f:2000,fTo:400,ft:'bandpass',vol:0.12,q:3})},
  inhale:()=>noise(0.65,{f:300,fTo:2500,ft:'bandpass',vol:0.16,q:1}),
  flame:()=>{noise(1.4,{f:900,ft:'lowpass',vol:0.4,atk:0.05});tone(70,1.4,{type:'sawtooth',vol:0.06,lp:300})},
  puff:()=>noise(0.3,{f:1500,ft:'bandpass',vol:0.12,q:1}),
  crumble:()=>{for(let i=0;i<10;i++)noise(0.08,{f:800+Math.random()*1200,ft:'bandpass',vol:0.12,q:2,at:AU.ctx.currentTime+i*0.05})},
  poke:()=>tone(1200,0.06,{type:'square',vol:0.06,lp:4000}),
  inflate:()=>tone(150,0.75,{type:'sawtooth',vol:0.06,to:600,lp:1200}),
  pop:()=>{noise(0.1,{f:3000,vol:0.35});tone(900,0.08,{type:'square',vol:0.08,to:200})},
  fart:()=>{const c=AU.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();o.type='sawtooth';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(70,t+1.2);l.frequency.value=24;lg.gain.value=30;l.connect(lg);lg.connect(o.frequency);g.gain.setValueAtTime(0.14,t);g.gain.exponentialRampToValueAtTime(0.001,t+1.3);const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=700;o.connect(f);f.connect(g);g.connect(AU.fx);o.start(t);l.start(t);o.stop(t+1.35);l.stop(t+1.35)},
  splat:()=>{noise(0.25,{f:700,fTo:200,vol:0.4});tone(120,0.2,{type:'sine',vol:0.35,to:50})},
  wind:()=>noise(1.6,{f:400,fTo:1400,ft:'bandpass',vol:0.22,q:0.8,atk:0.3}),
  rise:()=>{tone(220,1.0,{type:'sawtooth',vol:0.06,to:880,lp:2500});arp([69,73,76,81],0.15,{type:'triangle',vol:0.08,d:0.5})},
  kick:()=>{tone(150,0.12,{type:'sine',vol:0.55,to:60});noise(0.06,{f:1800,vol:0.25})},
  goal:()=>{noise(1.4,{f:1200,ft:'bandpass',vol:0.18,q:0.4,atk:0.1});arp([72,76,79,84],0.1,{type:'square',vol:0.07,d:0.4,lp:3000})},
  magic:()=>arp([79,83,86,91,95],0.06,{type:'sine',vol:0.08,d:0.35}),
  vines:()=>{for(let i=0;i<6;i++)noise(0.12,{f:1200,ft:'bandpass',vol:0.08,q:3,at:AU.ctx.currentTime+i*0.12})},
  pot:()=>tone(330,0.25,{type:'triangle',vol:0.15,to:280}),
  bloom:()=>{arp([72,76,79,84,88],0.1,{type:'triangle',vol:0.1,d:0.6});tone(1046,0.8,{type:'sine',vol:0.05,det:8,at:AU.ctx.currentTime+0.4})},
  glint:()=>tone(3200,0.25,{type:'sine',vol:0.08}),
  slash:()=>noise(0.12,{f:2500,fTo:7000,ft:'bandpass',vol:0.18,q:2}),
  sheathe:()=>{noise(0.5,{f:3000,fTo:1500,ft:'bandpass',vol:0.12,q:6});tone(1800,0.2,{type:'sine',vol:0.05,at:AU.ctx.currentTime+0.45})},
  cut:()=>{noise(0.25,{f:8000,fTo:2000,ft:'highpass',vol:0.25});tone(90,0.4,{type:'sine',vol:0.45,to:35})},
  water:()=>noise(0.9,{f:500,fTo:1200,ft:'lowpass',vol:0.22,atk:0.2}),
  sing:()=>arp([74,77,81,79,77,74],0.14,{type:'sine',vol:0.1,d:0.3,det:6}),
  bubble:()=>tone(400,0.2,{type:'sine',vol:0.12,to:1100}),
  splash:()=>noise(0.4,{f:1500,fTo:500,vol:0.25}),
  rainbow:()=>{arp([72,76,79,83,86,90,93],0.08,{type:'triangle',vol:0.07,d:0.4});tone(400,1.0,{type:'sine',vol:0.06,to:800})},
  confetti:()=>{noise(0.25,{f:3000,vol:0.35});tone(100,0.3,{type:'sine',vol:0.4,to:40});setTimeout(()=>{if(AU.ctx)arp([84,88,91,96],0.05,{type:'triangle',vol:0.08,d:0.3})},120)},
  throw:()=>noise(0.25,{f:600,fTo:3500,ft:'bandpass',vol:0.2,q:2}),
  stab:()=>{tone(180,0.15,{type:'sine',vol:0.4,to:60});noise(0.1,{f:2500,vol:0.2})},
  flutter:()=>{for(let i=0;i<10;i++)noise(0.05,{f:1500,ft:'bandpass',vol:0.05,q:2,at:AU.ctx.currentTime+i*0.06})},
  wrap:()=>noise(0.9,{f:2500,fTo:1200,ft:'bandpass',vol:0.08,q:4}),
  wiggle:()=>{for(let i=0;i<6;i++)tone(180,0.06,{type:'square',vol:0.05,lp:700,at:AU.ctx.currentTime+i*0.12})},
  hatch:()=>{noise(0.2,{f:2000,vol:0.2});arp([84,88],0.08,{type:'sine',vol:0.08,d:0.3})}
};
function sfx(n){if(!AU.ctx||!AU.fxOn||!SFX[n])return;const now=AU.ctx.currentTime;if(AU.last[n]&&now-AU.last[n]<0.045)return;AU.last[n]=now;try{SFX[n]()}catch(e){}}
/* music: Hijaz-flavoured loops */
const HJ=[0,1,4,5,7,8,10];const deg=(d,base)=>{const o=Math.floor(d/7),i=((d%7)+7)%7;return base+o*12+HJ[i]};
const TRACKS={
  menu:{bpm:92,len:64,step(s,t,sd){const bar=Math.floor(s/16),st=s%16,roots=[0,0,3,-2];const r=roots[bar%4];
      if(st%4===0)tone(mtof(deg(r,38)),sd*3.6,{type:'triangle',vol:0.2,at:t,out:AU.mus});
      if(st===0){[0,2,4].forEach(x=>tone(mtof(deg(r+x,62)),sd*15,{type:'sine',vol:0.035,atk:0.4,at:t,out:AU.mus,det:x*3}))}
      const ap=[0,2,4,7,4,2,0,2,4,7,9,7,4,2,4,2];if(st%2===0)tone(mtof(deg(r+ap[st],62)),sd*1.6,{type:'triangle',vol:0.07,at:t,out:AU.mus,lp:2400});
      if(st%4===2)noise(0.05,{f:7000,ft:'highpass',vol:0.035,at:t,out:AU.mus});
      if(st===0||st===10)tone(110,0.18,{type:'sine',vol:0.22,to:50,at:t,out:AU.mus})}},
  battle:{bpm:132,len:128,step(s,t,sd){const bar=Math.floor(s/16)%8,st=s%16,roots=[0,0,1,0,0,0,-2,-1];const r=roots[bar];
      if(st%4===0)tone(150,0.16,{type:'sine',vol:0.42,to:45,at:t,out:AU.mus});
      if(st===4||st===12)noise(0.14,{f:1900,ft:'bandpass',vol:0.22,q:0.8,at:t,out:AU.mus});
      if(st%2===1)noise(0.035,{f:8000,ft:'highpass',vol:0.05,at:t,out:AU.mus});
      const bp=[0,0,7,0,0,7,0,3];if(st%2===0)tone(mtof(deg(r,38)+(bp[(st/2)|0]===7?12:0)),sd*1.6,{type:'sawtooth',vol:0.13,lp:520,at:t,out:AU.mus});
      const ph=Math.floor(s/32)%4,mel=[[4,null,3,4,6,null,5,4,3,null,2,1,2,null,null,null],[4,null,3,4,7,null,6,5,4,null,6,5,4,null,null,null],[7,null,8,7,6,null,5,6,4,null,5,4,3,2,1,null],[0,1,2,3,4,null,4,null,5,4,3,null,4,null,null,null]];
      if(s%32<16||ph===3){const n=mel[ph][st];if(n!=null)tone(mtof(deg(r+n,62)),sd*1.7,{type:'square',vol:0.05,lp:2600,at:t,out:AU.mus})}
      else if(st%2===0)tone(mtof(deg(r+[0,2,4,2][(st/2)%4],74)),sd*0.9,{type:'triangle',vol:0.04,at:t,out:AU.mus})}}
};
/* recorded tracks (apps/client/public/music); a track without files, or not yet decoded, falls back to its procedural loop */
const MUSIC_FILES={menu:['music/menu.ogg'],battle:['music/battle-1.ogg','music/battle-2.ogg','music/battle-3.ogg']};const MUSIC_VOL=0.75;
AU.buf={};AU.src=null;AU.pick={};
function musicLoad(url){if(AU.buf[url])return AU.buf[url];
  AU.buf[url]=fetch(url).then(r=>r.arrayBuffer()).then(b=>new Promise((ok,no)=>AU.ctx.decodeAudioData(b,ok,no))).catch(()=>{AU.buf[url]=null;return null});return AU.buf[url]}
function musicStopFile(){if(AU.src){const s=AU.src,g=s.g,t=AU.ctx.currentTime;AU.src=null;g.gain.setTargetAtTime(0,t,0.25);try{s.stop(t+1.5)}catch(e){}}}
function musicPlayFile(name){const list=MUSIC_FILES[name];if(!list)return;const i=AU.pick[name]=((AU.pick[name]??Math.floor(Math.random()*list.length)-1)+1)%list.length;
  musicLoad(list[i]).then(b=>{if(!b||AU.track!==name||AU.src)return;const c=AU.ctx,s=c.createBufferSource(),g=c.createGain();s.buffer=b;s.loop=true;s.g=g;
    g.gain.setValueAtTime(0,c.currentTime);g.gain.linearRampToValueAtTime(MUSIC_VOL,c.currentTime+0.8);s.connect(g);g.connect(AU.mus);s.start();AU.src=s})}
function auSched(){if(!AU.ctx||!AU.track||AU.src||(MUSIC_FILES[AU.track]||[]).some(u=>AU.buf[u]!==null))return;const T=TRACKS[AU.track],sd=60/T.bpm/4;const now=AU.ctx.currentTime;if(AU.next<now)AU.next=now+0.05;
  while(AU.next<now+0.14){try{T.step(AU.step%T.len,AU.next,sd)}catch(e){}AU.next+=sd;AU.step++}}
function musicFor(){if(!AU.ctx)return;const want=($('#match')&&!$('#match').hidden)?'battle':'menu';if(AU.track===want)return;AU.track=want;AU.step=0;AU.next=AU.ctx.currentTime+0.1;musicStopFile();musicPlayFile(want);
  const g=AU.mus.gain,t=AU.ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(0.0001,t);g.linearRampToValueAtTime(AU.musOn?0.3:0,t+0.6)}
function musicDuck(on){if(!AU.ctx)return;const g=AU.mus.gain,t=AU.ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(AU.musOn?(on?0.05:0.3):0,t+0.3)}
function setSound(kind,on){if(kind==='mus')AU.musOn=on;else AU.fxOn=on;try{localStorage.setItem(kind==='mus'?'bb-music':'bb-sfx',on?'1':'0')}catch(e){}
  if(AU.ctx){if(kind==='mus')AU.mus.gain.setTargetAtTime(on?0.3:0,AU.ctx.currentTime,0.1);else AU.fx.gain.setTargetAtTime(on?0.85:0,AU.ctx.currentTime,0.05)}}

