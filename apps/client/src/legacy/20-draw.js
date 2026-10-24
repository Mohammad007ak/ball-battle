// Ported from prototype/ball-battle.html (lines 3335-3502). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
function draw(){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  const sh=reduceMotion?0:G.shake,sx=(Math.random()-0.5)*sh,sy=(Math.random()-0.5)*sh;
  if(bg)ctx.drawImage(bg,sx*scale,sy*scale);
  ctx.setTransform(scale,0,0,scale,(M+sx)*scale,(M+sy)*scale);if(G.fin)finCam();
  const t=G.clock,B0=bounds(),AC=ARENAS[G.li].accent;

  if(G.ins>0){
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.rect(B0.x0,B0.y0,B0.x1-B0.x0,B0.y1-B0.y0);ctx.clip('evenodd');
    ctx.fillStyle='rgba(120,10,30,.55)';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,90,110,.25)';ctx.lineWidth=6;
    for(let i=-H;i<W;i+=18){ctx.beginPath();ctx.moveTo(i+(t*30)%18,0);ctx.lineTo(i+H+(t*30)%18,H);ctx.stroke()}
    ctx.restore();
  }
  const danger=G.ins>0;
  ctx.save();ctx.shadowColor=danger?'#ff4d6d':AC;ctx.shadowBlur=14;
  ctx.strokeStyle=danger?`rgba(255,90,110,${0.7+Math.sin(t*10)*0.3})`:AC;ctx.globalAlpha=danger?1:0.55;ctx.lineWidth=3;
  ctx.strokeRect(B0.x0+1.5,B0.y0+1.5,B0.x1-B0.x0-3,B0.y1-B0.y0-3);ctx.restore();
  if(G.map&&!G.fin)drawMap(t,B0);

  for(const p of G.pups){
    const P=PUPS[p.type],k=Math.min(1,p.t*5),bob=Math.sin(p.t*4)*2,x=p.x,y=p.y+bob;
    ctx.save();ctx.translate(x,y);ctx.scale(k,k);
    const g=ctx.createRadialGradient(0,0,2,0,0,26);g.addColorStop(0,P.color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=0.35+Math.sin(p.t*6)*0.1;ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();ctx.globalAlpha=1;
    ctx.rotate(p.t*1.6);ctx.strokeStyle=P.color;ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(0,0,18,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.rotate(-p.t*1.6);ctx.fillStyle=P.color;ctx.beginPath();ctx.arc(0,0,12,0,TAU);ctx.fill();
    drawPupIcon(p.type,0,0,12);ctx.restore();
  }
  for(const z of G.zones)drawZone(z,t);
  for(const d of (G.drops||[])){const q=1-d.t/d.t0,fy=d.y-(1-q)*160;ctx.save();ctx.strokeStyle=`rgba(245,208,254,${0.3+q*0.6})`;ctx.lineWidth=2;ctx.setLineDash([4,4]);circ(ctx,d.x,d.y,d.R*(1.2-q*0.5));ctx.stroke();ctx.setLineDash([]);
    ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(d.x,fy-40,d.x,fy);g.addColorStop(0,'rgba(245,208,254,0)');g.addColorStop(1,'rgba(253,230,138,.8)');ctx.strokeStyle=g;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(d.x+12,fy-40);ctx.lineTo(d.x,fy);ctx.stroke();ctx.globalCompositeOperation='source-over';
    ctx.translate(d.x,fy);ctx.rotate(t*6);ctx.shadowColor='#fde68a';ctx.shadowBlur=14;ctx.fillStyle='#fef9c3';star(ctx,0,0,9,4,5);ctx.restore()}
  for(const mn of G.mines){
    if(mn.kind==='flower'){const s0=Math.min(1,mn.t*5),armed=mn.arm<=0,pulse=armed?1+Math.sin(mn.t*8)*0.12:0.7;ctx.save();ctx.translate(mn.x,mn.y);ctx.scale(s0*pulse,s0*pulse);
      ctx.fillStyle='#16a34a';for(const sd of[-1,1]){ctx.beginPath();ctx.ellipse(sd*7,6,6,2.6,sd*0.5,0,TAU);ctx.fill()}
      if(armed){ctx.shadowColor='#f472b6';ctx.shadowBlur=10}for(let j=0;j<5;j++){const q=j/5*TAU+mn.t;ctx.fillStyle=j%2?'#f9a8d4':'#f472b6';ctx.beginPath();ctx.ellipse(Math.cos(q)*5,Math.sin(q)*5,5,3.2,q,0,TAU);ctx.fill()}
      ctx.shadowBlur=0;ctx.fillStyle='#fde047';circ(ctx,0,0,3.2);ctx.fill();ctx.restore();continue}
    const armed=mn.arm<=0,s0=Math.min(1,mn.t*6);
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(mn.x+2,mn.y+3,8*s0,0,TAU);ctx.fill();
    ctx.fillStyle='#2a3348';ctx.beginPath();ctx.arc(mn.x,mn.y,8*s0,0,TAU);ctx.fill();
    ctx.strokeStyle='#7c8aa0';ctx.lineWidth=1.5;ctx.stroke();
    for(let i=0;i<4;i++){const a=i/4*TAU+Math.PI/4;ctx.fillStyle='#7c8aa0';ctx.fillRect(mn.x+Math.cos(a)*9-1.5,mn.y+Math.sin(a)*9-1.5,3,3)}
    const blink=armed&&Math.sin(mn.t*12)>0;
    ctx.save();if(blink){ctx.shadowColor='#ff3b3b';ctx.shadowBlur=10}
    ctx.fillStyle=armed?(blink?'#ff4d4d':'#7a1f1f'):'#ffd166';ctx.beginPath();ctx.arc(mn.x,mn.y,3,0,TAU);ctx.fill();ctx.restore();
  }
  for(const f of G.f)if(f.aura&&f.aura.t>0)drawAura(f,t);
  if(!G.fin)for(const f of G.f){
    if(f.out)continue;const C=CLASSES[f.cls],n=f.trail.length,boost=f.boostT>0||((f.cls==='rage'||f.cls==='dragon')&&f.buffT>0);
    for(let i=0;i<n-1;i++){const q=f.trail[i],k=i/n;ctx.globalAlpha=(boost?0.35:0.14)*k*(f.cls==='ghost'?0.5:1);ctx.fillStyle=C.c1;ctx.beginPath();ctx.arc(q.x,q.y,f.r*(0.35+0.6*k),0,TAU);ctx.fill()}
    ctx.globalAlpha=1;
  }
  for(const b of G.beams){
    const a=b.life/0.45,col=b.col||'208,107,255';
    ctx.save();ctx.shadowColor=`rgb(${col})`;ctx.shadowBlur=16;ctx.strokeStyle=`rgba(${col},${a})`;ctx.lineWidth=7*a+1;
    ctx.beginPath();ctx.moveTo(b.a.x,b.a.y);
    const mx=(b.a.x+b.b.x)/2+(Math.random()-0.5)*20,my=(b.a.y+b.b.y)/2+(Math.random()-0.5)*20;
    ctx.quadraticCurveTo(mx,my,b.b.x,b.b.y);ctx.stroke();ctx.restore();
  }
  for(const b of G.bolts){
    const k=b.life/0.25,dx=b.b.x-b.ax,dy=b.b.y-b.ay,n=7,L=Math.hypot(dx,dy)||1;
    ctx.save();ctx.shadowColor='#818cf8';ctx.shadowBlur=18;ctx.lineCap='round';ctx.lineJoin='round';
    for(const [w,c] of [[6,`rgba(129,140,248,${k})`],[2.2,`rgba(255,255,255,${k})`]]){
      ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(b.ax,b.ay);
      for(let i=1;i<n;i++){const q=i/n,j=Math.sin((b.seed*97+i)*12.9898+G.clock*40)*14;ctx.lineTo(b.ax+dx*q-dy/L*j,b.ay+dy*q+dx/L*j)}
      ctx.lineTo(b.b.x,b.b.y);ctx.stroke();
    }
    ctx.restore();
  }
  for(const a of G.arrows)drawProjectile(a);

  if(G.fin)drawFin();
  if(!G.fin)for(const f of G.f){
    if(f.out)continue;const C=CLASSES[f.cls],dead=f.hp<=0&&G.phase==='end';
    ctx.globalAlpha=(dead?0.3:1)*(f.cls==='ghost'?(f.invisT>0?0.18:0.68):1);
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(f.x+4,f.y+7,f.r*0.95,f.r*0.85,0,0,TAU);ctx.fill();
    if((f.cls==='rage'||f.cls==='dragon')&&f.buffT>0){const g=ctx.createRadialGradient(f.x,f.y,f.r*0.6,f.x,f.y,f.r+16);g.addColorStop(0,f.cls==='rage'?'rgba(255,120,60,.5)':'rgba(255,60,80,.5)');g.addColorStop(1,'rgba(255,60,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.r+16+Math.sin(t*25)*3,0,TAU);ctx.fill()}
    if(f.thirstT>0){ctx.save();ctx.shadowColor='#e11d48';ctx.shadowBlur=18;ctx.strokeStyle=`rgba(225,29,72,${0.6+Math.sin(t*12)*0.3})`;ctx.lineWidth=3;circ(ctx,f.x,f.y,f.r+5);ctx.stroke();ctx.restore()}
    if(f.powT>0){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(t*3);ctx.strokeStyle='#ffc53d';ctx.lineWidth=2.5;ctx.setLineDash([8,6]);ctx.shadowColor='#ffc53d';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(0,0,f.r+9,0,TAU);ctx.stroke();ctx.restore()}
    if(f.invulnT>0){ctx.save();ctx.shadowColor='#dfe6ff';ctx.shadowBlur=18;ctx.strokeStyle='rgba(223,230,255,.95)';ctx.lineWidth=3;
      ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+t;const px=f.x+Math.cos(a)*(f.r+8),py=f.y+Math.sin(a)*(f.r+8);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.stroke();
      ctx.fillStyle='rgba(223,230,255,.12)';ctx.fill();ctx.restore()}
    if(f.spikyT>0){ctx.fillStyle='#f3e3c8';for(let i=0;i<14;i++){const q=i/14*TAU+t;ctx.beginPath();ctx.moveTo(f.x+Math.cos(q-0.13)*(f.r+1),f.y+Math.sin(q-0.13)*(f.r+1));ctx.lineTo(f.x+Math.cos(q)*(f.r+15),f.y+Math.sin(q)*(f.r+15));ctx.lineTo(f.x+Math.cos(q+0.13)*(f.r+1),f.y+Math.sin(q+0.13)*(f.r+1));ctx.closePath();ctx.fill()}}
    if(f.isPlayer){ctx.save();ctx.strokeStyle='#ffc53d';ctx.lineWidth=3;ctx.shadowColor='#ffc53d';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(f.x,f.y,f.r+4,0,TAU);ctx.stroke();ctx.restore()}
    const e=other(f),mood=f.hp<=0?'dead':f.flash>0?'hurt':((f.cls==='rage'&&f.buffT>0)||f.boostT>0||f.powT>0||f.thirstT>0)?'angry':'idle';
    drawBall(ctx,{x:f.x,y:f.y,r:f.r,k:f.cls,t,roll:f.roll,skin:f.skin,look:Math.atan2(e.y-f.y,e.x-f.x),mood,glow:f.boostT>0?28:14});
    if(f.flash>0){ctx.fillStyle='rgba(255,255,255,.45)';ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,TAU);ctx.fill()}
    if(G.mode==='2v2'&&f.hp>0){const bw=f.r*1.6,by=f.y-f.r-11,col=f.team===0?(f.isPlayer?'#ffc53d':'#60a5fa'):'#f87171';ctx.save();ctx.fillStyle='rgba(5,10,30,.75)';rrect(ctx,f.x-bw/2-1.5,by-1.5,bw+3,7,3.5);ctx.fill();ctx.fillStyle=col;rrect(ctx,f.x-bw/2,by,Math.max(2,bw*f.hp/f.maxHp),4,2);ctx.fill();
      if(!f.isPlayer){ctx.strokeStyle=col;ctx.globalAlpha*=0.85;ctx.lineWidth=2.5;ctx.setLineDash(f.team?[]:[5,4]);circ(ctx,f.x,f.y,f.r+4);ctx.stroke()}ctx.restore()}
    if(f.stoneT>0){ctx.fillStyle='rgba(120,113,108,.55)';circ(ctx,f.x,f.y,f.r+1);ctx.fill();ctx.strokeStyle='rgba(41,37,36,.85)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(f.x-f.r*0.6,f.y-f.r*0.3);ctx.lineTo(f.x-f.r*0.1,f.y);ctx.lineTo(f.x-f.r*0.25,f.y+f.r*0.55);ctx.moveTo(f.x-f.r*0.1,f.y);ctx.lineTo(f.x+f.r*0.5,f.y-f.r*0.2);ctx.stroke();ctx.strokeStyle='#d6d3d1';ctx.lineWidth=3;circ(ctx,f.x,f.y,f.r+4);ctx.stroke()}
    if(f.dmgRedT>0){ctx.save();ctx.shadowColor='#86efac';ctx.shadowBlur=14;ctx.strokeStyle='rgba(134,239,172,.9)';ctx.lineWidth=2.5;polyN(ctx,f.x,f.y,f.r+8,6,t*0.8);ctx.stroke();ctx.restore()}
    if(f.rapidT>0){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(t*8);ctx.strokeStyle='#4fc3f7';ctx.lineWidth=2.5;ctx.setLineDash([5,7]);circ(ctx,0,0,f.r+8);ctx.stroke();ctx.restore()}
    if(f.zapFastT>0){ctx.save();ctx.strokeStyle='rgba(199,210,254,.95)';ctx.shadowColor='#818cf8';ctx.shadowBlur=8;ctx.lineWidth=1.5;for(let i=0;i<3;i++){const q=Math.random()*TAU;ctx.beginPath();ctx.moveTo(f.x+Math.cos(q)*(f.r+2),f.y+Math.sin(q)*(f.r+2));ctx.lineTo(f.x+Math.cos(q+0.15)*(f.r+9),f.y+Math.sin(q+0.15)*(f.r+9));ctx.lineTo(f.x+Math.cos(q-0.05)*(f.r+14),f.y+Math.sin(q-0.05)*(f.r+14));ctx.stroke()}ctx.restore()}
    if(f.freezeT>0){ctx.fillStyle='rgba(200,245,255,.55)';ctx.beginPath();ctx.arc(f.x,f.y,f.r+3,0,TAU);ctx.fill();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=2;for(let i=0;i<3;i++){const a=i/3*Math.PI;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*f.r*0.8,f.y+Math.sin(a)*f.r*0.8);ctx.lineTo(f.x-Math.cos(a)*f.r*0.8,f.y-Math.sin(a)*f.r*0.8);ctx.stroke()}}
    else if(f.slowT>0){ctx.strokeStyle='rgba(191,243,255,.8)';ctx.lineWidth=2;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(f.x,f.y,f.r+7,0,TAU);ctx.stroke();ctx.setLineDash([])}
    if(f.rootT>0){ctx.save();ctx.strokeStyle='#15803d';ctx.lineWidth=3.5;ctx.lineCap='round';for(let i=0;i<4;i++){const q=i/4*TAU+0.4;ctx.beginPath();ctx.moveTo(f.x+Math.cos(q)*(f.r+10),f.y+Math.sin(q)*(f.r+10));ctx.quadraticCurveTo(f.x+Math.cos(q+0.6)*(f.r+2),f.y+Math.sin(q+0.6)*(f.r+2),f.x+Math.cos(q+1.3)*(f.r*0.5),f.y+Math.sin(q+1.3)*(f.r*0.5));ctx.stroke();ctx.fillStyle='#4ade80';ctx.beginPath();ctx.ellipse(f.x+Math.cos(q+0.5)*(f.r+4),f.y+Math.sin(q+0.5)*(f.r+4),4,2,q,0,TAU);ctx.fill()}ctx.restore()}
    if(f.dazeT>0){for(let i=0;i<3;i++){const q=t*4+i/3*TAU;ctx.fillStyle='#e9d5ff';star(ctx,f.x+Math.cos(q)*f.r*0.9,f.y-f.r*1.15+Math.sin(q)*f.r*0.25,4,1.5,4)}}
    if(f.charmT>0){for(let i=0;i<3;i++){const q=t*3+i/3*TAU;ctx.fillStyle='#f472b6';heartPath(ctx,f.x+Math.cos(q)*(f.r+9),f.y+Math.sin(q)*(f.r+9),5);ctx.fill()}}
    if(f.bubbleT>0){ctx.save();const g=ctx.createRadialGradient(f.x-f.r*0.4,f.y-f.r*0.5,2,f.x,f.y,f.r+10);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(0.7,'rgba(165,243,252,.08)');g.addColorStop(1,'rgba(103,232,249,.4)');ctx.fillStyle=g;circ(ctx,f.x,f.y,f.r+10+Math.sin(t*5)*1.5);ctx.fill();ctx.strokeStyle='rgba(224,250,255,.85)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.ellipse(f.x-f.r*0.45,f.y-f.r*0.6,5,2.5,-0.7,0,TAU);ctx.fill();ctx.restore()}
    if(f.cocoonT>0){ctx.save();const g=ctx.createLinearGradient(f.x,f.y-f.r,f.x,f.y+f.r);g.addColorStop(0,'#fef3c7');g.addColorStop(1,'#d6b98c');ctx.fillStyle=g;ctx.globalAlpha*=0.92;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r+5,f.r+9,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(146,110,60,.6)';ctx.lineWidth=1.6;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(f.x-f.r-4,f.y+i*6+Math.sin(i)*3);ctx.quadraticCurveTo(f.x,f.y+i*6-5,f.x+f.r+4,f.y+i*6+3);ctx.stroke()}ctx.restore()}
    if(f.lifeT>0){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(t*2);ctx.shadowColor='#fde68a';ctx.shadowBlur=12;ctx.fillStyle='#fde68a';ctx.beginPath();ctx.arc(f.r+9,0,6,0.5*Math.PI,1.5*Math.PI,true);ctx.arc(f.r+11,0,5,1.5*Math.PI,0.5*Math.PI,false);ctx.fill();ctx.restore()}
    if(f.warT>0){ctx.save();const g=ctx.createRadialGradient(f.x,f.y,f.r*0.7,f.x,f.y,f.r+16);g.addColorStop(0,'rgba(251,113,133,.45)');g.addColorStop(1,'rgba(251,191,36,0)');ctx.fillStyle=g;circ(ctx,f.x,f.y,f.r+15+Math.sin(t*20)*2);ctx.fill();ctx.restore()}
    if(f.healHitT>0){for(let i=0;i<5;i++){const q=t*2.5+i/5*TAU;ctx.fillStyle=`hsl(${i*72+t*120},90%,75%)`;star(ctx,f.x+Math.cos(q)*(f.r+7),f.y+Math.sin(q)*(f.r+7),3.5,1.3,4)}}
    if(f.dotT>0){ctx.save();for(let i=0;i<2;i++){const k2=(t*1.6+i*0.5)%1;ctx.globalAlpha=1-k2;ctx.fillStyle='#fb7185';ctx.beginPath();ctx.ellipse(f.x+(i?6:-7),f.y+f.r*0.2+k2*f.r,2,3,0,0,TAU);ctx.fill()}ctx.restore()}
    if(f.reflectT>0){ctx.save();ctx.shadowColor='#f9a8d4';ctx.shadowBlur=16;ctx.strokeStyle='#f9a8d4';ctx.lineWidth=3;
      ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU-t*2;const px=f.x+Math.cos(a)*(f.r+9),py=f.y+Math.sin(a)*(f.r+9);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.stroke();ctx.restore()}
    if(f.cls==='phoenix'&&!f.revived){ctx.save();ctx.shadowColor='#ffcf70';ctx.shadowBlur=8;ctx.fillStyle='#ffcf70';star(ctx,f.x+f.r*0.78,f.y+f.r*0.78,5,2,4);ctx.restore()}
    if(f.isPlayer){const my=f.y-f.r*1.62-Math.sin(t*5)*2;ctx.fillStyle='#ffc53d';ctx.beginPath();ctx.moveTo(f.x,my+8);ctx.lineTo(f.x-6,my);ctx.lineTo(f.x+6,my);ctx.closePath();ctx.fill()}
    ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<f.poison;i++){const a=i/12*TAU+t*2;ctx.fillStyle='#7ee36b';ctx.beginPath();ctx.arc(f.x+Math.cos(a)*(f.r+5),f.y+Math.sin(a)*(f.r+5),2.6,0,TAU);ctx.fill()}
    if(f.cls==='rage'&&f.rageBonus>0){ctx.font='800 12px Vazirmatn, sans-serif';ctx.fillStyle='#ffb28f';ctx.fillText('+'+fa(f.rageBonus),f.x,f.y+f.r+12)}
    ctx.globalAlpha=1;
  }

  for(const r of G.rings){ctx.globalAlpha=Math.max(0,r.life/r.max);ctx.strokeStyle=r.c;ctx.lineWidth=r.w;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,TAU);ctx.stroke()}
  ctx.textAlign='center';ctx.textBaseline='middle';
  for(const tp of G.taps){const k=tp.life/0.45;ctx.globalAlpha=k;ctx.strokeStyle=tp.ok?'#ffc53d':'#ff6b6b';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(tp.x,tp.y,6+(1-k)*16,0,TAU);ctx.stroke();
    if(!tp.ok){ctx.font='800 12px Vazirmatn, sans-serif';ctx.fillStyle='#ff6b6b';ctx.fillText('شارژ نداری',tp.x,tp.y-18)}}
  ctx.globalCompositeOperation='lighter';
  for(const p of G.parts){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,TAU);ctx.fill()}
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  for(const tx of G.texts){
    const pop=1+Math.max(0,tx.life-0.72)*3.5;
    ctx.save();ctx.translate(tx.x,tx.y);ctx.scale(pop*W/360,pop*W/360);ctx.globalAlpha=Math.min(1,tx.life*2);
    ctx.font=(tx.big?'20px Lalezar, ':'800 15px ')+'Vazirmatn, sans-serif';
    ctx.lineWidth=4;ctx.strokeStyle='rgba(5,8,20,.75)';ctx.strokeText(tx.t,0,0);ctx.fillStyle=tx.c;ctx.fillText(tx.t,0,0);ctx.restore();
  }
  drawEmotes();
  if(G.fin){ctx.setTransform(scale,0,0,scale,M*scale,M*scale);drawFinOverlay()}
  if(G.banner){
    const b=G.banner,a=Math.min(1,b.life*2.5,(b.max-b.life)*6);
    ctx.save();ctx.scale(W/360,W/360);ctx.globalAlpha=a;ctx.fillStyle='rgba(7,10,25,.65)';ctx.fillRect(0,26,360,36);
    ctx.font=(b.t.length>30?'15px':b.t.length>22?'18px':'22px')+' Lalezar, Vazirmatn, sans-serif';ctx.fillStyle=b.c;ctx.fillText(b.t,180,45);ctx.globalAlpha=1;ctx.restore();
  }
  if(G.phase==='count'){
    const n=Math.ceil(G.count),fr=G.count-Math.floor(G.count),s=1+fr*0.6;
    ctx.save();ctx.translate(W/2,H/2);ctx.scale(s*W/360,s*W/360);ctx.globalAlpha=Math.min(1,fr*2+0.2);
    ctx.shadowColor='#ffc53d';ctx.shadowBlur=24;ctx.fillStyle='#ffc53d';ctx.font='72px Lalezar, sans-serif';ctx.fillText(fa(n),0,0);ctx.restore();
  }
}
