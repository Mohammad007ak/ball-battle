// Ported from prototype/ball-battle.html (lines 2914-3016). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- CHEST & COIN ART ---------- */
const CHEST_PAL=[
  {m1:'#d08f4d',m2:'#6e3d15',t1:'#c9d2de',t2:'#4b5563',lock:'#d5dde8',gem:null,glow:null,tint:'#7a4a22'},
  {m1:'#f1f5fb',m2:'#8796ae',t1:'#5b7299',t2:'#22304a',lock:'#f3c94a',gem:'#38bdf8',glow:null,tint:'#4b6385'},
  {m1:'#ffdf70',m2:'#c47a0c',t1:'#9a5410',t2:'#4a2705',lock:'#fff1b8',gem:'#ef4444',glow:'#ffc53d',tint:'#b7791f'},
  {m1:'#a97cff',m2:'#4c1d95',t1:'#ffd75e',t2:'#9a6a0c',lock:'#ffd75e',gem:'#f0abfc',glow:'#c084fc',tint:'#6d28d9'},
  {m1:'#5eead4',m2:'#7c3aed',t1:'#fff7d6',t2:'#c08a12',lock:'#fff7d6',gem:'#fef08a',glow:'#f0abfc',tint:'#be185d',rain:true}];
function chestFill(c,P,x0,y0,x1,y1,light){
  if(P.rain){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#22d3ee');g.addColorStop(0.35,'#818cf8');g.addColorStop(0.7,'#c084fc');g.addColorStop(1,'#f472b6');return g}
  const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,light?mix(P.m1,'#ffffff',0.3):P.m1);g.addColorStop(1,P.m2);return g;
}
function sideShade(c,x0,w,a){const g=c.createLinearGradient(x0,0,x0+w,0);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(0.16,'rgba(0,0,0,0)');g.addColorStop(0.84,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${a+0.05})`);return g}
function gemShape(c,x,y,r,col){c.save();c.shadowColor=col;c.shadowBlur=r*1.6;c.fillStyle=col;c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*0.8,y-r*0.2);c.lineTo(x,y+r);c.lineTo(x-r*0.8,y-r*0.2);c.closePath();c.fill();c.shadowBlur=0;
  c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*0.35,y-r*0.35);c.lineTo(x,y-r*0.1);c.lineTo(x-r*0.35,y-r*0.35);c.closePath();c.fill();
  c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=Math.max(0.8,r*0.12);c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*0.8,y-r*0.2);c.lineTo(x,y+r);c.lineTo(x-r*0.8,y-r*0.2);c.closePath();c.stroke();c.restore()}
function drawChest(c,x,y,s,tier,o){
  o=o||{};
  const P=CHEST_PAL[tier],open=o.open||0,w=s,bh=s*0.38,lh=s*0.3,bx=x-w/2,bot=y+s*0.3,top=bot-bh,rad=s*0.05,lw=Math.max(1,s*0.016);
  const cbw=w*0.1,cbx=[bx+w*0.07,bx+w*0.93-cbw];
  c.save();
  c.fillStyle='rgba(0,0,0,.38)';c.beginPath();c.ellipse(x,bot+s*0.015,w*0.54,s*0.065,0,0,TAU);c.fill();
  // body
  c.save();if(P.glow){c.shadowColor=P.glow;c.shadowBlur=s*0.28}
  rrect(c,bx,top,w,bh,rad);c.fillStyle=chestFill(c,P,bx,top,bx+w,bot);c.fill();c.restore();
  c.save();rrect(c,bx,top,w,bh,rad);c.clip();
  c.fillStyle=sideShade(c,bx,w,0.3);c.fillRect(bx,top,w,bh);
  if(tier===0){c.strokeStyle='rgba(55,25,5,.5)';c.lineWidth=s*0.012;for(let i=1;i<4;i++)ln(c,bx,top+bh*i/4,bx+w,top+bh*i/4);
    c.strokeStyle='rgba(255,220,170,.12)';c.lineWidth=s*0.006;for(let i=0;i<9;i++){const yy=top+bh*(0.05+rnd(i+3)*0.9);c.beginPath();c.moveTo(bx+w*rnd(i),yy);c.quadraticCurveTo(bx+w*rnd(i+1),yy+s*0.012,bx+w*rnd(i+2),yy);c.stroke()}}
  if(tier===3){c.fillStyle='rgba(255,215,255,.75)';for(const [px,py] of [[0.3,0.55],[0.7,0.55],[0.5,0.78]]){star(c,bx+w*px,top+bh*py,s*0.03,s*0.01,4)}}
  if(P.rain){c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.moveTo(bx+w*0.2,top);c.lineTo(bx+w*0.38,top);c.lineTo(bx+w*0.18,bot);c.lineTo(bx,bot);c.closePath();c.fill();c.globalCompositeOperation='source-over'}
  c.restore();
  // body trims
  const band=(x0,y0,ww,hh,r)=>{const g=c.createLinearGradient(0,y0,0,y0+hh);g.addColorStop(0,mix(P.t1,'#ffffff',0.25));g.addColorStop(1,P.t1);rrect(c,x0,y0,ww,hh,r);c.fillStyle=g;c.fill();c.strokeStyle=P.t2;c.lineWidth=lw;c.stroke()};
  for(const cx of cbx){band(cx,top,cbw,bh,s*0.015);c.fillStyle=P.t2;for(const f of [0.25,0.55,0.82]){circ(c,cx+cbw/2,top+bh*f,s*0.016);c.fill()}}
  band(bx,bot-s*0.065,w,s*0.065,s*0.025);
  band(bx-s*0.005,top-s*0.005,w+s*0.01,s*0.05,s*0.02);
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=lw;rrect(c,bx,top,w,bh,rad);c.stroke();
  // inside glow when open
  if(open>0){
    c.save();c.fillStyle='#160b04';c.beginPath();c.ellipse(x,top+s*0.01,w*0.46,s*0.05,0,0,TAU);c.fill();
    c.globalCompositeOperation='lighter';
    const g=c.createRadialGradient(x,top,1,x,top,s*0.75);g.addColorStop(0,`rgba(255,248,210,${0.95*open})`);g.addColorStop(0.35,`rgba(255,200,90,${0.45*open})`);g.addColorStop(1,'rgba(255,160,40,0)');
    c.fillStyle=g;c.beginPath();c.arc(x,top,s*0.75,0,TAU);c.fill();c.restore();
  }
  // lid
  c.save();
  const lift=open*s*0.36,sq=1-open*0.5;
  c.translate(x,top-lift);c.rotate(-open*0.08);c.scale(1,sq);
  const lidPath=()=>{c.beginPath();c.moveTo(-w/2,0);c.lineTo(-w/2,-lh*0.42);c.bezierCurveTo(-w/2,-lh*1.2,w/2,-lh*1.2,w/2,-lh*0.42);c.lineTo(w/2,0);c.closePath()};
  c.save();if(P.glow&&!open){c.shadowColor=P.glow;c.shadowBlur=s*0.2}
  lidPath();c.fillStyle=chestFill(c,P,-w/2,-lh,w/2,0,true);c.fill();c.restore();
  c.save();lidPath();c.clip();
  c.fillStyle=sideShade(c,-w/2,w,0.25);c.fillRect(-w/2,-lh*1.2,w,lh*1.2);
  if(tier===0){c.strokeStyle='rgba(55,25,5,.45)';c.lineWidth=s*0.012;for(let i=1;i<3;i++){const yy=-lh*i*0.32;ln(c,-w/2,yy,w/2,yy)}}
  for(const cx of cbx){const lx=cx-x;const g=c.createLinearGradient(0,-lh,0,0);g.addColorStop(0,mix(P.t1,'#ffffff',0.35));g.addColorStop(1,P.t1);c.fillStyle=g;c.fillRect(lx,-lh*1.2,cbw,lh*1.2);c.strokeStyle=P.t2;c.lineWidth=lw;c.strokeRect(lx,-lh*1.2,cbw,lh*1.2);
    c.fillStyle=P.t2;circ(c,lx+cbw/2,-lh*0.35,s*0.016);c.fill()}
  c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-w*0.2,-lh*0.72,w*0.17,lh*0.13,-0.12,0,TAU);c.fill();
  c.restore();
  band(-w/2-s*0.005,-s*0.055,w+s*0.01,s*0.055,s*0.02);
  c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=lw;lidPath();c.stroke();
  if(tier>=3)gemShape(c,0,-lh*0.98,s*0.06,P.gem);
  c.restore();
  // lock plate
  const py=top-s*0.06*(1-open)+open*s*0.02,pw=w*0.2,ph=s*0.17*(1-open*0.35);
  const pg=c.createLinearGradient(0,py,0,py+ph);pg.addColorStop(0,mix(P.lock,'#ffffff',0.35));pg.addColorStop(1,P.lock);
  rrect(c,x-pw/2,py,pw,ph,s*0.03);c.fillStyle=pg;c.fill();c.strokeStyle=P.t2;c.lineWidth=lw;c.stroke();
  if(P.gem&&tier<3)gemShape(c,x,py+ph*0.45,s*0.045,P.gem);
  else if(tier>=3)gemShape(c,x,py+ph*0.45,s*0.05,P.gem);
  else{c.fillStyle='#2b2f36';circ(c,x,py+ph*0.38,s*0.022);c.fill();c.fillRect(x-s*0.01,py+ph*0.4,s*0.02,ph*0.35)}
  if(o.sparkle&&tier>=3){c.fillStyle='#ffffff';for(const [dx,dy,r] of [[-0.55,-0.42,0.05],[0.52,-0.58,0.04],[0.6,0.08,0.035],[-0.6,0.18,0.03]])star(c,x+dx*w,y+dy*s,s*r,s*r*0.28,4)}
  c.restore();
}
const CICON={};
function chestIcon(t){if(CICON[t]==null){const k=document.createElement('canvas');k.width=k.height=160;drawChest(k.getContext('2d'),80,84,124,t,{sparkle:true});try{CICON[t]=k.toDataURL('image/png')}catch(e){CICON[t]=''}}return CICON[t]}
function drawCoin3d(c,x,y,r){
  c.fillStyle='#9a5f06';c.beginPath();c.ellipse(x,y+r*0.22,r,r*0.42,0,0,TAU);c.fill();
  c.fillRect(x-r,y,2*r,r*0.22);
  const g=c.createRadialGradient(x-r*0.3,y-r*0.15,1,x,y,r);g.addColorStop(0,'#fff3c4');g.addColorStop(0.5,'#ffc53d');g.addColorStop(1,'#c58306');
  c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*0.42,0,0,TAU);c.fill();
  c.strokeStyle='rgba(255,240,190,.8)';c.lineWidth=Math.max(1,r*0.08);c.beginPath();c.ellipse(x,y,r*0.7,r*0.28,0,0,TAU);c.stroke();
}
function drawGem3d(c,x,y,r){
  const pts=[[-0.6,-0.45],[0.6,-0.45],[1,0],[0,1],[-1,0]];
  c.save();c.translate(x,y);
  c.beginPath();pts.forEach(([a,b],i)=>i?c.lineTo(a*r,b*r):c.moveTo(a*r,b*r));c.closePath();
  const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#a7f3d0');g.addColorStop(0.5,'#34d399');g.addColorStop(1,'#047857');c.fillStyle=g;c.fill();
  c.strokeStyle='#064e3b';c.lineWidth=Math.max(1,r*0.09);c.stroke();
  c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.moveTo(-0.6*r,-0.45*r);c.lineTo(-0.15*r,-0.45*r);c.lineTo(-0.45*r,0);c.lineTo(-r,0);c.closePath();c.fill();
  c.strokeStyle='rgba(6,78,59,.5)';c.lineWidth=Math.max(0.6,r*0.04);c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.moveTo(-0.6*r,-0.45*r);c.lineTo(-0.3*r,0);c.lineTo(0,r);c.lineTo(0.3*r,0);c.lineTo(0.6*r,-0.45*r);c.stroke();
  c.restore();
}
let GEMI=null;
function gemIcon(){if(GEMI==null){const k=document.createElement('canvas');k.width=k.height=120;const c=k.getContext('2d');c.save();c.shadowColor='#34d399';c.shadowBlur=16;drawGem3d(c,60,56,40);c.restore();try{GEMI=k.toDataURL('image/png')}catch(e){GEMI=''}}return GEMI}
let COINI=null;
function coinIcon(){
  if(COINI==null){const k=document.createElement('canvas');k.width=k.height=120;const c=k.getContext('2d');
    c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(60,106,34,7,0,0,TAU);c.fill();
    c.save();c.shadowColor='#ffc53d';c.shadowBlur=18;const g=c.createRadialGradient(48,44,4,60,60,44);g.addColorStop(0,'#fff3c4');g.addColorStop(0.45,'#ffc53d');g.addColorStop(1,'#b8730c');c.fillStyle=g;circ(c,60,60,42);c.fill();c.restore();
    c.strokeStyle='#9a5f06';c.lineWidth=3;circ(c,60,60,42);c.stroke();c.strokeStyle='rgba(255,240,190,.8)';c.lineWidth=2.5;circ(c,60,60,32);c.stroke();
    c.fillStyle='#b8730c';star(c,60,61,18,7.5,5);c.fillStyle='#fff3c4';star(c,59,59,15,6,5);
    try{COINI=k.toDataURL('image/png')}catch(e){COINI=''}}
  return COINI;
}
