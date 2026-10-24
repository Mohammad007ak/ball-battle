// Ported from prototype/ball-battle.html (lines 2673-2913). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- ARENAS ---------- */
function tri(x1,y1,x2,y2,x3,y3){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();ctx.fill()}
function drawMap(t,B0){
  const M=G.map,w=B0.x1-B0.x0,h=B0.y1-B0.y0;
  ctx.globalAlpha=0.06;ctx.fillStyle=M.color;ctx.fillRect(B0.x0,B0.y0,w,h);ctx.globalAlpha=1;
  if(M.spikes){
    const n=7,sz=10,sw=w*0.4/n/2,shh=h*0.4/n/2;
    ctx.save();ctx.fillStyle='#ff6b6b';ctx.shadowColor='#ff4d6d';ctx.shadowBlur=10+Math.sin(t*6)*4;
    for(let i=0;i<n;i++){
      const k=(i+0.5)/n,x=B0.x0+w*(0.3+0.4*k),y=B0.y0+h*(0.3+0.4*k);
      tri(x-sw,B0.y0,x+sw,B0.y0,x,B0.y0+sz);tri(x-sw,B0.y1,x+sw,B0.y1,x,B0.y1-sz);
      tri(B0.x0,y-shh,B0.x0,y+shh,B0.x0+sz,y);tri(B0.x1,y-shh,B0.x1,y+shh,B0.x1-sz,y);
    }
    ctx.restore();
  }
  const oa=M.obsA;
  if(oa>0){
    for(const p of M.pillars){
      ctx.globalAlpha=oa;const R=p.R*(0.6+0.4*oa);
      ctx.fillStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.ellipse(p.x+4,p.y+7,R,R*0.9,0,0,TAU);ctx.fill();
      const g=ctx.createRadialGradient(p.x-R*0.3,p.y-R*0.4,1,p.x,p.y,R);
      g.addColorStop(0,'#e7eefb');g.addColorStop(0.5,'#8496b2');g.addColorStop(1,'#3a4760');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,R,0,TAU);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,R*0.6,0,TAU);ctx.stroke();
    }
    for(const b of M.bumpers){
      ctx.globalAlpha=oa;const R=b.R*(1+b.hit*1.4)*(0.6+0.4*oa);
      ctx.save();ctx.shadowColor='#ffc53d';ctx.shadowBlur=b.hit>0?26:12;
      ctx.fillStyle=b.hit>0?'#fff4cf':'#ffc53d';ctx.beginPath();ctx.arc(b.x,b.y,R,0,TAU);ctx.fill();ctx.restore();
      ctx.fillStyle='#3a2700';ctx.beginPath();ctx.arc(b.x,b.y,R*0.62,0,TAU);ctx.fill();
      ctx.fillStyle='#ffc53d';ctx.beginPath();
      for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2+t*0.8,rr=i%2?R*0.22:R*0.48,px=b.x+Math.cos(a)*rr,py=b.y+Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
      ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  for(const p of M.portals){
    const g=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,22);
    g.addColorStop(0,'#05060f');g.addColorStop(0.55,'#070918');g.addColorStop(1,p.c);
    ctx.save();ctx.shadowColor=p.c;ctx.shadowBlur=20;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,21,0,TAU);ctx.fill();ctx.restore();
    ctx.strokeStyle=p.c;ctx.lineWidth=2.5;ctx.lineCap='round';
    for(let i=0;i<3;i++){const a=t*3+i*TAU/3;ctx.beginPath();ctx.arc(p.x,p.y,15-i*3.5,a,a+2.2);ctx.stroke()}
  }
  if(M.bar){
    const cx=W/2,cy=H/2,ux=Math.cos(M.bar.ang)*M.bar.len,uy=Math.sin(M.bar.ang)*M.bar.len;
    ctx.save();
    ctx.strokeStyle='rgba(110,231,249,.14)';ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.beginPath();ctx.arc(cx,cy,M.bar.len,0,TAU);ctx.stroke();ctx.setLineDash([]);
    ctx.shadowColor='#6ee7f9';ctx.shadowBlur=16;ctx.strokeStyle='#6ee7f9';ctx.lineWidth=M.bar.w;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-ux,cy-uy);ctx.lineTo(cx+ux,cy+uy);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(cx-ux*0.9,cy-uy*0.9);ctx.lineTo(cx+ux*0.9,cy+uy*0.9);ctx.stroke();
    ctx.fillStyle='#1b2552';ctx.beginPath();ctx.arc(cx,cy,9,0,TAU);ctx.fill();ctx.strokeStyle='#6ee7f9';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
}

/* ---------- ARENA ART (one per league) ---------- */
function ln(b,x1,y1,x2,y2){b.beginPath();b.moveTo(x1,y1);b.lineTo(x2,y2);b.stroke()}
function star8(b,x,y,r,ri,rot){b.beginPath();for(let i=0;i<16;i++){const a=i/16*TAU+(rot||0),q=i%2?ri:r;i?b.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):b.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}b.closePath()}
function polyN(b,x,y,r,n,rot){b.beginPath();for(let i=0;i<n;i++){const a=i/n*TAU+(rot||0);i?b.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):b.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}b.closePath()}
function crack(b,seed,x,y,n,len){b.beginPath();b.moveTo(x,y);let a=rnd(seed)*TAU;for(let i=0;i<n;i++){a+=(rnd(seed+i*3.1)-0.5)*1.1;x+=Math.cos(a)*len*(0.6+rnd(seed+i*7.7)*0.8);y+=Math.sin(a)*len*(0.6+rnd(seed+i*5.3)*0.8);b.lineTo(x,y)}b.stroke()}
function vignette(b,a,col){const v=b.createRadialGradient(M+W/2,M+H/2,W*0.28,M+W/2,M+H/2,W*0.78);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,col||`rgba(0,0,0,${a})`);b.fillStyle=v;b.fillRect(M,M,W,H)}
function crystal(b,x,y,a,len,w,col){
  const ux=Math.cos(a),uy=Math.sin(a),nx=-uy,ny=ux;b.save();b.shadowColor=col;b.shadowBlur=8;
  const g=b.createLinearGradient(x,y,x+ux*len,y+uy*len);g.addColorStop(0,col);g.addColorStop(1,'#ffffff');b.fillStyle=g;
  b.beginPath();b.moveTo(x+nx*w,y+ny*w);b.lineTo(x+ux*len*0.72+nx*w,y+uy*len*0.72+ny*w);b.lineTo(x+ux*len,y+uy*len);b.lineTo(x+ux*len*0.72-nx*w,y+uy*len*0.72-ny*w);b.lineTo(x-nx*w,y-ny*w);b.closePath();b.fill();
  b.shadowBlur=0;b.strokeStyle='rgba(255,255,255,.6)';b.lineWidth=0.8;ln(b,x,y,x+ux*len,y+uy*len);b.restore();
}
function paintArena(b,li){
  const R=n=>rnd(n*1.7+li*97.3),cx=M+W/2,cy=M+H/2;
  b.save();
  if(li===0){ // کاروانسرا: کاهگل و کاشی فیروزه‌ای
    b.fillStyle='#5a3218';b.fillRect(0,0,VW,VW);
    for(let row=0,y=0;y<VW;row++,y+=7)for(let x=-(row%2)*8;x<VW;x+=16){const v=R(row*31+x*0.37);b.fillStyle=v<0.33?'#8a5530':v<0.66?'#7a4828':'#9a643c';b.fillRect(x+0.7,y+0.7,14.6,5.6)}
    for(let i=0;i<12;i++)for(let j=0;j<12;j++){const v=R(i*13+j*7+5),x=M+i*30,y=M+j*30;b.fillStyle=v<0.33?'#93613a':v<0.66?'#8a5833':'#9b6841';b.fillRect(x,y,30,30);
      b.fillStyle='rgba(255,230,190,.06)';b.fillRect(x+2,y+2,26,2.5);b.fillStyle='rgba(0,0,0,.07)';b.fillRect(x+2,y+25.5,26,2.5)}
    b.strokeStyle='#5b3820';b.lineWidth=1.6;for(let i=0;i<=12;i++){ln(b,M+i*30,M,M+i*30,M+H);ln(b,M,M+i*30,M+W,M+i*30)}
    for(const [qx,qy,a0] of [[M,M,0],[M+W,M,Math.PI/2],[M+W,M+H,Math.PI],[M,M+H,Math.PI*1.5]]){
      b.fillStyle='rgba(31,138,128,.32)';b.beginPath();b.moveTo(qx,qy);b.arc(qx,qy,48,a0,a0+Math.PI/2);b.closePath();b.fill();
      b.strokeStyle='rgba(233,192,138,.55)';b.lineWidth=2;b.beginPath();b.arc(qx,qy,48,a0,a0+Math.PI/2);b.stroke();b.beginPath();b.arc(qx,qy,36,a0,a0+Math.PI/2);b.stroke()}
    b.fillStyle='rgba(31,138,128,.32)';circ(b,cx,cy,60);b.fill();
    b.strokeStyle='rgba(233,192,138,.6)';b.lineWidth=2;circ(b,cx,cy,60);b.stroke();
    star8(b,cx,cy,50,38);b.fillStyle='rgba(42,157,143,.35)';b.fill();b.stroke();
    star8(b,cx,cy,24,18,TAU/32);b.fillStyle='rgba(233,192,138,.35)';b.fill();
    vignette(b,0.45);
  }else if(li===1){ // قلهٔ دماوند: یخ و برف
    b.fillStyle='#7f9bb3';b.fillRect(0,0,VW,VW);
    for(let row=0,y=0;y<VW;row++,y+=12)for(let x=-(row%2)*11;x<VW;x+=22){const v=R(row*17+x*0.29);b.fillStyle=v<0.33?'#d9e9f6':v<0.66?'#c4d9ec':'#e9f3fb';b.fillRect(x+0.8,y+0.8,20.4,10.4);b.fillStyle='rgba(255,255,255,.6)';b.fillRect(x+1.5,y+1.2,19,1.6)}
    const g=b.createLinearGradient(0,M,0,M+H);g.addColorStop(0,'#5a84a8');g.addColorStop(1,'#3e6587');b.fillStyle=g;b.fillRect(M,M,W,H);
    b.strokeStyle='rgba(200,230,255,.08)';b.lineWidth=1;for(let i=1;i<9;i++){ln(b,M+i*40,M,M+i*40,M+H);ln(b,M,M+i*40,M+W,M+i*40)}
    for(let i=0;i<34;i++){const side=i%4,t0=R(i+3);let x=M+t0*W,y=M+t0*H;const d=6+R(i+9)*28;
      if(side===0)y=M+d;else if(side===1)y=M+H-d;else if(side===2)x=M+d;else x=M+W-d;
      const rr=14+R(i+21)*26,sg=b.createRadialGradient(x,y,1,x,y,rr);sg.addColorStop(0,'rgba(255,255,255,.24)');sg.addColorStop(1,'rgba(255,255,255,0)');b.fillStyle=sg;circ(b,x,y,rr);b.fill()}
    b.strokeStyle='rgba(225,242,255,.32)';b.lineWidth=1.1;for(let i=0;i<16;i++)crack(b,i*11+7,M+20+R(i+40)*(W-40),M+20+R(i+60)*(H-40),5,14);
    b.strokeStyle='rgba(230,245,255,.45)';b.lineWidth=2;circ(b,cx,cy,58);b.stroke();
    b.strokeStyle='rgba(255,255,255,.38)';b.lineWidth=2.5;b.lineCap='round';
    for(let i=0;i<6;i++){const a=i/6*TAU;ln(b,cx,cy,cx+Math.cos(a)*24,cy+Math.sin(a)*24);const mx=cx+Math.cos(a)*15,my=cy+Math.sin(a)*15;ln(b,mx,my,mx+Math.cos(a+0.6)*7,my+Math.sin(a+0.6)*7);ln(b,mx,my,mx+Math.cos(a-0.6)*7,my+Math.sin(a-0.6)*7)}
    vignette(b,0.35);
  }else if(li===2){ // باغ ارم: کاشی‌کاری و حوض
    b.fillStyle='#0a3e4a';b.fillRect(0,0,VW,VW);
    b.strokeStyle='#e9c46a';b.lineWidth=1.5;b.strokeRect(2.5,2.5,VW-5,VW-5);
    for(let p=10;p<VW-4;p+=16)for(const [x,y] of [[p,M/2],[p,VW-M/2],[M/2,p],[VW-M/2,p]]){b.save();b.translate(x,y);b.rotate(Math.PI/4);b.fillStyle=(p/16|0)%2?'#e9c46a':'#2ec4b6';b.fillRect(-2.6,-2.6,5.2,5.2);b.restore()}
    b.fillStyle='#0e5a6c';b.fillRect(M,M,W,H);
    for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){b.save();b.translate(M+i*45,M+j*45);b.rotate(Math.PI/4);b.fillStyle='rgba(233,196,106,.35)';b.fillRect(-3,-3,6,6);b.restore()}
    for(let i=0;i<8;i++)for(let j=0;j<8;j++){const x=M+22.5+i*45,y=M+22.5+j*45;star8(b,x,y,16,12);b.fillStyle='#13738a';b.fill();b.strokeStyle='rgba(110,220,235,.5)';b.lineWidth=1.2;b.stroke();b.fillStyle='#e9c46a';circ(b,x,y,2.3);b.fill()}
    for(const [x,y] of [[M+10,M+10],[M+W-64,M+10],[M+10,M+H-64],[M+W-64,M+H-64]]){
      rrect(b,x,y,54,54,8);b.fillStyle='#14532d';b.fill();b.strokeStyle='#e9c46a';b.lineWidth=1.5;b.stroke();
      for(let i=0;i<12;i++){const fx=x+8+R(x+i)*38,fy=y+8+R(y+i*2)*38;b.fillStyle='#166534';circ(b,fx+2,fy+2,3.4);b.fill();b.fillStyle=['#f472b6','#fb7185','#fde68a'][i%3];circ(b,fx,fy,2.6);b.fill()}}
    polyN(b,cx,cy,54,8,TAU/16);const pg=b.createRadialGradient(cx,cy,4,cx,cy,54);pg.addColorStop(0,'#5fd4ef');pg.addColorStop(1,'#0e7490');b.fillStyle=pg;b.fill();b.strokeStyle='#e9c46a';b.lineWidth=2.5;b.stroke();
    polyN(b,cx,cy,42,8,TAU/16);b.strokeStyle='rgba(255,255,255,.35)';b.lineWidth=1.2;b.stroke();
    b.strokeStyle='rgba(255,255,255,.3)';for(const r of [12,22,30]){circ(b,cx,cy,r);b.stroke()}
    b.fillStyle='rgba(255,255,255,.75)';circ(b,cx,cy,4);b.fill();
    vignette(b,0.4);
  }else if(li===3){ // غار بلور
    b.fillStyle='#160e29';b.fillRect(0,0,VW,VW);
    for(let i=0;i<70;i++){b.fillStyle=i%2?'#21173b':'#0f0820';polyN(b,R(i)*VW,R(i+100)*VW,3+R(i+200)*6,5+(i%3),R(i+300)*TAU);b.fill()}
    const g=b.createRadialGradient(cx,cy,10,cx,cy,W*0.7);g.addColorStop(0,'#3d2c6b');g.addColorStop(1,'#211640');b.fillStyle=g;b.fillRect(M,M,W,H);
    b.save();b.beginPath();b.rect(M,M,W,H);b.clip();
    b.strokeStyle='rgba(192,132,252,.10)';b.lineWidth=1;const s=16,hh=Math.sqrt(3)*s;
    for(let c=0;c*s*1.5<VW+s*2;c++){const x=c*s*1.5;for(let y=(c%2?hh/2:0)-hh;y<VW+hh;y+=hh){hexPath(b,x,y,s);b.stroke()}}
    b.shadowColor='#a855f7';b.shadowBlur=8;b.strokeStyle='rgba(168,85,247,.5)';b.lineWidth=1.6;
    for(let i=0;i<7;i++){b.beginPath();b.moveTo(M+R(i+11)*W,M);b.bezierCurveTo(M+R(i+12)*W,M+H*0.3,M+R(i+13)*W,M+H*0.7,M+R(i+14)*W,M+H);b.stroke()}
    b.shadowBlur=0;
    for(let i=0;i<40;i++){b.fillStyle=`rgba(255,255,255,${0.2+R(i+500)*0.45})`;star(b,M+R(i+600)*W,M+R(i+700)*H,1+R(i+800)*2.2,0.5,4)}
    b.restore();
    polyN(b,cx,cy,62,6,Math.PI/6);b.strokeStyle='rgba(103,232,249,.35)';b.lineWidth=2;b.stroke();polyN(b,cx,cy,48,6,0);b.strokeStyle='rgba(192,132,252,.3)';b.stroke();
    vignette(b,0.45);
    const cols=['#c084fc','#67e8f9','#f0abfc'];
    for(let side=0;side<4;side++)for(let i=0;i<7;i++){
      const tp=0.08+i*0.14+(R(side*10+i)-0.5)*0.06,len=12+R(side*20+i)*12;let x,y,a;
      if(side===0){x=M+tp*W;y=M*0.35;a=Math.PI/2}else if(side===1){x=M+tp*W;y=VW-M*0.35;a=-Math.PI/2}else if(side===2){x=M*0.35;y=M+tp*H;a=0}else{x=VW-M*0.35;y=M+tp*H;a=Math.PI}
      for(let j=0;j<2+(i%2);j++)crystal(b,x+(j-0.5)*6*Math.sin(a),y+(j-0.5)*6*Math.cos(a),a+(j-1)*0.45,len*(j===1?1:0.7),4.5,cols[(i+j+side)%3]);
    }
  }else{ // قلعهٔ آتشفشان
    b.fillStyle='#0d0707';b.fillRect(0,0,VW,VW);
    for(let row=0,y=0;y<VW;row++,y+=14)for(let x=-(row%2)*13;x<VW;x+=26){const v=R(row*23+x*0.41);b.fillStyle=v<0.33?'#231516':v<0.66?'#1b1011':'#2b1a1b';b.fillRect(x+1,y+1,24,12);b.fillStyle='rgba(255,255,255,.05)';b.fillRect(x+1.5,y+1.5,23,1.2)}
    b.save();b.shadowColor='#ff4500';b.shadowBlur=6;b.strokeStyle='rgba(255,106,43,.6)';b.lineWidth=1.2;
    for(let i=0;i<26;i++){const y=Math.floor(R(i+40)*(VW/14))*14+0.5,x=R(i+50)*VW;ln(b,x,y,x+10+R(i+60)*20,y)}b.restore();
    b.fillStyle='#24181a';b.fillRect(M,M,W,H);
    b.save();b.beginPath();b.rect(M,M,W,H);b.clip();
    const s=17,hh=Math.sqrt(3)*s;let n=0;
    for(let c=0;c*s*1.5<VW+s*2;c++){const x=c*s*1.5;for(let y=(c%2?hh/2:0)-hh;y<VW+hh;y+=hh){n++;hexPath(b,x,y,s-1);const v=R(n+900);b.fillStyle=v<0.33?'#33221f':v<0.66?'#2c1d1b':'#3a2622';b.fill();b.strokeStyle='#150c0b';b.lineWidth=2;b.stroke()}}
    for(const [x,y] of [[M+30,M+H-30],[M+W-34,M+28]]){const lg=b.createRadialGradient(x,y,2,x,y,38);lg.addColorStop(0,'rgba(255,190,90,.75)');lg.addColorStop(0.4,'rgba(255,90,30,.45)');lg.addColorStop(1,'rgba(255,60,0,0)');b.fillStyle=lg;circ(b,x,y,38);b.fill()}
    b.lineCap='round';b.lineJoin='round';
    for(let i=0;i<11;i++){const x=M+R(i+70)*W,y=M+R(i+80)*H,sd=i*13+400;
      b.shadowColor='#ff4500';b.shadowBlur=12;b.strokeStyle='rgba(255,69,0,.45)';b.lineWidth=4;crack(b,sd,x,y,7,13);
      b.shadowBlur=0;b.strokeStyle='#ff7a2b';b.lineWidth=1.8;crack(b,sd,x,y,7,13);b.strokeStyle='#ffd27a';b.lineWidth=0.7;crack(b,sd,x,y,7,13)}
    b.restore();
    b.save();b.shadowColor='#ff5a1f';b.shadowBlur=10;b.strokeStyle='rgba(255,122,61,.6)';b.lineWidth=2;circ(b,cx,cy,60);b.stroke();b.lineWidth=1.5;circ(b,cx,cy,48);b.stroke();
    b.fillStyle='rgba(255,140,60,.75)';for(let i=0;i<8;i++){const a=i/8*TAU;b.save();b.translate(cx+Math.cos(a)*54,cy+Math.sin(a)*54);b.rotate(a);b.beginPath();b.moveTo(4,0);b.lineTo(-3,3.5);b.lineTo(-3,-3.5);b.closePath();b.fill();b.restore()}
    b.restore();
    vignette(b,0,'rgba(40,0,0,.55)');
  }
  b.restore();
  b.strokeStyle='rgba(0,0,0,.35)';b.lineWidth=5;b.strokeRect(M+2.5,M+2.5,W-5,H-5);
  b.strokeStyle='rgba(0,0,0,.65)';b.lineWidth=2;b.strokeRect(M-1,M-1,W+2,H+2);
}

