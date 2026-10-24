// Ported from prototype/ball-battle.html (lines 1809-1996). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
function faceXY(x,y,r,la){return {fx:x+Math.cos(la)*r*0.2,fy:y+Math.sin(la)*r*0.14+r*0.05}}
const PART={
  _fwings(c,x,y,r,t,tint){const fl=Math.sin(t*14)*0.16,tc=tint||'#f472b6';for(const sd of[-1,1]){c.save();c.translate(x+sd*r*0.5,y-r*0.15);c.scale(sd,1);c.rotate(-0.35-fl);
    const g=c.createLinearGradient(0,0,r*1.2,-r*0.8);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(0.5,'rgba(186,230,253,.75)');g.addColorStop(1,tc);c.globalAlpha*=0.85;
    c.fillStyle=g;c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=r*0.04;
    c.beginPath();c.ellipse(r*0.62,-r*0.32,r*0.62,r*0.32,-0.45,0,TAU);c.fill();c.stroke();
    c.beginPath();c.ellipse(r*0.48,r*0.28,r*0.42,r*0.22,0.45,0,TAU);c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=r*0.02;c.beginPath();c.moveTo(r*0.1,-r*0.1);c.lineTo(r*1.0,-r*0.55);c.moveTo(r*0.1,r*0.05);c.lineTo(r*0.75,r*0.4);c.stroke();c.restore()}},
  _bwings(c,x,y,r,t,a,b,vein,spot,glow,clear){const fl=0.8+Math.cos(t*9)*0.2;for(const sd of[-1,1]){c.save();c.translate(x,y);c.scale(sd*fl,1);
    const g=c.createRadialGradient(r*0.5,-r*0.2,r*0.1,r*0.9,-r*0.3,r*1.4);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;if(glow){c.shadowColor=glow;c.shadowBlur=r*0.4}
    c.beginPath();c.moveTo(r*0.25,-r*0.25);c.bezierCurveTo(r*0.55,-r*1.55,r*1.85,-r*1.4,r*1.72,-r*0.6);c.bezierCurveTo(r*1.66,-r*0.2,r*1.0,-r*0.02,r*0.25,r*0.05);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle=vein;c.lineWidth=r*0.08;c.stroke();
    c.beginPath();c.moveTo(r*0.25,r*0.05);c.bezierCurveTo(r*1.3,r*0.02,r*1.55,r*0.72,r*1.12,r*1.08);c.bezierCurveTo(r*0.8,r*1.32,r*0.4,r*0.95,r*0.28,r*0.35);c.closePath();c.fill();c.stroke();
    c.lineWidth=r*0.035;c.beginPath();c.moveTo(r*0.35,-r*0.12);c.lineTo(r*1.3,-r*1.02);c.moveTo(r*0.35,-r*0.05);c.lineTo(r*1.58,-r*0.48);c.moveTo(r*0.35,r*0.15);c.lineTo(r*1.08,r*0.78);c.stroke();
    if(spot){c.fillStyle=spot;for(const [px,py] of [[1.58,-0.92],[1.68,-0.62],[1.32,-1.18],[1.12,0.88],[1.35,0.58],[1.0,-1.25]]){circ(c,px*r,py*r,r*0.065);c.fill()}}
    if(clear){c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(r*1.0,-r*0.65,r*0.42,r*0.28,-0.5,0,TAU);c.fill()}
    c.restore()}},
  _fcrown(c,x,y,r,t,petal,center,type){for(let i=0;i<7;i++){const a=Math.PI*(1.15+i*0.117),px=x+Math.cos(a)*r*0.9,py=y+Math.sin(a)*r*0.9;
      c.fillStyle='#22c55e';c.beginPath();c.ellipse(x+Math.cos(a+0.06)*r*0.95,y+Math.sin(a+0.06)*r*0.95,r*0.12,r*0.05,a+1.2,0,TAU);c.fill();
      if(type==='maple'){c.save();c.translate(px,py);c.rotate(a+Math.PI/2);c.fillStyle=i%2?'#ea580c':'#facc15';c.beginPath();for(let j=0;j<10;j++){const q=j/10*TAU-Math.PI/2,rr=j%2?r*0.08:r*0.19;j?c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr):c.moveTo(Math.cos(q)*rr,Math.sin(q)*rr)}c.closePath();c.fill();c.restore();continue}
      const sz=r*(i%2?0.13:0.17),pc=Array.isArray(petal)?petal[i%petal.length]:petal,np=type==='daisy'?8:5;
      for(let j=0;j<np;j++){const q=j/np*TAU+i;c.fillStyle=pc;c.beginPath();c.ellipse(px+Math.cos(q)*sz*0.62,py+Math.sin(q)*sz*0.62,sz*(type==='daisy'?0.55:0.62),sz*(type==='daisy'?0.22:0.42),q,0,TAU);c.fill()}
      c.fillStyle=center;circ(c,px,py,sz*0.38);c.fill()}},
  crownDaisy(c,x,y,r,t){PART._fcrown(c,x,y,r,t,'#ffffff','#facc15','daisy')},
  crownSakura(c,x,y,r,t){PART._fcrown(c,x,y,r,t,['#fbcfe8','#f9a8d4'],'#be185d')},
  crownMaple(c,x,y,r,t){PART._fcrown(c,x,y,r,t,'#ea580c','#facc15','maple')},
  _antennae(c,x,y,r,t,col){c.strokeStyle=col;c.lineWidth=r*0.05;c.lineCap='round';for(const sd of[-1,1]){const w=Math.sin(t*5+sd)*r*0.06,tx=x+sd*r*0.55+w,ty=y-r*1.55;c.beginPath();c.moveTo(x+sd*r*0.15,y-r*0.92);c.quadraticCurveTo(x+sd*r*0.15,y-r*1.4,tx,ty);c.stroke();c.fillStyle=col;circ(c,tx,ty,r*0.09);c.fill()}},
  _shell(c,x,y,s,col){c.save();c.translate(x,y);c.rotate(0.3);const g=c.createLinearGradient(0,-s,0,s);g.addColorStop(0,mix(col,'#ffffff',0.5));g.addColorStop(1,col);c.fillStyle=g;c.beginPath();c.moveTo(0,s*0.8);c.lineTo(-s,-s*0.2);c.quadraticCurveTo(0,-s*1.3,s,-s*0.2);c.closePath();c.fill();c.strokeStyle=mix(col,'#000000',0.4);c.lineWidth=s*0.12;c.stroke();
    c.lineWidth=s*0.08;for(const q of[-0.6,-0.2,0.2,0.6]){c.beginPath();c.moveTo(0,s*0.75);c.lineTo(q*s*1.2,-s*0.55);c.stroke()}c.restore()},
  _horn(c,x,y,r,t,cols){const bx=x+r*0.05,by=y-r*0.8,tx=x+r*0.32,ty=y-r*1.75;c.save();c.shadowColor=cols[1];c.shadowBlur=r*0.3;const g=c.createLinearGradient(bx,by,tx,ty);g.addColorStop(0,cols[1]);g.addColorStop(1,cols[0]);c.fillStyle=g;
    c.beginPath();c.moveTo(bx-r*0.2,by);c.lineTo(tx,ty);c.lineTo(bx+r*0.2,by+r*0.04);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle=mix(cols[1],'#000000',0.35);c.lineWidth=r*0.035;c.stroke();
    c.lineWidth=r*0.03;for(let i=1;i<=4;i++){const q=i/5,px=bx+(tx-bx)*q,py=by+(ty-by)*q,w=r*0.2*(1-q);c.beginPath();c.moveTo(px-w,py+r*0.04);c.quadraticCurveTo(px,py-r*0.02,px+w,py-r*0.08);c.stroke()}
    c.fillStyle='rgba(255,255,255,.9)';const sp=(Math.sin(t*3)+1)/2;star(c,tx-r*0.05,ty+r*0.15,r*0.12*sp+0.5,r*0.03,4);c.restore()},
  _ghelm(c,x,y,r,cols,trim){c.fillStyle=cols[1];c.beginPath();c.moveTo(x-r*0.06,y-r*1.08);c.lineTo(x,y-r*1.52);c.lineTo(x+r*0.06,y-r*1.08);c.closePath();c.fill();
    dome(c,x,y,r,1.12,0.36,cols[0],cols[1],mix(cols[1],'#000000',0.5));
    c.fillStyle=trim;rrect(c,x-r*0.97,y-r*0.5,r*1.94,r*0.15,r*0.06);c.fill();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=r*0.03;c.stroke();
    c.strokeStyle=mix(cols[1],'#000000',0.3);c.lineWidth=r*0.03;for(const q of[-0.5,0,0.5]){c.beginPath();c.moveTo(x+q*r*0.9,y-r*0.52);c.quadraticCurveTo(x+q*r*0.55,y-r*0.95,x,y-r*1.1);c.stroke()}
    c.fillStyle='#ef4444';circ(c,x,y-r*0.43,r*0.07);c.fill();c.fillStyle=trim;circ(c,x,y-r*1.1,r*0.07);c.fill()},
  fluff(c,x,y,r){c.fillStyle='#f1f5f9';c.strokeStyle='#cbd5e1';c.lineWidth=r*0.03;for(let i=0;i<16;i++){const a=i/16*TAU+0.2;circ(c,x+Math.cos(a)*r*0.98,y+Math.sin(a)*r*0.98,r*0.2);c.fill();c.stroke()}},
  pearls(c,x,y,r){for(let i=0;i<9;i++){const a=Math.PI*(1.2+i*0.075),px=x+Math.cos(a)*r*0.86,py=y+Math.sin(a)*r*0.86;const g=c.createRadialGradient(px-r*0.03,py-r*0.03,1,px,py,r*0.08);g.addColorStop(0,'#fff');g.addColorStop(1,'#e2d6c8');c.fillStyle=g;circ(c,px,py,r*0.075);c.fill()}},
  starfish(c,x,y,r,t){c.save();c.translate(x-r*0.62,y-r*0.72);c.rotate(Math.sin(t)*0.1);c.fillStyle='#f97316';star(c,0,0,r*0.26,r*0.11,5);c.fillStyle='#fdba74';for(let i=0;i<5;i++){const a=i/5*TAU-Math.PI/2;circ(c,Math.cos(a)*r*0.12,Math.sin(a)*r*0.12,r*0.025);c.fill()}c.restore()},
  angler(c,x,y,r,t){c.strokeStyle='#1e293b';c.lineWidth=r*0.05;c.lineCap='round';c.beginPath();c.moveTo(x-r*0.1,y-r*0.92);c.quadraticCurveTo(x-r*0.2,y-r*1.6,x-r*0.62,y-r*1.45);c.stroke();c.save();c.shadowColor='#fde047';c.shadowBlur=r*0.6;c.fillStyle=`rgba(254,240,138,${0.75+Math.sin(t*5)*0.25})`;circ(c,x-r*0.66,y-r*1.38,r*0.12);c.fill();c.restore()},
  clouds(c,x,y,r,t){c.fillStyle='rgba(255,255,255,.95)';for(const [dx,dy,s0] of [[-0.95,0.55,0.32],[-0.65,0.85,0.3],[0.9,0.6,0.3],[0.6,0.9,0.28],[-0.25,1.0,0.26],[0.2,1.02,0.26]]){circ(c,x+dx*r,y+dy*r+Math.sin(t*2+dx)*r*0.03,s0*r);c.fill()}},
  goldWings(c,x,y,r,t){const fl=Math.sin(t*6)*0.15;for(const sd of[-1,1]){c.save();c.translate(x+sd*r*0.7,y-r*0.1);c.scale(sd,1);c.rotate(-0.4-fl);for(let i=0;i<5;i++){const g=c.createLinearGradient(0,0,r*1.2,0);g.addColorStop(0,'#fef3c7');g.addColorStop(1,'#f59e0b');c.fillStyle=g;c.beginPath();c.ellipse(r*(0.55-i*0.06),-r*0.25+i*r*0.13,r*(0.7-i*0.09),r*0.11,-0.3+i*0.1,0,TAU);c.fill();c.strokeStyle='rgba(146,64,14,.5)';c.lineWidth=r*0.02;c.stroke()}c.restore()}},
  wMorpho(c,x,y,r,t){PART._bwings(c,x,y,r,t,'#7dd3fc','#1d4ed8','#0f172a','#e0f2fe')},
  wLuna(c,x,y,r,t){PART._bwings(c,x,y,r,t,'#ecfccb','#84cc16','#3f6212','#fde047','#bef264')},
  wGlass(c,x,y,r,t){PART._bwings(c,x,y,r,t,'rgba(255,255,255,.25)','rgba(186,230,253,.35)','#334155','#f472b6',null,true)},
  hood(c,x,y,r){
    c.save();c.translate(x-r*0.45,y-r*0.95);c.rotate(-0.95);const fg=c.createLinearGradient(0,-r*0.8,0,0);fg.addColorStop(0,'#fecaca');fg.addColorStop(1,'#b91c1c');c.fillStyle=fg;c.beginPath();c.ellipse(0,-r*0.38,r*0.11,r*0.45,0,0,TAU);c.fill();c.strokeStyle='#7f1d1d';c.lineWidth=r*0.03;c.beginPath();c.moveTo(0,0);c.lineTo(0,-r*0.8);c.stroke();c.restore();
    const g=c.createLinearGradient(0,y-r*1.45,0,y-r*0.3);g.addColorStop(0,'#4ade80');g.addColorStop(1,'#166534');c.fillStyle=g;
    c.beginPath();c.moveTo(x-r*0.98,y-r*0.3);c.quadraticCurveTo(x-r*0.75,y-r*1.15,x+r*0.85,y-r*1.42);c.quadraticCurveTo(x+r*0.55,y-r*0.95,x+r*0.98,y-r*0.3);c.quadraticCurveTo(x,y-r*0.55,x-r*0.98,y-r*0.3);c.closePath();c.fill();c.strokeStyle='#052e16';c.lineWidth=r*0.05;c.stroke();
    c.fillStyle='#15803d';c.beginPath();c.moveTo(x-r*1.04,y-r*0.28);c.quadraticCurveTo(x,y-r*0.66,x+r*1.04,y-r*0.28);c.quadraticCurveTo(x,y-r*0.44,x-r*1.04,y-r*0.28);c.fill();c.stroke();
  },
  persianHelm(c,x,y,r){
    c.fillStyle='#dc2626';c.beginPath();c.moveTo(x,y-r*1.55);c.quadraticCurveTo(x-r*0.7,y-r*1.75,x-r*0.95,y-r*1.25);c.quadraticCurveTo(x-r*0.55,y-r*1.45,x,y-r*1.42);c.fill();
    c.fillStyle='#cbd5e1';c.strokeStyle='#334155';c.lineWidth=r*0.04;c.beginPath();c.moveTo(x-r*0.08,y-r*1.05);c.lineTo(x,y-r*1.62);c.lineTo(x+r*0.08,y-r*1.05);c.closePath();c.fill();c.stroke();
    dome(c,x,y,r,1.15,0.32,'#f1f5f9','#64748b','#1e293b');
    c.fillStyle='#fbbf24';rrect(c,x-r*0.98,y-r*0.46,r*1.96,r*0.16,r*0.06);c.fill();c.strokeStyle='#78350f';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#fbbf24';circ(c,x,y-r*1.1,r*0.1);c.fill();c.fillStyle='#ef4444';circ(c,x,y-r*0.38,r*0.07);c.fill();
  },
  mustache(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la);c.fillStyle='#1f1308';for(const sd of[-1,1]){c.beginPath();c.moveTo(fx,fy+r*0.12);c.quadraticCurveTo(fx+sd*r*0.25,fy+r*0.02,fx+sd*r*0.46,fy+r*0.18);c.quadraticCurveTo(fx+sd*r*0.55,fy+r*0.3,fx+sd*r*0.4,fy+r*0.26);c.quadraticCurveTo(fx+sd*r*0.22,fy+r*0.24,fx,fy+r*0.22);c.closePath();c.fill()}},
  ninja(c,x,y,r){
    c.save();c.strokeStyle='#dc2626';c.lineWidth=r*0.12;c.lineCap='round';for(const o of[0,0.18]){c.beginPath();c.moveTo(x+r*0.85,y-r*0.45);c.quadraticCurveTo(x+r*1.3,y-r*(0.6-o),x+r*1.5,y-r*(0.2-o*2));c.stroke()}c.restore();
    c.save();circ(c,x,y,r);c.clip();c.fillStyle='#dc2626';c.fillRect(x-r,y-r*0.6,2*r,r*0.17);c.fillStyle='#18181b';c.fillRect(x-r,y+r*0.12,2*r,r);c.strokeStyle='rgba(255,255,255,.1)';c.lineWidth=r*0.03;c.beginPath();c.moveTo(x-r,y+r*0.35);c.lineTo(x+r,y+r*0.3);c.stroke();c.restore();
  },
  viking(c,x,y,r){
    for(const sd of[-1,1]){const g=c.createLinearGradient(x+sd*r*0.7,y-r*0.6,x+sd*r*1.3,y-r*1.4);g.addColorStop(0,'#e7e5e4');g.addColorStop(1,'#fef3c7');c.fillStyle=g;c.beginPath();c.moveTo(x+sd*r*0.72,y-r*0.55);c.quadraticCurveTo(x+sd*r*1.45,y-r*0.65,x+sd*r*1.3,y-r*1.45);c.quadraticCurveTo(x+sd*r*1.12,y-r*0.88,x+sd*r*0.66,y-r*0.85);c.closePath();c.fill();c.strokeStyle='#57534e';c.lineWidth=r*0.04;c.stroke()}
    dome(c,x,y,r,1.12,0.32,'#e2e8f0','#64748b','#1e293b');
    c.fillStyle='#78716c';rrect(c,x-r*0.98,y-r*0.45,r*1.96,r*0.14,r*0.05);c.fill();c.fillStyle='#d6d3d1';for(let i=-4;i<=4;i++){circ(c,x+i*r*0.2,y-r*0.38,r*0.035);c.fill()}
    c.fillStyle='#94a3b8';rrect(c,x-r*0.07,y-r*0.42,r*0.14,r*0.42,r*0.04);c.fill();c.strokeStyle='#1e293b';c.lineWidth=r*0.03;c.stroke();
  },
  beardOrange(c,x,y,r,t,la){PART._beard(c,x,y,r,la,'#ea580c','#9a3412',true)},
  whiteBeard(c,x,y,r,t,la){PART._beard(c,x,y,r,la,'#f8fafc','#94a3b8',false)},
  _beard(c,x,y,r,la,a,b,braid){const {fx,fy}=faceXY(x,y,r,la);const g=c.createLinearGradient(0,fy+r*0.2,0,fy+r*1.3);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;
    c.beginPath();c.moveTo(fx-r*0.62,fy+r*0.1);c.quadraticCurveTo(fx-r*0.6,fy+r*0.9,fx,fy+r*1.3);c.quadraticCurveTo(fx+r*0.6,fy+r*0.9,fx+r*0.62,fy+r*0.1);c.quadraticCurveTo(fx+r*0.3,fy+r*0.42,fx,fy+r*0.36);c.quadraticCurveTo(fx-r*0.3,fy+r*0.42,fx-r*0.62,fy+r*0.1);c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=r*0.04;c.stroke();
    c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=r*0.03;for(const o of[-0.3,0,0.3]){c.beginPath();c.moveTo(fx+o*r,fy+r*0.45);c.quadraticCurveTo(fx+o*r*1.2,fy+r*0.8,fx+o*r*0.6,fy+r*1.1);c.stroke()}
    if(braid){c.fillStyle='#fbbf24';for(const sd of[-1,1]){circ(c,fx+sd*r*0.25,fy+r*0.95,r*0.06);c.fill()}}
    c.fillStyle=a;for(const sd of[-1,1]){c.beginPath();c.moveTo(fx,fy+r*0.14);c.quadraticCurveTo(fx+sd*r*0.3,fy+r*0.04,fx+sd*r*0.5,fy+r*0.22);c.quadraticCurveTo(fx+sd*r*0.25,fy+r*0.28,fx,fy+r*0.24);c.fill()}},
  spartan(c,x,y,r){
    c.fillStyle='#dc2626';c.beginPath();c.moveTo(x-r*0.95,y-r*0.95);c.quadraticCurveTo(x,y-r*1.95,x+r*0.95,y-r*0.95);c.quadraticCurveTo(x,y-r*1.45,x-r*0.95,y-r*0.95);c.fill();c.strokeStyle='#7f1d1d';c.lineWidth=r*0.03;for(let i=-6;i<=6;i++){c.beginPath();c.moveTo(x+i*r*0.12,y-r*1.18);c.lineTo(x+i*r*0.14,y-r*(1.45-Math.abs(i)*0.05));c.stroke()}
    dome(c,x,y,r,1.1,0.28,'#fcd34d','#a16207','#422006');
    for(const sd of[-1,1]){c.beginPath();c.moveTo(x+sd*r*0.97,y-r*0.3);c.lineTo(x+sd*r*0.86,y+r*0.42);c.lineTo(x+sd*r*0.56,y+r*0.32);c.lineTo(x+sd*r*0.62,y-r*0.3);c.closePath();c.fillStyle='#ca8a04';c.fill();c.strokeStyle='#422006';c.lineWidth=r*0.04;c.stroke()}
    c.fillStyle='#a16207';rrect(c,x-r*0.07,y-r*0.38,r*0.14,r*0.4,r*0.04);c.fill();
  },
  cape(c,x,y,r){for(const sd of[-1,1]){c.fillStyle='#0f0f14';c.beginPath();c.moveTo(x+sd*r*0.3,y+r*0.75);c.lineTo(x+sd*r*1.3,y-r*1.2);c.quadraticCurveTo(x+sd*r*1.15,y-r*0.2,x+sd*r*0.1,y+r*0.95);c.closePath();c.fill();
    c.fillStyle='#b91c1c';c.beginPath();c.moveTo(x+sd*r*0.35,y+r*0.6);c.lineTo(x+sd*r*1.15,y-r*0.95);c.quadraticCurveTo(x+sd*r*1.0,y-r*0.2,x+sd*r*0.2,y+r*0.8);c.closePath();c.fill()}},
  widowHair(c,x,y,r){c.save();circ(c,x,y,r*1.02);c.clip();c.fillStyle='#111827';c.beginPath();c.moveTo(x-r*1.05,y-r*0.05);c.bezierCurveTo(x-r*1.1,y-r*1.3,x+r*1.1,y-r*1.3,x+r*1.05,y-r*0.05);c.lineTo(x+r*0.55,y-r*0.42);c.lineTo(x,y-r*0.22);c.lineTo(x-r*0.55,y-r*0.42);c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=r*0.05;c.beginPath();c.arc(x-r*0.1,y-r*0.2,r*0.65,Math.PI*1.2,Math.PI*1.5);c.stroke();c.restore()},
  snakesSh(c,x,y,r,t){for(const sd of[-1,1]){const w=Math.sin(t*3+sd)*r*0.1,hx=x+sd*r*1.2,hy=y-r*0.8+w;
    for(const [lw,col] of [[r*0.26,'#14532d'],[r*0.18,'#4ade80']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(x+sd*r*0.5,y+r*0.85);c.quadraticCurveTo(x+sd*r*1.55,y+r*0.25,hx,hy);c.stroke()}
    c.fillStyle='#22c55e';c.beginPath();c.ellipse(hx+sd*r*0.08,hy-r*0.06,r*0.2,r*0.14,sd*0.4,0,TAU);c.fill();c.strokeStyle='#14532d';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#fde047';circ(c,hx+sd*r*0.12,hy-r*0.1,r*0.04);c.fill();c.strokeStyle='#ef4444';c.lineWidth=r*0.03;c.beginPath();c.moveTo(hx+sd*r*0.26,hy-r*0.04);c.lineTo(hx+sd*r*0.4,hy);c.stroke()}},
  snakeHair(c,x,y,r,t){for(let i=0;i<8;i++){const a=-Math.PI*0.92+i*Math.PI*0.84/7,bx=x+Math.cos(a)*r*0.85,by=y+Math.sin(a)*r*0.85,ex=x+Math.cos(a)*r*1.42,ey=y+Math.sin(a)*r*1.42,w=Math.sin(t*4+i)*r*0.12;
    for(const [lw,col] of [[r*0.17,'#14532d'],[r*0.11,'#84cc16']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo((bx+ex)/2-Math.sin(a)*w,(by+ey)/2+Math.cos(a)*w,ex,ey);c.stroke()}
    c.fillStyle='#65a30d';circ(c,ex,ey,r*0.1);c.fill();c.fillStyle='#fef08a';circ(c,ex+Math.cos(a)*r*0.03,ey+Math.sin(a)*r*0.03,r*0.03);c.fill()}},
  crownGold(c,x,y,r){PART._crown(c,x,y,r,'#fde047','#b45309')},
  crownSilver(c,x,y,r){PART._crown(c,x,y,r,'#f1f5f9','#64748b')},
  _crown(c,x,y,r,a,b){const g=c.createLinearGradient(0,y-r*1.3,0,y-r*0.7);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.beginPath();c.moveTo(x-r*0.58,y-r*0.7);
    const pts=[[-0.58,-1.2],[-0.35,-0.95],[-0.18,-1.32],[0,-1.0],[0.18,-1.32],[0.35,-0.95],[0.58,-1.2],[0.58,-0.7]];pts.forEach(([px,py])=>c.lineTo(x+px*r,y+py*r));c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=r*0.04;c.stroke();
    c.fillStyle='#ef4444';circ(c,x,y-r*0.82,r*0.08);c.fill();c.fillStyle='#3b82f6';for(const sd of[-1,1]){circ(c,x+sd*r*0.34,y-r*0.82,r*0.06);c.fill()}
    c.fillStyle='#fff';for(const px of [-0.58,-0.18,0.18,0.58]){circ(c,x+px*r,y-r*(px===-0.58||px===0.58?1.2:1.32),r*0.05);c.fill()}},
  knight(c,x,y,r){
    c.fillStyle='#dc2626';for(let i=0;i<4;i++){c.beginPath();c.ellipse(x-r*0.2-i*r*0.12,y-r*1.2+i*r*0.05,r*0.12,r*0.4,-0.9-i*0.15,0,TAU);c.fill()}
    dome(c,x,y,r,1.14,0.28,'#f8fafc','#64748b','#1e293b');
    c.fillStyle='#475569';rrect(c,x-r*0.9,y-r*0.68,r*1.8,r*0.26,r*0.1);c.fill();c.strokeStyle='#1e293b';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#0f172a';for(let i=-3;i<=3;i++){rrect(c,x+i*r*0.2-r*0.05,y-r*0.6,r*0.1,r*0.1,r*0.03);c.fill()}
    c.fillStyle='#cbd5e1';for(const sd of[-1,1]){circ(c,x+sd*r*0.9,y-r*0.3,r*0.08);c.fill()}},
  kabuto(c,x,y,r){
    for(const sd of[-1,1]){c.beginPath();c.moveTo(x+sd*r*0.85,y-r*0.5);c.lineTo(x+sd*r*1.28,y-r*0.12);c.lineTo(x+sd*r*1.1,y+r*0.02);c.lineTo(x+sd*r*0.82,y-r*0.28);c.closePath();c.fillStyle='#7f1d1d';c.fill();c.strokeStyle='#fbbf24';c.lineWidth=r*0.04;c.stroke()}
    dome(c,x,y,r,1.1,0.38,'#3f3f46','#09090b','#000');
    c.strokeStyle='#fbbf24';c.lineWidth=r*0.04;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(x+i*r*0.25,y-r*0.42);c.lineTo(x+i*r*0.15,y-r*1.0);c.stroke()}
    c.fillStyle='#fbbf24';c.beginPath();c.moveTo(x,y-r*0.95);c.quadraticCurveTo(x-r*0.55,y-r*1.1,x-r*0.75,y-r*1.7);c.quadraticCurveTo(x-r*0.4,y-r*1.25,x,y-r*1.18);c.quadraticCurveTo(x+r*0.4,y-r*1.25,x+r*0.75,y-r*1.7);c.quadraticCurveTo(x+r*0.55,y-r*1.1,x,y-r*0.95);c.fill();c.strokeStyle='#92400e';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#ef4444';circ(c,x,y-r*1.02,r*0.08);c.fill()},
  band(c,x,y,r){c.save();circ(c,x,y,r);c.clip();c.fillStyle='#dc2626';c.fillRect(x-r,y-r*0.66,2*r,r*0.2);c.fillStyle='#fff';for(let i=-4;i<=4;i++){circ(c,x+i*r*0.24,y-r*0.56,r*0.035);c.fill()}c.restore();
    c.strokeStyle='#dc2626';c.lineWidth=r*0.1;c.lineCap='round';c.beginPath();c.moveTo(x-r*0.9,y-r*0.55);c.quadraticCurveTo(x-r*1.3,y-r*0.5,x-r*1.4,y-r*0.1);c.stroke()},
  witchHat(c,x,y,r){const g=c.createLinearGradient(0,y-r*2,0,y-r*0.6);g.addColorStop(0,'#6d28d9');g.addColorStop(1,'#2e1065');c.fillStyle=g;
    c.beginPath();c.ellipse(x,y-r*0.66,r*1.3,r*0.22,0,0,TAU);c.fill();c.strokeStyle='#1e0a3c';c.lineWidth=r*0.04;c.stroke();
    c.beginPath();c.moveTo(x-r*0.6,y-r*0.72);c.quadraticCurveTo(x-r*0.2,y-r*1.5,x+r*0.2,y-r*1.75);c.quadraticCurveTo(x+r*0.55,y-r*1.95,x+r*0.75,y-r*1.7);c.quadraticCurveTo(x+r*0.4,y-r*1.6,x+r*0.6,y-r*0.72);c.closePath();c.fill();c.stroke();
    c.fillStyle='#16a34a';c.fillRect(x-r*0.6,y-r*0.92,r*1.2,r*0.16);c.fillStyle='#fbbf24';c.strokeStyle='#fbbf24';c.lineWidth=r*0.04;c.strokeRect(x-r*0.12,y-r*0.93,r*0.24,r*0.18)},
  stitches(c,x,y,r){c.save();circ(c,x,y,r);c.clip();c.strokeStyle='#1c1917';c.lineWidth=r*0.05;c.lineCap='round';
    c.beginPath();c.moveTo(x-r*0.8,y-r*0.7);c.lineTo(x-r*0.15,y-r*0.45);c.stroke();for(let i=0;i<5;i++){const px=x-r*0.75+i*r*0.15,py=y-r*0.68+i*r*0.055;c.beginPath();c.moveTo(px,py-r*0.07);c.lineTo(px,py+r*0.07);c.stroke()}
    c.beginPath();c.moveTo(x+r*0.6,y+r*0.2);c.lineTo(x+r*0.75,y+r*0.75);c.stroke();for(let i=0;i<4;i++){const py=y+r*0.25+i*r*0.15,px=x+r*0.6+i*r*0.04;c.beginPath();c.moveTo(px-r*0.07,py);c.lineTo(px+r*0.07,py);c.stroke()}c.restore()},
  carrot(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la);const g=c.createLinearGradient(fx,fy,fx+r*0.6,fy);g.addColorStop(0,'#f97316');g.addColorStop(1,'#fdba74');c.fillStyle=g;c.beginPath();c.moveTo(fx-r*0.02,fy-r*0.02);c.lineTo(fx+r*0.62,fy+r*0.1);c.lineTo(fx-r*0.02,fy+r*0.16);c.closePath();c.fill();c.strokeStyle='#9a3412';c.lineWidth=r*0.025;c.stroke()},
  topHat(c,x,y,r){c.fillStyle='#111827';c.beginPath();c.ellipse(x,y-r*0.78,r*0.72,r*0.13,0,0,TAU);c.fill();rrect(c,x-r*0.45,y-r*1.6,r*0.9,r*0.85,r*0.06);c.fill();c.fillStyle='#dc2626';c.fillRect(x-r*0.45,y-r*0.98,r*0.9,r*0.14);c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=r*0.04;c.beginPath();c.moveTo(x-r*0.3,y-r*1.5);c.lineTo(x-r*0.3,y-r*1.05);c.stroke()},
  fur(c,x,y,r,t){c.fillStyle='#f8fafc';c.strokeStyle='#cbd5e1';c.lineWidth=r*0.03;for(let i=0;i<22;i++){const a=i/22*TAU+0.1,w=0.14;c.beginPath();c.moveTo(x+Math.cos(a-w)*r*0.95,y+Math.sin(a-w)*r*0.95);c.lineTo(x+Math.cos(a)*r*1.22,y+Math.sin(a)*r*1.22);c.lineTo(x+Math.cos(a+w)*r*0.95,y+Math.sin(a+w)*r*0.95);c.closePath();c.fill();c.stroke()}},
  tiara(c,x,y,r){c.save();c.shadowColor='#a5f3fc';c.shadowBlur=r*0.3;for(let i=-2;i<=2;i++){const h=r*(0.32-Math.abs(i)*0.08),px=x+i*r*0.22,py=y-r*0.82+Math.abs(i)*r*0.06;c.fillStyle=i===0?'#e0f2fe':'#a5f3fc';c.beginPath();c.moveTo(px,py-h);c.lineTo(px+r*0.08,py);c.lineTo(px,py+r*0.06);c.lineTo(px-r*0.08,py);c.closePath();c.fill()}c.restore();c.strokeStyle='#e0f2fe';c.lineWidth=r*0.05;c.beginPath();c.arc(x,y+r*0.3,r*1.15,Math.PI*1.33,Math.PI*1.67);c.stroke()},
  tricorn(c,x,y,r){c.fillStyle='#1c1917';c.beginPath();c.moveTo(x-r*1.2,y-r*0.58);c.quadraticCurveTo(x-r*0.65,y-r*1.5,x,y-r*1.25);c.quadraticCurveTo(x+r*0.65,y-r*1.5,x+r*1.2,y-r*0.58);c.quadraticCurveTo(x+r*0.5,y-r*0.75,x,y-r*0.45);c.quadraticCurveTo(x-r*0.5,y-r*0.75,x-r*1.2,y-r*0.58);c.closePath();c.fill();c.strokeStyle='#fbbf24';c.lineWidth=r*0.05;c.stroke();
    c.fillStyle='#f5f5f4';circ(c,x,y-r*0.88,r*0.13);c.fill();c.fillStyle='#1c1917';for(const sd of[-1,1]){circ(c,x+sd*r*0.05,y-r*0.9,r*0.03);c.fill()}c.strokeStyle='#f5f5f4';c.lineWidth=r*0.04;c.beginPath();c.moveTo(x-r*0.2,y-r*0.62);c.lineTo(x+r*0.2,y-r*0.74);c.moveTo(x+r*0.2,y-r*0.62);c.lineTo(x-r*0.2,y-r*0.74);c.stroke()},
  eyepatch(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la);c.strokeStyle='#0c0a09';c.lineWidth=r*0.05;c.beginPath();c.moveTo(x-r*0.98,y-r*0.45);c.lineTo(x+r*0.95,y+r*0.05);c.stroke();c.fillStyle='#0c0a09';c.beginPath();c.ellipse(fx-r*0.3,fy-r*0.1,r*0.19,r*0.17,0,0,TAU);c.fill()},
  spaceHelm(c,x,y,r){c.save();c.fillStyle='rgba(186,230,253,.18)';circ(c,x,y-r*0.04,r*1.2);c.fill();c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=r*0.06;c.stroke();c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=r*0.08;c.beginPath();c.arc(x,y-r*0.04,r*1.03,Math.PI*1.15,Math.PI*1.45);c.stroke();c.restore();
    c.fillStyle='#cbd5e1';rrect(c,x-r*0.75,y+r*1.0,r*1.5,r*0.22,r*0.1);c.fill();c.strokeStyle='#475569';c.lineWidth=r*0.04;c.stroke();c.strokeStyle='#94a3b8';c.lineWidth=r*0.05;c.beginPath();c.moveTo(x+r*0.6,y-r*0.95);c.lineTo(x+r*0.8,y-r*1.4);c.stroke();c.fillStyle='#ef4444';circ(c,x+r*0.8,y-r*1.43,r*0.08);c.fill()},
  hardHat(c,x,y,r,t){c.fillStyle='#facc15';c.beginPath();c.ellipse(x,y-r*0.5,r*1.12,r*0.14,0,0,TAU);c.fill();c.strokeStyle='#713f12';c.lineWidth=r*0.04;c.stroke();dome(c,x,y,r,1.18,0.5,'#fde047','#ca8a04','#713f12');
    c.fillStyle='#713f12';c.fillRect(x-r*0.05,y-r*1.15,r*0.1,r*0.62);c.fillStyle='#e5e7eb';circ(c,x,y-r*0.78,r*0.14);c.fill();c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(x,y-r*0.78,1,x,y-r*0.78,r*0.6);g.addColorStop(0,'rgba(255,250,200,.85)');g.addColorStop(1,'rgba(255,250,200,0)');c.fillStyle=g;circ(c,x,y-r*0.78,r*0.6);c.fill();c.restore()},
  laurel(c,x,y,r){c.fillStyle='#4d7c0f';c.strokeStyle='#365314';c.lineWidth=r*0.02;for(const sd of[-1,1])for(let i=0;i<6;i++){const a=Math.PI*1.5+sd*(0.15+i*0.2),px=x+Math.cos(a)*r*0.92,py=y+Math.sin(a)*r*0.92;c.save();c.translate(px,py);c.rotate(a+sd*0.9);c.beginPath();c.ellipse(0,0,r*0.16,r*0.07,0,0,TAU);c.fillStyle=i%2?'#65a30d':'#84cc16';c.fill();c.stroke();c.restore()}},
  wizardHat(c,x,y,r){const g=c.createLinearGradient(0,y-r*2.1,0,y-r*0.6);g.addColorStop(0,'#3b82f6');g.addColorStop(1,'#1e3a8a');c.fillStyle=g;c.beginPath();c.ellipse(x,y-r*0.66,r*1.2,r*0.2,0,0,TAU);c.fill();c.strokeStyle='#172554';c.lineWidth=r*0.04;c.stroke();
    c.beginPath();c.moveTo(x-r*0.62,y-r*0.72);c.quadraticCurveTo(x-r*0.3,y-r*1.6,x-r*0.55,y-r*2.05);c.quadraticCurveTo(x+r*0.1,y-r*1.6,x+r*0.62,y-r*0.72);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fde047';star(c,x-r*0.15,y-r*1.15,r*0.14,r*0.05,5);star(c,x+r*0.25,y-r*0.92,r*0.09,r*0.035,5);star(c,x-r*0.35,y-r*1.55,r*0.08,r*0.03,5)},
  robot(c,x,y,r,t){c.strokeStyle='#64748b';c.lineWidth=r*0.06;c.beginPath();c.moveTo(x,y-r*0.95);c.lineTo(x,y-r*1.42);c.stroke();c.fillStyle=Math.sin(t*6)>0?'#ef4444':'#7f1d1d';circ(c,x,y-r*1.48,r*0.1);c.fill();
    for(const sd of[-1,1]){c.fillStyle='#94a3b8';circ(c,x+sd*r*1.02,y,r*0.16);c.fill();c.strokeStyle='#334155';c.lineWidth=r*0.04;c.stroke();c.beginPath();c.moveTo(x+sd*r*1.02-r*0.08,y);c.lineTo(x+sd*r*1.02+r*0.08,y);c.stroke()}
    c.save();circ(c,x,y,r);c.clip();c.strokeStyle='rgba(15,23,42,.4)';c.lineWidth=r*0.03;c.beginPath();c.moveTo(x-r,y+r*0.55);c.lineTo(x+r,y+r*0.55);c.stroke();c.fillStyle='#334155';for(let i=-3;i<=3;i++){circ(c,x+i*r*0.25,y+r*0.68,r*0.035);c.fill()}c.restore()},
  jester(c,x,y,r){const cols=['#7e22ce','#dc2626','#7e22ce'];[-1,0,1].forEach((i,n)=>{c.fillStyle=cols[n];c.beginPath();c.moveTo(x+i*r*0.45-r*0.3,y-r*0.72);c.quadraticCurveTo(x+i*r*0.6,y-r*1.6,x+i*r*1.05,y-r*(1.25+(i?0:0.45)));c.quadraticCurveTo(x+i*r*0.55,y-r*1.15,x+i*r*0.45+r*0.3,y-r*0.72);c.closePath();c.fill();c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#fbbf24';circ(c,x+i*r*1.05,y-r*(1.25+(i?0:0.45)),r*0.1);c.fill()});c.fillStyle='#fbbf24';rrect(c,x-r*0.85,y-r*0.82,r*1.7,r*0.16,r*0.06);c.fill()},
  afro(c,x,y,r){c.fillStyle='#1f1308';for(let i=0;i<13;i++){const a=Math.PI*(1.0+i/12),rr=r*(0.95+(i%2)*0.08);circ(c,x+Math.cos(a)*rr,y+Math.sin(a)*rr*0.95-r*0.12,r*0.36);c.fill()}circ(c,x,y-r*0.7,r*0.6);c.fill()},
  shades(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la),ey=fy-r*0.1;c.fillStyle='#0b0b12';for(const sd of[-1,1]){rrect(c,fx+sd*r*0.3-r*0.24,ey-r*0.14,r*0.48,r*0.3,r*0.1);c.fill()}c.strokeStyle='#0b0b12';c.lineWidth=r*0.06;c.beginPath();c.moveTo(fx-r*0.08,ey-r*0.04);c.lineTo(fx+r*0.08,ey-r*0.04);c.stroke();
    c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=r*0.04;for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.3-r*0.14,ey-r*0.06);c.lineTo(fx+sd*r*0.3-r*0.04,ey-r*0.1);c.stroke()}},
  stem(c,x,y,r){c.fillStyle='#3f6212';rrect(c,x-r*0.08,y-r*1.22,r*0.16,r*0.32,r*0.05);c.fill();c.fillStyle='#65a30d';c.beginPath();c.ellipse(x+r*0.22,y-r*1.08,r*0.2,r*0.09,-0.4,0,TAU);c.fill()},
  turban(c,x,y,r){c.fillStyle='#f5f5f4';c.beginPath();c.ellipse(x,y-r*0.72,r*0.95,r*0.55,0,Math.PI,0);c.closePath();c.fill();c.strokeStyle='#a8a29e';c.lineWidth=r*0.04;c.stroke();
    for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y-r*(0.75+i*0.12),r*(0.9-i*0.15),r*0.18,-0.15+i*0.1,Math.PI*1.05,Math.PI*1.95);c.stroke()}
    c.fillStyle='#dc2626';circ(c,x,y-r*0.86,r*0.12);c.fill();c.fillStyle='#fbbf24';circ(c,x,y-r*0.86,r*0.05);c.fill();c.fillStyle='#38bdf8';c.beginPath();c.ellipse(x+r*0.1,y-r*1.25,r*0.08,r*0.3,0.3,0,TAU);c.fill()},
  mane(c,x,y,r){c.fillStyle='#f59e0b';for(let i=0;i<9;i++){const a=Math.PI*(1.05+i*0.11);c.beginPath();c.moveTo(x+Math.cos(a-0.12)*r*0.9,y+Math.sin(a-0.12)*r*0.9);c.lineTo(x+Math.cos(a)*r*1.35,y+Math.sin(a)*r*1.35);c.lineTo(x+Math.cos(a+0.12)*r*0.9,y+Math.sin(a+0.12)*r*0.9);c.closePath();c.fill()}},
  whiskers(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la);c.strokeStyle='#fbbf24';c.lineWidth=r*0.05;c.lineCap='round';for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.25,fy+r*0.12);c.bezierCurveTo(fx+sd*r*0.9,fy+r*0.05,fx+sd*r*1.0,fy+r*0.6+Math.sin(t*3)*r*0.08,fx+sd*r*1.45,fy+r*0.45);c.stroke()}},
  ridge(c,x,y,r){c.fillStyle='#1a2e05';for(let i=0;i<7;i++){const a=Math.PI*(1.15+i*0.117);c.beginPath();c.moveTo(x+Math.cos(a-0.1)*r*0.92,y+Math.sin(a-0.1)*r*0.92);c.lineTo(x+Math.cos(a)*r*1.4,y+Math.sin(a)*r*1.4);c.lineTo(x+Math.cos(a+0.1)*r*0.92,y+Math.sin(a+0.1)*r*0.92);c.closePath();c.fill()}},
  flower(c,x,y,r){for(let i=0;i<5;i++){const a=i/5*TAU;c.fillStyle='#f472b6';c.beginPath();c.ellipse(x+Math.cos(a)*r*0.14,y-r*0.98+Math.sin(a)*r*0.14,r*0.13,r*0.08,a,0,TAU);c.fill()}c.fillStyle='#fde047';circ(c,x,y-r*0.98,r*0.08);c.fill()},
  mohawk(c,x,y,r){for(let i=0;i<5;i++){const px=x+(i-2)*r*0.15,h=r*(1.5-Math.abs(i-2)*0.12);c.fillStyle=i%2?'#f472b6':'#ec4899';c.beginPath();c.moveTo(px-r*0.12,y-r*0.8);c.lineTo(px+r*0.04,y-h);c.lineTo(px+r*0.12,y-r*0.8);c.closePath();c.fill()}},
  earring(c,x,y,r){c.strokeStyle='#fbbf24';c.lineWidth=r*0.05;circ(c,x+r*0.98,y+r*0.15,r*0.11);c.stroke()},
  leaves(c,x,y,r){for(let i=0;i<7;i++){const a=-Math.PI/2+(i-3)*0.28,h=r*(0.75-Math.abs(i-3)*0.1);c.fillStyle=i%2?'#16a34a':'#22c55e';c.beginPath();c.moveTo(x+(i-3)*r*0.05-r*0.08,y-r*0.85);c.quadraticCurveTo(x+Math.cos(a)*h*0.8,y-r*0.85+Math.sin(a)*h*0.6,x+Math.cos(a)*h,y-r*0.85+Math.sin(a)*h);c.quadraticCurveTo(x+Math.cos(a)*h*0.6,y-r*0.85+Math.sin(a)*h*0.5,x+(i-3)*r*0.05+r*0.08,y-r*0.85);c.fill()}},
  sikke(c,x,y,r){const g=c.createLinearGradient(x-r*0.4,0,x+r*0.4,0);g.addColorStop(0,'#78523a');g.addColorStop(0.5,'#a8795a');g.addColorStop(1,'#6b4630');c.fillStyle=g;c.beginPath();c.moveTo(x-r*0.42,y-r*0.72);c.lineTo(x-r*0.32,y-r*1.75);c.quadraticCurveTo(x,y-r*1.88,x+r*0.32,y-r*1.75);c.lineTo(x+r*0.42,y-r*0.72);c.closePath();c.fill();c.strokeStyle='#3b2416';c.lineWidth=r*0.04;c.stroke();
    c.fillStyle='#3b2416';c.fillRect(x-r*0.43,y-r*0.86,r*0.86,r*0.1)},
  hibiscus(c,x,y,r){for(let i=0;i<5;i++){const a=i/5*TAU;c.fillStyle='#f43f5e';c.beginPath();c.ellipse(x-r*0.78+Math.cos(a)*r*0.13,y-r*0.6+Math.sin(a)*r*0.13,r*0.14,r*0.08,a,0,TAU);c.fill()}c.fillStyle='#fde047';circ(c,x-r*0.78,y-r*0.6,r*0.05);c.fill()},
  desertTurban(c,x,y,r){c.fillStyle='#d6a35c';c.beginPath();c.ellipse(x,y-r*0.7,r*0.98,r*0.5,0,Math.PI,0);c.closePath();c.fill();c.strokeStyle='#7c4a1a';c.lineWidth=r*0.04;c.stroke();for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y-r*(0.72+i*0.12),r*(0.92-i*0.15),r*0.16,0.2-i*0.12,Math.PI*1.05,Math.PI*1.95);c.stroke()}
    c.fillStyle='#d6a35c';c.beginPath();c.moveTo(x+r*0.8,y-r*0.6);c.quadraticCurveTo(x+r*1.3,y-r*0.2,x+r*1.15,y+r*0.5);c.lineTo(x+r*0.95,y+r*0.35);c.quadraticCurveTo(x+r*1.05,y-r*0.1,x+r*0.7,y-r*0.45);c.closePath();c.fill();c.stroke()},
  simorgh(c,x,y,r,t){const cols=['#2dd4bf','#facc15','#a855f7','#f43f5e','#22c55e'];for(let i=0;i<9;i++){const a=Math.PI*(1.05+i*0.1125)+Math.sin(t*2+i)*0.03,L=r*(1.0+0.35*Math.sin(i/8*Math.PI));c.save();c.translate(x+Math.cos(a)*r*0.7,y+Math.sin(a)*r*0.7);c.rotate(a+Math.PI/2);
    c.fillStyle=cols[i%5];c.beginPath();c.ellipse(0,-L*0.5,r*0.17,L*0.55,0,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.85)';circ(c,0,-L*0.85,r*0.07);c.fill();c.fillStyle='#1e3a8a';circ(c,0,-L*0.85,r*0.035);c.fill();c.restore()}},
  sunRays(c,x,y,r,t){c.save();c.translate(x,y);c.rotate(t*0.5);c.fillStyle='#fbbf24';for(let i=0;i<14;i++){const a=i/14*TAU;c.beginPath();c.moveTo(Math.cos(a-0.12)*r*0.95,Math.sin(a-0.12)*r*0.95);c.lineTo(Math.cos(a)*r*(i%2?1.3:1.5),Math.sin(a)*r*(i%2?1.3:1.5));c.lineTo(Math.cos(a+0.12)*r*0.95,Math.sin(a+0.12)*r*0.95);c.closePath();c.fill()}c.restore()},
  divHorns(c,x,y,r){for(const sd of[-1,1]){const g=c.createLinearGradient(x+sd*r*0.5,y-r*0.8,x+sd*r*1.2,y-r*1.6);g.addColorStop(0,'#44403c');g.addColorStop(1,'#a8a29e');c.fillStyle=g;c.beginPath();c.moveTo(x+sd*r*0.35,y-r*0.85);c.quadraticCurveTo(x+sd*r*0.6,y-r*1.6,x+sd*r*1.15,y-r*1.55);c.quadraticCurveTo(x+sd*r*0.75,y-r*1.35,x+sd*r*0.68,y-r*0.7);c.closePath();c.fill();c.strokeStyle='#1c1917';c.lineWidth=r*0.03;c.stroke()}},
  runes(c,x,y,r,t){c.save();circ(c,x,y,r);c.clip();c.strokeStyle='#22d3ee';c.shadowColor='#22d3ee';c.shadowBlur=r*0.3;c.lineWidth=r*0.05;c.globalAlpha*=0.6+Math.sin(t*3)*0.3;c.lineCap='round';
    c.beginPath();c.moveTo(x-r*0.7,y+r*0.35);c.lineTo(x-r*0.5,y+r*0.6);c.lineTo(x-r*0.3,y+r*0.35);c.moveTo(x+r*0.35,y+r*0.6);c.lineTo(x+r*0.55,y+r*0.3);c.lineTo(x+r*0.75,y+r*0.6);c.moveTo(x-r*0.15,y-r*0.75);c.lineTo(x+r*0.15,y-r*0.75);c.moveTo(x,y-r*0.9);c.lineTo(x,y-r*0.6);c.stroke();c.restore()},
  moss(c,x,y,r){c.fillStyle='#4d7c0f';for(const [dx,dy,s0] of [[-0.4,-0.82,0.22],[0,-0.92,0.26],[0.38,-0.84,0.2],[-0.7,-0.5,0.14]]){circ(c,x+dx*r,y+dy*r,s0*r);c.fill()}},
  trollNose(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la);const g=c.createRadialGradient(fx-r*0.05,fy-r*0.02,1,fx,fy+r*0.05,r*0.25);g.addColorStop(0,'#bef264');g.addColorStop(1,'#4d7c0f');c.fillStyle=g;c.beginPath();c.ellipse(fx,fy+r*0.08,r*0.2,r*0.17,0,0,TAU);c.fill();c.strokeStyle='#365314';c.lineWidth=r*0.03;c.stroke();
    c.fillStyle='#fefce8';for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.18,fy+r*0.32);c.lineTo(fx+sd*r*0.22,fy+r*0.18);c.lineTo(fx+sd*r*0.26,fy+r*0.32);c.closePath();c.fill()}}
};
function skinPat(c,pat,r,t){
  if(pat==='none')return;
  if(pat==='tiger'){c.fillStyle='rgba(30,10,0,.55)';for(let i=0;i<7;i++){const yy=-r+i*r*0.32;c.beginPath();c.moveTo(-r,yy);c.quadraticCurveTo(-r*0.4,yy+r*0.12,0,yy+r*0.02);c.quadraticCurveTo(-r*0.3,yy+r*0.06,-r,yy+r*0.14);c.fill();c.beginPath();c.moveTo(r,yy+r*0.1);c.quadraticCurveTo(r*0.4,yy+r*0.22,r*0.05,yy+r*0.12);c.quadraticCurveTo(r*0.35,yy+r*0.18,r,yy+r*0.24);c.fill()}}
  else if(pat==='diamond'||pat==='pine'){c.strokeStyle=pat==='pine'?'rgba(120,53,15,.55)':'rgba(255,255,255,.35)';c.lineWidth=r*0.05;for(let i=-4;i<=4;i++){c.beginPath();c.moveTo(i*r*0.4-r,-r);c.lineTo(i*r*0.4+r,r);c.stroke();c.beginPath();c.moveTo(i*r*0.4+r,-r);c.lineTo(i*r*0.4-r,r);c.stroke()}
    if(pat==='diamond'){c.fillStyle='rgba(126,34,206,.45)';for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++)if((i+j)%2===0){const cx=i*r*0.4,cy=j*r*0.4;c.beginPath();c.moveTo(cx,cy-r*0.2);c.lineTo(cx+r*0.2,cy);c.lineTo(cx,cy+r*0.2);c.lineTo(cx-r*0.2,cy);c.closePath();c.fill()}}}
  else if(pat==='facets'){for(let i=-5;i<=5;i++)for(let j=-5;j<=5;j++){c.fillStyle=`rgba(255,255,255,${0.05+rnd(i*13+j)*0.45})`;c.fillRect(i*r*0.2,j*r*0.2,r*0.18,r*0.18)}}
  else if(pat==='bandage'){for(let i=-6;i<=6;i++){c.fillStyle=i%2?'rgba(120,110,80,.25)':'rgba(255,255,255,.25)';c.save();c.rotate(i%3?0.15:-0.2);c.fillRect(-r*1.2,i*r*0.18,r*2.4,r*0.11);c.restore()}}
  else if(pat==='ribs'){c.strokeStyle='rgba(124,45,18,.5)';c.lineWidth=r*0.06;for(const k of [-0.6,-0.25,0.25,0.6]){c.beginPath();c.ellipse(0,0,r*Math.abs(k),r,0,k<0?Math.PI*0.5:-Math.PI*0.5,k<0?Math.PI*1.5:Math.PI*0.5);c.stroke()}}
  else if(pat==='cactus'){c.strokeStyle='rgba(20,83,45,.6)';c.lineWidth=r*0.07;for(const k of [-0.55,0,0.55]){c.beginPath();c.moveTo(k*r,-r);c.lineTo(k*r,r);c.stroke()}c.fillStyle='#f0fdf4';for(let i=0;i<14;i++){circ(c,(rnd(i)-0.5)*r*1.8,(rnd(i+5)-0.5)*r*1.8,r*0.035);c.fill()}}
  else if(pat==='waves'){c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=r*0.06;for(let j=-2;j<=2;j++){c.beginPath();for(let i=0;i<=20;i++){const px=-r+i*r*0.1,py=j*r*0.4+Math.sin(i*0.9+t*2)*r*0.06;i?c.lineTo(px,py):c.moveTo(px,py)}c.stroke()}}
  else if(pat==='spots'){c.fillStyle='rgba(71,85,105,.35)';for(let i=0;i<9;i++){circ(c,(rnd(i+2)-0.5)*r*1.7,(rnd(i+7)-0.5)*r*1.7,r*(0.08+rnd(i)*0.1));c.fill()}}
  else if(pat==='sakura'){for(let i=0;i<8;i++){const px=(rnd(i+13)-0.5)*r*1.7,py=(rnd(i+19)-0.5)*r*1.7;c.fillStyle='rgba(244,114,182,.55)';for(let j=0;j<5;j++){const q=j/5*TAU;c.beginPath();c.ellipse(px+Math.cos(q)*r*0.07,py+Math.sin(q)*r*0.07,r*0.07,r*0.045,q,0,TAU);c.fill()}c.fillStyle='#fff';circ(c,px,py,r*0.025);c.fill()}}
  else if(pat==='stars'){c.fillStyle='#fff';for(let i=0;i<16;i++){circ(c,(rnd(i+3)-0.5)*r*1.9,(rnd(i+11)-0.5)*r*1.9,r*(0.02+rnd(i)*0.03));c.fill()}c.fillStyle='rgba(244,114,182,.3)';circ(c,r*0.3,r*0.2,r*0.5);c.fill()}
}
function pumpkinFace(c,x,y,r,t,la){const {fx,fy}=faceXY(x,y,r,la),gl=0.75+Math.sin(t*8)*0.2;c.save();c.fillStyle=`rgba(255,${180+Math.round(gl*50)},60,1)`;c.shadowColor='#fbbf24';c.shadowBlur=r*0.3;
  for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.42,fy+r*0.02);c.lineTo(fx+sd*r*0.15,fy+r*0.02);c.lineTo(fx+sd*r*0.28,fy-r*0.28);c.closePath();c.fill()}
  c.beginPath();c.moveTo(fx-r*0.5,fy+r*0.22);for(let i=0;i<=8;i++)c.lineTo(fx-r*0.5+i*r*0.125,fy+r*(i%2?0.3:0.22));c.lineTo(fx+r*0.4,fy+r*0.5);c.lineTo(fx-r*0.4,fy+r*0.5);c.closePath();c.fill();c.restore()}

