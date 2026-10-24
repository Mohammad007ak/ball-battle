// Ported from prototype/ball-battle.html (lines 3265-3334). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- DRAW ---------- */
function drawPupIcon(type,x,y,s){
  ctx.fillStyle='#ffffff';
  if(type==='heal'){ctx.fillRect(x-s*0.18,y-s*0.55,s*0.36,s*1.1);ctx.fillRect(x-s*0.55,y-s*0.18,s*1.1,s*0.36)}
  else if(type==='power'){ctx.beginPath();ctx.moveTo(x+s*0.15,y-s*0.65);ctx.lineTo(x-s*0.4,y+s*0.08);ctx.lineTo(x-s*0.02,y+s*0.08);ctx.lineTo(x-s*0.18,y+s*0.65);ctx.lineTo(x+s*0.42,y-s*0.12);ctx.lineTo(x+s*0.04,y-s*0.12);ctx.closePath();ctx.fill()}
  else{ctx.strokeStyle='#ffffff';ctx.lineWidth=2.6;ctx.lineCap='round';for(const o of [-0.25,0.2]){ctx.beginPath();ctx.moveTo(x-s*0.35,y+o*s+s*0.2);ctx.lineTo(x,y+o*s-s*0.15);ctx.lineTo(x+s*0.35,y+o*s+s*0.2);ctx.stroke()}}
}
function drawProjectile(a){
  const s=Math.hypot(a.vx,a.vy)||1,ang=Math.atan2(a.vy/s,a.vx/s),c=CLASSES[a.owner.cls].c1;
  ctx.save();ctx.translate(a.x,a.y);
  switch(a.kind){
    case 'bat':{ctx.rotate(ang);const fl=Math.sin(G.clock*28+a.spin)*0.7;
      ctx.fillStyle='#5b1a8f';ctx.strokeStyle='#d06bff';ctx.lineWidth=1;
      for(const sd of[-1,1]){ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(-4,sd*(9+fl*3));ctx.lineTo(-2,sd*4);ctx.lineTo(-7,sd*(6+fl*2));ctx.lineTo(-4,0);ctx.closePath();ctx.fill();ctx.stroke()}
      ctx.fillStyle='#2a0a3d';ctx.beginPath();ctx.ellipse(0,0,5,3.4,0,0,TAU);ctx.fill();
      ctx.fillStyle='#ff4d6d';circ(ctx,2.6,-1.2,0.9);ctx.fill();circ(ctx,2.6,1.2,0.9);ctx.fill();break}
    case 'ice':ctx.rotate(ang);ctx.shadowColor='#bff3ff';ctx.shadowBlur=10;ctx.fillStyle='#e0fbff';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(0,3.4);ctx.lineTo(-14,0);ctx.lineTo(0,-3.4);ctx.closePath();ctx.fill();ctx.strokeStyle='#7dd3fc';ctx.lineWidth=1;ctx.stroke();break;
    case 'grenade':ctx.rotate(a.spin);ctx.fillStyle='#334155';circ(ctx,0,0,6.5);ctx.fill();ctx.strokeStyle='#94a3b8';ctx.lineWidth=1.2;ctx.stroke();ctx.fillStyle='#64748b';ctx.fillRect(-2,-9,4,3);ctx.shadowColor='#ffb347';ctx.shadowBlur=8;ctx.fillStyle='#fff3c4';star(ctx,0,-11,3.6,1.2,5);break;
    case 'shard':ctx.rotate(a.spin);ctx.shadowColor='#f9a8d4';ctx.shadowBlur=8;ctx.fillStyle='rgba(255,225,242,.95)';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,4.5);ctx.lineTo(-3,-5);ctx.closePath();ctx.fill();ctx.strokeStyle='#f472b6';ctx.lineWidth=1;ctx.stroke();break;
    case 'feather':{ctx.rotate(ang);ctx.shadowColor='#ffb347';ctx.shadowBlur=12;const g=ctx.createLinearGradient(-11,0,9,0);g.addColorStop(0,'#e8590c');g.addColorStop(1,'#ffe066');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,11,3.6,0,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(10,0);ctx.stroke();break}
    case 'rock':{ctx.rotate(a.spin);ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=6;const g=ctx.createRadialGradient(-3,-3,1,0,0,11);g.addColorStop(0,'#e7e5e4');g.addColorStop(1,'#57534e');ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<7;i++){const q=i/7*TAU,rr=8+rnd(i+3)*3.5;i?ctx.lineTo(Math.cos(q)*rr,Math.sin(q)*rr):ctx.moveTo(rr,0)}ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#292524';ctx.lineWidth=1.5;ctx.stroke();break}
    case 'bubble':{const g=ctx.createRadialGradient(-2,-2,1,0,0,7);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(0.6,'rgba(165,243,252,.35)');g.addColorStop(1,'rgba(103,232,249,.6)');ctx.fillStyle=g;circ(ctx,0,0,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.2;ctx.stroke();break}
    case 'bfly':{ctx.rotate(ang);const fl=0.5+Math.abs(Math.sin(G.clock*22+a.spin))*0.6,cb=a.owner.skin&&SKINS[a.owner.skin]?SKINS[a.owner.skin].c1:'#fdba74';ctx.fillStyle=cb;ctx.strokeStyle='#1c1917';ctx.lineWidth=1;
      for(const sd of[-1,1]){ctx.beginPath();ctx.ellipse(-1,sd*5*fl,4.5,5*fl,sd*0.5,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(-5,sd*3.5*fl,3,3.4*fl,-sd*0.4,0,TAU);ctx.fill();ctx.stroke()}
      ctx.fillStyle='#1c1917';ctx.beginPath();ctx.ellipse(0,0,5,1.6,0,0,TAU);ctx.fill();break}
    case 'claw':{ctx.rotate(ang);ctx.shadowColor='#c7d2fe';ctx.shadowBlur=10;ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2.4;ctx.lineCap='round';for(const o of[-5,0,5]){ctx.beginPath();ctx.arc(-6,o,10,-0.9,0.9);ctx.stroke()}break}
    case 'spear':{ctx.rotate(ang);ctx.strokeStyle='#92400e';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(4,0);ctx.stroke();ctx.fillStyle='#e2e8f0';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(2,5);ctx.lineTo(2,-5);ctx.closePath();ctx.fill();ctx.strokeStyle='#475569';ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle='#dc2626';ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(-5,6+Math.sin(G.clock*30)*2);ctx.lineTo(-3,0);ctx.lineTo(-5,-6-Math.sin(G.clock*30)*2);ctx.closePath();ctx.fill();break}
    case 'heavy':{ctx.rotate(ang);ctx.shadowColor=c;ctx.shadowBlur=14;const g=ctx.createLinearGradient(-36,0,0,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,c);ctx.strokeStyle=g;ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-36,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-2,7);ctx.lineTo(-2,-7);ctx.closePath();ctx.fill();break}
    default:{ctx.rotate(ang);ctx.shadowColor=c;ctx.shadowBlur=10;const L=a.kind==='spine'?11:22,g=ctx.createLinearGradient(-L,0,0,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,c);
      ctx.strokeStyle=g;ctx.lineWidth=3.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-L,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(0,4);ctx.lineTo(0,-4);ctx.closePath();ctx.fill()}
  }
  ctx.restore();
}
function drawZone(z,t){
  const k=z.life/z.max;
  if(z.kind==='fire'){
    ctx.globalCompositeOperation='lighter';
    const rr=z.r*(0.55+0.45*k)+Math.sin(t*30+z.x)*1.5,g=ctx.createRadialGradient(z.x,z.y,1,z.x,z.y,rr);
    g.addColorStop(0,`rgba(255,220,120,${0.55*k})`);g.addColorStop(0.5,`rgba(244,63,94,${0.4*k})`);g.addColorStop(1,'rgba(120,0,20,0)');
    ctx.fillStyle=g;circ(ctx,z.x,z.y,rr);ctx.fill();ctx.globalCompositeOperation='source-over';
  }else if(z.kind==='acid'){
    const g=ctx.createRadialGradient(z.x,z.y,2,z.x,z.y,z.r);g.addColorStop(0,`rgba(170,255,130,${0.4*k+0.12})`);g.addColorStop(0.7,`rgba(60,180,60,${0.3*k+0.08})`);g.addColorStop(1,'rgba(30,90,30,0)');
    ctx.fillStyle=g;circ(ctx,z.x,z.y,z.r);ctx.fill();
    ctx.strokeStyle=`rgba(225,255,205,${0.65*k+0.1})`;ctx.lineWidth=1.2;
    for(let i=0;i<6;i++){const ph=(t*1.3+rnd(i+z.x))%1,q=rnd(i*3+z.y)*TAU,rr=rnd(i+11)*z.r*0.7;circ(ctx,z.x+Math.cos(q)*rr,z.y+Math.sin(q)*rr,1.5+ph*4);ctx.stroke()}
  }else if(z.kind==='rainbow'){
    ctx.globalCompositeOperation='lighter';const rr=z.r*(0.6+0.4*k),g=ctx.createRadialGradient(z.x,z.y,1,z.x,z.y,rr);g.addColorStop(0,`hsla(${z.hue},100%,80%,${0.6*k})`);g.addColorStop(1,`hsla(${z.hue},100%,60%,0)`);ctx.fillStyle=g;circ(ctx,z.x,z.y,rr);ctx.fill();ctx.globalCompositeOperation='source-over';
  }else if(z.kind==='dust'){
    const g=ctx.createRadialGradient(z.x,z.y,2,z.x,z.y,z.r);g.addColorStop(0,`rgba(233,213,255,${0.35*k+0.1})`);g.addColorStop(0.7,`rgba(244,114,182,${0.18*k+0.05})`);g.addColorStop(1,'rgba(168,85,247,0)');ctx.fillStyle=g;circ(ctx,z.x,z.y,z.r);ctx.fill();
    for(let i=0;i<10;i++){const q=rnd(i+z.x)*TAU+t*(0.5+rnd(i)),rr=rnd(i*3+z.y)*z.r*0.85,tw=Math.abs(Math.sin(t*4+i));ctx.fillStyle=`rgba(255,255,255,${0.85*tw*k+0.1})`;star(ctx,z.x+Math.cos(q)*rr,z.y+Math.sin(q)*rr,2+tw*2.5,0.8,4)}
    ctx.font='700 13px sans-serif';ctx.fillStyle=`rgba(233,213,255,${0.8*k})`;ctx.textAlign='center';ctx.fillText('z',z.x+Math.sin(t*2)*8,z.y-z.r*0.4-((t*20)%14));
  }else if(z.kind==='tornado'){
    ctx.save();ctx.translate(z.x,z.y);
    const g=ctx.createRadialGradient(0,0,2,0,0,z.r+8);g.addColorStop(0,`rgba(94,234,212,${0.35*k+0.12})`);g.addColorStop(1,'rgba(94,234,212,0)');ctx.fillStyle=g;circ(ctx,0,0,z.r+8);ctx.fill();
    ctx.rotate(-t*9);ctx.strokeStyle=`rgba(225,255,250,${0.7*k+0.25})`;ctx.lineWidth=2.4;ctx.lineCap='round';
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(0,0);for(let q=1;q<=16;q++){const th=q/16*3+i/3*TAU,rr=z.r*q/16;ctx.lineTo(Math.cos(th)*rr,Math.sin(th)*rr)}ctx.stroke()}
    ctx.restore();
  }
}
function drawAura(f,t){
  const au=f.aura,k=Math.min(1,au.t*2);ctx.save();ctx.globalAlpha*=k;
  const g=ctx.createRadialGradient(f.x,f.y,f.r,f.x,f.y,au.r);g.addColorStop(0,`rgba(${au.col},.24)`);g.addColorStop(1,`rgba(${au.col},.05)`);ctx.fillStyle=g;circ(ctx,f.x,f.y,au.r);ctx.fill();
  ctx.translate(f.x,f.y);ctx.save();ctx.rotate(t*1.5);ctx.strokeStyle=`rgba(${au.col},.75)`;ctx.lineWidth=2;ctx.setLineDash([10,8]);circ(ctx,0,0,au.r);ctx.stroke();ctx.restore();
  if(au.kind==='snow'){ctx.fillStyle='#ffffff';for(let i=0;i<16;i++){const q=i/16*TAU+t*(0.8+rnd(i)),rr=f.r+8+rnd(i+7)*(au.r-f.r-12);circ(ctx,Math.cos(q)*rr,Math.sin(q)*rr,1.2+rnd(i+3)*1.4);ctx.fill()}}
  if(au.kind==='elec'){ctx.strokeStyle='rgba(225,230,255,.95)';ctx.lineWidth=1.5;for(let i=0;i<4;i++){const q=Math.random()*TAU,r0=f.r+6+Math.random()*(au.r-f.r-24);ctx.beginPath();ctx.moveTo(Math.cos(q)*r0,Math.sin(q)*r0);for(let j=1;j<5;j++){const qq=q+j*0.07,rr=r0+j*5*(j%2?1:-0.3);ctx.lineTo(Math.cos(qq)*rr,Math.sin(qq)*rr)}ctx.stroke()}}
  if(au.kind==='petal'){for(let i=0;i<14;i++){const q=i/14*TAU+t*(0.6+rnd(i)*0.6),rr=f.r+6+rnd(i+7)*(au.r-f.r-10);ctx.save();ctx.translate(Math.cos(q)*rr,Math.sin(q)*rr);ctx.rotate(q*2+t*3);ctx.fillStyle=i%2?'#fbcfe8':'#f472b6';ctx.beginPath();ctx.ellipse(0,0,4.5,2.4,0,0,TAU);ctx.fill();ctx.restore()}}
  if(au.kind==='sun'){ctx.rotate(t*0.8);ctx.strokeStyle='rgba(255,220,130,.65)';ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<12;i++){const q=i/12*TAU;ctx.beginPath();ctx.moveTo(Math.cos(q)*(f.r+8),Math.sin(q)*(f.r+8));ctx.lineTo(Math.cos(q)*(f.r+20),Math.sin(q)*(f.r+20));ctx.stroke()}}
  ctx.restore();
}
