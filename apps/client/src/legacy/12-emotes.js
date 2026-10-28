// Ported from prototype/ball-battle.html (lines 1997-2061). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
const EMOTES=['laugh','thumb','love','wow','angry','cry'];
function heartPath(c,x,y,s){c.beginPath();c.moveTo(x,y+s*0.75);c.bezierCurveTo(x-s*1.1,y,x-s*0.6,y-s*0.9,x,y-s*0.35);c.bezierCurveTo(x+s*0.6,y-s*0.9,x+s*1.1,y,x,y+s*0.75);c.closePath()}
function emoteFace(c,t,x,y,r,time){
  const fx=x,fy=y+r*0.19,ey=fy-r*0.1,ink='#141a2e';c.save();c.lineCap='round';c.lineJoin='round';
  const eye=(cx,s)=>{c.fillStyle='#fff';c.beginPath();c.ellipse(cx,ey,r*0.15*s,r*0.18*s,0,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=r*0.02;c.stroke();c.fillStyle=ink;circ(c,cx,ey+r*0.02,r*0.08*s);c.fill();c.fillStyle='#fff';circ(c,cx-r*0.03,ey-r*0.02,r*0.03*s);c.fill()};
  if(t==='laugh'){c.strokeStyle=ink;c.lineWidth=r*0.08;for(const sd of[-1,1]){c.beginPath();c.arc(fx+sd*r*0.3,ey+r*0.04,r*0.13,Math.PI*1.1,Math.PI*1.9);c.stroke()}
    c.fillStyle=ink;c.beginPath();c.arc(fx,fy+r*0.1,r*0.34,0,Math.PI);c.closePath();c.fill();c.fillStyle='#ef4444';c.beginPath();c.arc(fx,fy+r*0.36,r*0.15,Math.PI,0);c.fill();
    c.fillStyle='#fff';c.fillRect(fx-r*0.24,fy+r*0.1,r*0.48,r*0.07);
    c.fillStyle='#7dd3fc';for(const sd of[-1,1]){const k=(time*2+(sd>0?0.5:0))%1;c.globalAlpha=1-k;c.beginPath();c.ellipse(fx+sd*(r*0.55+k*r*0.4),ey-k*r*0.3+k*k*r*0.6,r*0.08,r*0.12,0,0,TAU);c.fill()}c.globalAlpha=1}
  else if(t==='thumb'){eye(fx-r*0.3,1);c.strokeStyle=ink;c.lineWidth=r*0.08;c.beginPath();c.arc(fx+r*0.3,ey+r*0.04,r*0.12,Math.PI*1.1,Math.PI*1.9);c.stroke();
    c.beginPath();c.arc(fx,fy+r*0.02,r*0.25,0.15*Math.PI,0.85*Math.PI);c.stroke();
    const hx=x+r*1.05,hy=y+r*0.25+Math.sin(time*6)*r*0.05;c.fillStyle='#fde68a';c.strokeStyle='#92400e';c.lineWidth=r*0.05;
    rrect(c,hx-r*0.28,hy-r*0.05,r*0.52,r*0.42,r*0.12);c.fill();c.stroke();rrect(c,hx-r*0.15,hy-r*0.48,r*0.2,r*0.5,r*0.1);c.fill();c.stroke();
    c.fillStyle='#ffd75e';star(c,hx+r*0.35,hy-r*0.55,r*0.12,r*0.04,4)}
  else if(t==='love'){c.save();c.shadowColor='#f43f5e';c.shadowBlur=r*0.2;for(const sd of[-1,1]){const p=1+Math.sin(time*8)*0.12;c.fillStyle='#ef4444';heartPath(c,fx+sd*r*0.3,ey,r*0.17*p);c.fill()}c.restore();
    c.strokeStyle=ink;c.lineWidth=r*0.07;c.beginPath();c.arc(fx,fy+r*0.04,r*0.2,0.15*Math.PI,0.85*Math.PI);c.stroke();
    c.fillStyle='rgba(255,110,150,.45)';for(const sd of[-1,1]){c.beginPath();c.ellipse(fx+sd*r*0.5,fy+r*0.08,r*0.11,r*0.06,0,0,TAU);c.fill()}
    for(let i=0;i<3;i++){const k=(time*0.8+i/3)%1;c.globalAlpha=1-k;c.fillStyle='#fb7185';heartPath(c,x+(i-1)*r*0.7,y-r*1.0-k*r*0.8,r*0.12);c.fill()}c.globalAlpha=1}
  else if(t==='wow'){eye(fx-r*0.3,1.25);eye(fx+r*0.3,1.25);c.strokeStyle=ink;c.lineWidth=r*0.06;for(const sd of[-1,1]){c.beginPath();c.arc(fx+sd*r*0.3,ey-r*0.2,r*0.17,Math.PI*1.25,Math.PI*1.75);c.stroke()}
    c.fillStyle=ink;c.beginPath();c.ellipse(fx,fy+r*0.24,r*0.11,r*0.15,0,0,TAU);c.fill();
    c.fillStyle='#93c5fd';c.beginPath();const sx=x+r*0.72,sy=y-r*0.55+((time*1.5)%1)*r*0.2;c.moveTo(sx,sy-r*0.16);c.quadraticCurveTo(sx+r*0.12,sy+r*0.02,sx,sy+r*0.08);c.quadraticCurveTo(sx-r*0.12,sy+r*0.02,sx,sy-r*0.16);c.fill()}
  else if(t==='angry'){c.save();circ(c,x,y,r);c.clip();c.fillStyle=`rgba(239,68,68,${0.28+Math.sin(time*10)*0.08})`;c.fillRect(x-r,y-r,2*r,2*r);c.restore();
    c.strokeStyle=ink;c.lineWidth=r*0.09;for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.5,ey-r*0.26);c.lineTo(fx+sd*r*0.12,ey-r*0.1);c.stroke();c.fillStyle=ink;circ(c,fx+sd*r*0.3,ey+r*0.04,r*0.07);c.fill()}
    c.fillStyle='#fff';rrect(c,fx-r*0.22,fy+r*0.12,r*0.44,r*0.15,r*0.04);c.fill();c.strokeStyle=ink;c.lineWidth=r*0.04;c.stroke();c.beginPath();c.moveTo(fx-r*0.22,fy+r*0.195);c.lineTo(fx+r*0.22,fy+r*0.195);for(const q of[-0.11,0,0.11]){c.moveTo(fx+q*r,fy+r*0.12);c.lineTo(fx+q*r,fy+r*0.27)}c.stroke();
    c.fillStyle='rgba(255,255,255,.9)';for(const sd of[-1,1])for(let i=0;i<2;i++){const k=(time*1.4+i*0.5+(sd>0?0.25:0))%1;c.globalAlpha=1-k;circ(c,x+sd*r*(0.55+k*0.25),y-r*(0.9+k*0.6),r*(0.1+k*0.12));c.fill()}c.globalAlpha=1}
  else if(t==='cry'){c.strokeStyle=ink;c.lineWidth=r*0.08;for(const sd of[-1,1]){c.beginPath();c.arc(fx+sd*r*0.3,ey-r*0.06,r*0.13,Math.PI*0.1,Math.PI*0.9);c.stroke();c.beginPath();c.moveTo(fx+sd*r*0.48,ey-r*0.3);c.lineTo(fx+sd*r*0.15,ey-r*0.22);c.stroke()}
    c.fillStyle='rgba(56,189,248,.85)';for(const sd of[-1,1]){rrect(c,fx+sd*r*0.3-r*0.07,ey+r*0.06,r*0.14,r*0.6,r*0.07);c.fill();const k=(time*2+(sd>0?0.5:0))%1;circ(c,fx+sd*r*0.3,ey+r*0.7+k*r*0.5,r*0.07*(1-k*0.5));c.fill()}
    c.strokeStyle=ink;c.lineWidth=r*0.07;c.beginPath();c.moveTo(fx-r*0.22,fy+r*0.32);c.quadraticCurveTo(fx-r*0.1,fy+r*0.18,fx,fy+r*0.28);c.quadraticCurveTo(fx+r*0.1,fy+r*0.18,fx+r*0.22,fy+r*0.32);c.stroke()}
  c.restore();
}
function drawEmote(c,t,x,y,s,k,sk,time){
  const r=s*0.4;time=time||0;let dx=0,dy=0,rot=0,sc=1;
  if(t==='laugh'){dy=-Math.abs(Math.sin(time*10))*r*0.14;rot=Math.sin(time*10)*0.07}
  else if(t==='angry')dx=Math.sin(time*45)*r*0.05;
  else if(t==='cry')dy=Math.sin(time*3)*r*0.05;
  else if(t==='love')sc=1+Math.sin(time*6)*0.04;
  else if(t==='wow')sc=1+Math.max(0,Math.sin(time*5))*0.07;
  else if(t==='thumb')rot=Math.sin(time*4)*0.05;
  c.save();c.translate(x+dx,y+dy);c.rotate(rot);c.scale(sc,sc);
  drawBall(c,{x:0,y:0,r,k,t:time,look:Math.PI/2,mood:'static',noFace:true,skin:sk,glow:6});
  emoteFace(c,t,0,0,r,time);
  c.restore();
}
const EICON={};
function emoteIcon(t,k,sk){const key=t+'|'+k+'|'+sk;if(EICON[key]==null){const cv2=document.createElement('canvas');cv2.width=cv2.height=120;drawEmote(cv2.getContext('2d'),t,56,66,84,k,sk,0.35);try{EICON[key]=cv2.toDataURL('image/png')}catch(e){EICON[key]=''}}return EICON[key]}
function emoteChar(side){const f=G.f.length?sideF(side):null;if(f)return [f.cls,f.skin||''];const e=(G.teams[side].find(q=>q.alive)||G.teams[side][0]);if(e)return [e.cls,e.skin||''];
  // Online matchmaking: no roster yet, so my emotes use my lead character.
  const k=S.team[0];return [k,S.skin[k]||'']}
function sendEmote(side,t){if(!G)return;sfx('emote');G.emo=(G.emo||[]).filter(e=>e.side!==side);G.emo.push({side,t,life:2.6})}
function drawEmotes(){
  for(const e of (G.emo||[])){
    const age=2.6-e.life,fade=Math.min(1,e.life/0.3),sc=easeOutBack(Math.min(1,age/0.3));
    const f=G.f.length?sideF(e.side):null;let x,y;
    if(f&&f.hp>0){x=f.x;y=f.y-f.r-52}else{x=e.side?W*0.2:W*0.8;y=72}
    x=clamp(x,42,W-42);y=clamp(y,40,H-46);
    const [k,sk]=emoteChar(e.side);
    ctx.save();ctx.globalAlpha=fade;ctx.translate(x,y);ctx.scale(sc,sc);
    ctx.fillStyle='#fff';ctx.strokeStyle='#071233';ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-8,33);ctx.lineTo(0,46);ctx.lineTo(8,33);ctx.closePath();ctx.fill();ctx.stroke();
    rrect(ctx,-38,-36,76,70,18);ctx.fill();ctx.stroke();ctx.fillRect(-7,29,14,6);
    ctx.save();rrect(ctx,-36,-34,72,66,16);ctx.clip();drawEmote(ctx,e.t,0,6,56,k,sk,age);ctx.restore();
    ctx.restore();
  }
}
const pickOne=a=>a[Math.floor(Math.random()*a.length)];

/* ---------- BALL ART ---------- */
