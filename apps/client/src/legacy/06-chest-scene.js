// Ported from prototype/ball-battle.html (lines 1179-1350). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- CHEST OPENING SCENE ---------- */
const RAR_FRAME={common:['#e2e8f0','#7a8aa0'],rare:['#ffc27a','#d9660b'],epic:['#efc2ff','#9333ea'],legendary:['#a5f3fc','#db2777']};
let CA=null;
const easeOutBack=p=>1+2.7*Math.pow(p-1,3)+1.7*Math.pow(p-1,2);
const easeOutBounce=p=>{const n=7.5625,d=2.75;if(p<1/d)return n*p*p;if(p<2/d)return n*(p-=1.5/d)*p+0.75;if(p<2.5/d)return n*(p-=2.25/d)*p+0.9375;return n*(p-=2.625/d)*p+0.984375};
function setHint(t){const h=$('#chHint');h.textContent=t;h.hidden=!t}
function showChest(tier,items){
  CK.T.track('chest_open',{tier});
  CH={tier,items};
  const m=$('#cmodal');m.hidden=false;$('#cbox').hidden=true;$('#chCv').hidden=false;$('#chSkip').hidden=false;
  const before={};items.forEach(it=>{if(it.type==='card'&&!it.isNew)before[it.k]=S.cards[it.k]-it.n});
  const cvs=$('#chCv'),d=window.devicePixelRatio||1,Wd=m.clientWidth||window.innerWidth,Hd=m.clientHeight||window.innerHeight;
  cvs.width=Math.round(Wd*d);cvs.height=Math.round(Hd*d);
  if(CA)cancelAnimationFrame(CA.raf);
  CA={tier,items,before,W:Wd,H:Hd,d,c:cvs.getContext('2d'),state:'drop',t:0,open:0,idx:-1,it:0,flash:0,parts:[],rays:0,move:0,prevCard:null,last:performance.now(),raf:0};
  setHint('');
  CA.raf=requestAnimationFrame(chLoop);
}
function chSpark(x,y,n,cols,spd){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=(spd||1)*(120+Math.random()*380);CA.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-160,life:0.6+Math.random()*0.7,max:1.3,c:cols[i%cols.length],r:2+Math.random()*3.5,star:Math.random()<0.4})}}
function chNext(){
  const A=CA;A.prevCard=A.idx>=0?{idx:A.idx,t:0}:null;A.idx++;
  if(A.idx>=A.items.length){chSummary();return}
  A.state='item';A.it=0;
  const it=A.items[A.idx],cx=A.W/2;
  sfx(it.isNew||it.type==='skin'||(it.type==='card'&&['epic','legendary'].includes(CLASSES[it.k].rar))?'revealBig':it.type==='coins'||it.type==='gems'?'coin':'reveal');
  if(it.isNew||it.type==='skin'){A.flash=0.7;chSpark(cx,A.H*0.32,60,['#ffd75e','#ffffff','#5eead4','#f0abfc'],1.3)}
  else if(it.type==='card'&&['epic','legendary'].includes(CLASSES[it.k].rar)){A.flash=0.4;chSpark(cx,A.H*0.32,36,[RAR_FRAME[CLASSES[it.k].rar][0],'#ffffff'],1.1)}
  setHint(A.idx<A.items.length-1?'بزن برای جایزهٔ بعدی':'بزن برای دیدن همهٔ جوایز');
}
function chTap(){
  const A=CA;if(!A)return;
  if(A.state==='drop'){A.t=10;return}
  if(A.state==='idle'){A.state='shake';A.t=0;setHint('');sfx('chestShake');setTimeout(()=>sfx('chestShake'),200);setTimeout(()=>sfx('chestShake'),400);return}
  if(A.state==='item'){if(A.it<1.1)A.it=1.1;else chNext()}
}
function chSummary(){
  const A=CA;if(A){cancelAnimationFrame(A.raf);CA=null}
  $('#chCv').hidden=true;$('#chSkip').hidden=true;setHint('');
  const {tier,items}=CH,T=CHESTS[tier],box=$('#cbox');
  box.innerHTML=`<img class="sumchest" src="${chestIcon(tier)}" alt=""><h2>جوایز صندوقچهٔ ${T.name}</h2><div class="summary">${items.map(it=>itemHTML(it,false)).join('')}</div><button class="fight" id="chestDone">عالی</button>`;
  box.hidden=false;
}
function itemHTML(it){
  if(it.type==='coins')return `<div class="sm coin"><img src="${coinIcon()}" alt=""><b>+${fa(it.n)}</b><span>سکه</span></div>`;
  if(it.type==='gems')return `<div class="sm gemc"><img src="${gemIcon()}" alt=""><b>+${fa(it.n)}</b><span>الماس</span></div>`;
  if(it.type==='skin')return `<div class="sm" style="--rc:#f0abfc"><i class="nw">اسکین</i><img src="${icon(it.k,it.st)}" alt=""><b>${SKIN_STYLES[it.st].name}</b><span>${CLASSES[it.k].name}</span></div>`;
  const C=CLASSES[it.k],R=RAR[C.rar];
  return `<div class="sm" style="--rc:${R.col}">${it.isNew?'<i class="nw">جدید</i>':''}<img src="${icon(it.k)}" alt=""><b>${it.isNew?'باز شد':'×'+fa(it.n)}</b><span>${C.name}</span></div>`;
}
$('#cmodal').addEventListener('click',e=>{
  if(!CH)return;
  if(e.target.closest('#chestDone')){$('#cmodal').hidden=true;CH=null;tab==='battle'?renderBattle():renderCards();return}
  if(e.target.closest('#chSkip')){chSummary();return}
  if(CA)chTap();
});
function chLoop(ts){
  const A=CA;if(!A)return;
  const dt=Math.min(0.05,(ts-A.last)/1000);A.last=ts;A.t+=dt;
  if(A.state==='drop'&&A.t>0.85){A.state='idle';A.t=0;setHint('بزن تا باز شود');sfx('chestDrop')}
  else if(A.state==='shake'&&A.t>0.6){A.state='burst';A.t=0;A.flash=1;sfx('chestOpen');chSpark(A.W/2,A.H*0.62,70,['#fff3c4','#ffd75e','#ffffff',CHEST_PAL[A.tier].glow||'#ffb347'],1.2)}
  else if(A.state==='burst'){A.open=Math.min(1,A.t/0.25);if(A.t>0.55)chNext()}
  if(A.state==='item'){A.it+=dt;if(A.prevCard)A.prevCard.t+=dt}
  if(A.open>0)A.move=Math.min(1,A.move+dt*2.2);
  A.flash=Math.max(0,A.flash-dt*2);A.rays+=dt*(A.open>0?0.35:0.12);
  for(const p of A.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt;p.vx*=0.985;p.life-=dt}
  A.parts=A.parts.filter(p=>p.life>0);
  if(A.open>0&&Math.random()<dt*14)A.parts.push({x:A.W/2+(Math.random()-0.5)*80,y:chestY(A)-40,vx:(Math.random()-0.5)*60,vy:-120-Math.random()*160,life:1.2,max:1.2,c:'#fff3c4',r:1.5+Math.random()*2,star:true,float:true});
  chRender(dt);
  A.raf=requestAnimationFrame(chLoop);
}
function chestSize(A){return Math.min(A.W*0.62,A.H*0.32,280)}
function chestY(A){const idle=A.H*0.56,low=A.H*0.8;return idle+(low-idle)*(1-Math.pow(1-A.move,3))}
function chRender(){
  const A=CA,c=A.c,Wd=A.W,Hd=A.H,P=CHEST_PAL[A.tier],cx=Wd/2,s=chestSize(A);
  c.setTransform(A.d,0,0,A.d,0,0);
  const bgG=c.createRadialGradient(cx,Hd*0.45,10,cx,Hd*0.45,Math.max(Wd,Hd)*0.8);
  bgG.addColorStop(0,mix(P.tint,'#1e2a5c',0.45));bgG.addColorStop(0.55,'#0c1230');bgG.addColorStop(1,'#04060f');
  c.fillStyle=bgG;c.fillRect(0,0,Wd,Hd);
  let cy=chestY(A),rot=0,sx=1,sy=1;
  if(A.state==='drop'){const p=Math.min(1,A.t/0.85);cy=cy-(1-easeOutBounce(p))*Hd*0.75;if(p>0.3&&p<0.5){const q=(p-0.3)/0.2;sy=1-Math.sin(q*Math.PI)*0.12;sx=1+Math.sin(q*Math.PI)*0.1}}
  else if(A.state==='idle'){cy+=Math.sin(A.t*3)*4}
  else if(A.state==='shake'){const k=A.t/0.6;rot=Math.sin(A.t*55)*0.11*k;sx=1+k*0.08;sy=1-k*0.05}
  else if(A.state==='burst'&&A.t<0.2){const q=A.t/0.2;sy=1+Math.sin(q*Math.PI)*0.12;sx=1-Math.sin(q*Math.PI)*0.06}
  // god rays
  const rayA=A.open>0?0.26:A.state==='idle'||A.state==='shake'?0.1:0;
  if(rayA){const ry=A.open>0?cy-s*0.1:cy;c.save();c.translate(cx,ry);c.rotate(A.rays);c.globalCompositeOperation='lighter';
    for(let i=0;i<16;i++){const a=i/16*TAU,g=c.createRadialGradient(0,0,0,0,0,Math.max(Wd,Hd));g.addColorStop(0,`rgba(255,236,170,${rayA})`);g.addColorStop(1,'rgba(255,236,170,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.arc(0,0,Math.max(Wd,Hd),a,a+TAU/32);c.closePath();c.fill()}
    c.restore()}
  // beam from open chest
  if(A.open>0){c.save();c.globalCompositeOperation='lighter';const top=cy+s*0.3-s*0.38,g=c.createLinearGradient(0,top,0,top-Hd*0.6);
    g.addColorStop(0,`rgba(255,245,200,${0.32*A.open})`);g.addColorStop(1,'rgba(255,220,140,0)');c.fillStyle=g;
    c.beginPath();c.moveTo(cx-s*0.42,top);c.lineTo(cx+s*0.42,top);c.lineTo(cx+s*0.8,top-Hd*0.6);c.lineTo(cx-s*0.8,top-Hd*0.6);c.closePath();c.fill();c.restore()}
  // chest
  c.save();c.translate(cx,cy);c.rotate(rot);c.scale(sx,sy);drawChest(c,0,0,s,A.tier,{open:A.open,sparkle:A.open===0});c.restore();
  // remaining badge
  const left=A.idx<0?A.items.length:A.items.length-A.idx-1;
  if(left>0&&A.state!=='drop'){const bx=cx+s*0.44,by=A.open>0?cy-s*0.02:cy-s*0.42;c.save();c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=8;c.fillStyle='#ef4444';circ(c,bx,by,17);c.fill();c.restore();
    c.strokeStyle='#ffffff';c.lineWidth=2.5;circ(c,bx,by,17);c.stroke();
    c.fillStyle='#fff';c.font='800 17px Vazirmatn, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(fa(left),bx,by+1)}
  // previous card flying away
  if(A.prevCard&&A.prevCard.t<0.35){const p=A.prevCard.t/0.35,it=A.items[A.prevCard.idx];c.save();c.globalAlpha=1-p;c.translate(cx+p*Wd*0.6,Hd*0.3-p*60);c.rotate(p*0.6);c.scale(1-p*0.4,1-p*0.4);drawReward(c,it,0,0,false);c.restore()}
  // current reward
  if(A.state==='item'){
    const it=A.items[A.idx],p=Math.min(1,A.it/0.45),e=easeOutBack(p),sy0=cy-s*0.2,ty=Hd*0.26;
    const x=cx,y=sy0+(ty-sy0)*e-Math.sin(p*Math.PI)*40,sc=0.15+0.85*e;
    c.save();c.translate(x,y);c.scale(sc,sc);c.rotate((1-p)*-0.5);drawReward(c,it,0,0,true);c.restore();
    if(p>=1)drawRewardText(c,it,cx,ty);
  }
  // particles
  c.save();c.globalCompositeOperation='lighter';
  for(const p of A.parts){c.globalAlpha=Math.max(0,Math.min(1,p.life/p.max*1.6));c.fillStyle=p.c;if(p.star)star(c,p.x,p.y,p.r*1.8,p.r*0.5,4);else{circ(c,p.x,p.y,p.r);c.fill()}}
  c.restore();
  if(A.flash>0){c.fillStyle=`rgba(255,250,235,${A.flash*0.85})`;c.fillRect(0,0,Wd,Hd)}
}
function cardSize(){return Math.min(CA.W*0.42,CA.H*0.24,190)}
function drawReward(c,it,x,y,live){
  const w=cardSize(),h=w*1.24,A=CA;
  if(it.type==='coins'){
    c.save();c.shadowColor='#ffc53d';c.shadowBlur=30;
    const pile=[[0,0.18],[-0.28,0.24],[0.28,0.24],[-0.14,0.02],[0.14,0.02],[0,-0.16],[-0.3,-0.02],[0.3,-0.02]];
    for(const [dx,dy] of pile.slice().sort((a,b)=>a[1]-b[1]))drawCoin3d(c,x+dx*w,y+dy*w,w*0.2);
    c.restore();return;
  }
  if(it.type==='gems'){c.save();c.shadowColor='#34d399';c.shadowBlur=30;for(const [dx,dy,s0] of [[-0.25,0.12,0.2],[0.25,0.12,0.2],[0,-0.08,0.26],[-0.12,0.24,0.16],[0.14,0.25,0.15]])drawGem3d(c,x+dx*w,y+dy*w,w*s0);c.restore();return}
  const C=CLASSES[it.k],fr=RAR_FRAME[C.rar],r=w*0.1,bw=w*0.055;
  c.save();
  if(live){c.shadowColor=it.type==='skin'?'#f0abfc':fr[0];c.shadowBlur=(it.isNew||it.type==='skin')?40+Math.sin(A.t*6)*12:24}
  let g;
  if(C.rar==='legendary'){g=c.createLinearGradient(x-w/2,y-h/2,x+w/2,y+h/2);g.addColorStop(0,'#5eead4');g.addColorStop(0.35,'#818cf8');g.addColorStop(0.7,'#f472b6');g.addColorStop(1,'#fde68a')}
  else{g=c.createLinearGradient(0,y-h/2,0,y+h/2);g.addColorStop(0,fr[0]);g.addColorStop(1,fr[1])}
  rrect(c,x-w/2,y-h/2,w,h,r);c.fillStyle=g;c.fill();c.restore();
  const ig=c.createLinearGradient(0,y-h/2,0,y+h/2);ig.addColorStop(0,mix(C.c1,'#101634',0.55));ig.addColorStop(1,'#0b1024');
  rrect(c,x-w/2+bw,y-h/2+bw,w-2*bw,h-2*bw,r*0.7);c.fillStyle=ig;c.fill();
  c.save();rrect(c,x-w/2+bw,y-h/2+bw,w-2*bw,h-2*bw,r*0.7);c.clip();
  c.fillStyle='rgba(255,255,255,.07)';c.beginPath();c.moveTo(x-w/2,y-h*0.1);c.lineTo(x+w/2,y-h*0.45);c.lineTo(x+w/2,y-h*0.3);c.lineTo(x-w/2,y+h*0.05);c.closePath();c.fill();
  c.restore();
  drawBall(c,{x,y:y-h*0.06,r:w*0.3,k:it.k,t:A?A.t:0,look:0.6,mood:'static',glow:16,skin:it.type==='skin'?it.st:(S.skin[it.k]||'')});
  const lv=S.lv[it.k];
  c.fillStyle='rgba(5,8,20,.7)';rrect(c,x-w*0.3,y+h/2-bw-h*0.15,w*0.6,h*0.12,h*0.05);c.fill();
  c.fillStyle='#fff';c.font=`800 ${Math.round(w*0.085)}px Vazirmatn, sans-serif`;c.textAlign='center';c.textBaseline='middle';
  c.fillText('سطح '+fa(lv),x,y+h/2-bw-h*0.09);
  if((it.isNew||it.type==='skin')&&live){c.save();c.translate(x,y-h/2);c.rotate(-0.12);c.fillStyle=it.type==='skin'?'#f0abfc':'#ffc53d';rrect(c,-w*0.32,-h*0.07,w*0.64,h*0.13,6);c.fill();
    c.fillStyle='#3a2700';c.font=`${Math.round(w*0.12)}px Lalezar, Vazirmatn, sans-serif`;c.fillText(it.type==='skin'?'اسکین!':'جدید!',0,0);c.restore()}
}
function drawRewardText(c,it,cx,ty){
  const A=CA,w=cardSize(),h=(it.type==='coins'||it.type==='gems')?w*0.7:w*1.24,q=Math.min(1,(A.it-0.45)/0.55),base=ty+h/2+16;
  c.textAlign='center';c.textBaseline='top';
  const name=it.type==='coins'?'سکه':it.type==='gems'?'الماس':CLASSES[it.k].name;
  c.globalAlpha=Math.min(1,q*2);
  c.font='30px Lalezar, Vazirmatn, sans-serif';c.lineWidth=5;c.strokeStyle='rgba(0,0,0,.55)';c.strokeText(name,cx,base);c.fillStyle='#fff';c.fillText(name,cx,base);
  let line2=base+40;
  if(it.type==='card'){const R=RAR[CLASSES[it.k].rar];c.font='800 14px Vazirmatn, sans-serif';c.lineWidth=4;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(R.name,cx,line2);c.fillStyle=R.col;c.fillText(R.name,cx,line2);line2+=24}
  if(it.type==='skin'){const sn='اسکین '+SKIN_STYLES[it.st].name;c.font='30px Lalezar, Vazirmatn, sans-serif';c.lineWidth=5;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(sn,cx,line2);c.fillStyle='#f0abfc';c.fillText(sn,cx,line2);c.globalAlpha=1;return}
  const n=it.isNew?null:Math.round(it.n*Math.min(1,q*1.4));
  if(n!=null){c.font='46px Lalezar, Vazirmatn, sans-serif';const txt=(it.type==='card'?'×':'+')+fa(n);
    c.lineWidth=6;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(txt,cx,line2);c.fillStyle=it.type==='coins'?'#ffd75e':it.type==='gems'?'#6ee7b7':'#ffffff';c.fillText(txt,cx,line2);line2+=58}
  else{c.font='26px Lalezar, Vazirmatn, sans-serif';c.lineWidth=5;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText('به مجموعه‌ات اضافه شد',cx,line2);c.fillStyle='#ffd75e';c.fillText('به مجموعه‌ات اضافه شد',cx,line2);line2+=40}
  if(it.type==='card'&&!it.isNew){
    const l=S.lv[it.k],need=needFor(it.k),bw=Math.min(240,A.W*0.6),bh=20,x0=cx-bw/2;
    if(l<MAXLVL&&need){
      const from=Math.max(0,A.before[it.k]||0),to=S.cards[it.k],cur=from+(to-from)*Math.min(1,q*1.2),ok=cur>=need;
      rrect(c,x0,line2,bw,bh,bh/2);c.fillStyle='rgba(5,8,20,.8)';c.fill();c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=1;c.stroke();
      const fw=Math.max(bh,bw*Math.min(1,cur/need));
      c.save();rrect(c,x0,line2,bw,bh,bh/2);c.clip();rrect(c,cx+bw/2-fw,line2,fw,bh,bh/2);c.fillStyle=ok?'#4ade80':'#3b82f6';c.fill();c.restore();
      c.font='800 13px Vazirmatn, sans-serif';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(`${fa(Math.round(cur))} / ${fa(need)}`,cx,line2+bh/2+1);
      if(ok&&q>=1){c.textBaseline='top';c.font='800 14px Vazirmatn, sans-serif';c.lineWidth=4;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText('آمادهٔ ارتقا!',cx,line2+bh+8);c.fillStyle='#4ade80';c.fillText('آمادهٔ ارتقا!',cx,line2+bh+8)}
    }
  }
  c.globalAlpha=1;
}
setInterval(()=>{if(CH)return;if(!$('#battle').hidden)renderSlots();else updateBadge();if(!$('#cards').hidden&&seg==='shop'){const d=$('#dailyT');if(d)d.innerHTML=ICO.clock+fmtHMS(msToMidnight())}},1000);

