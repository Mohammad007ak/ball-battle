// Ported from prototype/ball-battle.html (lines 2421-2672). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
const SEED={};Object.keys(CLASSES).forEach((k,i)=>SEED[k]=i*1.37);
const FEM={fairy:1,mermaid:1,unicorn:1,gordafarid:1,butterfly:1};
function mix(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const A=p(a),B=p(b);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(',')})`}
function rnd(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function circ(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU)}
function star(c,x,y,R,rr,n){c.beginPath();for(let i=0;i<n*2;i++){const a=i/(n*2)*TAU-Math.PI/2,q=i%2?rr:R;i?c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q):c.moveTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}c.closePath();c.fill()}
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function horn(c,x,y,r,a,col,col2,len,bend){
  const bx=x+Math.cos(a)*r*0.8,by=y+Math.sin(a)*r*0.8,ta=a+bend*0.5,tx=x+Math.cos(ta)*r*(1+len),ty=y+Math.sin(ta)*r*(1+len),w=r*0.19,nx=-Math.sin(a),ny=Math.cos(a);
  const g=c.createLinearGradient(bx,by,tx,ty);g.addColorStop(0,col);g.addColorStop(1,col2);c.fillStyle=g;
  c.beginPath();c.moveTo(bx-nx*w,by-ny*w);
  c.quadraticCurveTo(x+Math.cos(a+bend*0.15)*r*(1+len*0.65)-nx*w*0.3,y+Math.sin(a+bend*0.15)*r*(1+len*0.65)-ny*w*0.3,tx,ty);
  c.quadraticCurveTo(x+Math.cos(a+bend*0.35)*r*(1+len*0.35)+nx*w*0.5,y+Math.sin(a+bend*0.35)*r*(1+len*0.35)+ny*w*0.5,bx+nx*w,by+ny*w);
  c.closePath();c.fill();
}
function pattern(c,k,r,t){
  switch(k){
  case 'archer':
    c.fillStyle='rgba(255,255,255,.16)';c.fillRect(-r,-r*0.2,2*r,r*0.4);
    c.fillStyle='rgba(10,40,90,.28)';c.fillRect(-r,-r*0.27,2*r,r*0.07);c.fillRect(-r,r*0.2,2*r,r*0.07);break;
  case 'rage':
    c.strokeStyle='rgba(255,214,120,.8)';c.lineWidth=r*0.07;c.lineCap='round';c.lineJoin='round';
    for(let i=0;i<5;i++){let a=i/5*TAU+0.4;c.beginPath();c.moveTo(Math.cos(a)*r*0.2,Math.sin(a)*r*0.2);
      for(let j=1;j<=3;j++){a+=(rnd(i*7+j)-0.5)*0.9;const rr=r*(0.2+j*0.28);c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.stroke()}break;
  case 'vampire':
    c.fillStyle='rgba(255,255,255,.09)';
    for(let i=0;i<6;i++){const a=i/6*TAU;c.save();c.translate(Math.cos(a)*r*0.6,Math.sin(a)*r*0.6);c.rotate(a+Math.PI/4);c.fillRect(-r*0.09,-r*0.09,r*0.18,r*0.18);c.restore()}break;
  case 'tank':
    c.fillStyle='rgba(20,30,45,.3)';c.fillRect(-r,-r*0.1,2*r,r*0.2);c.fillRect(-r*0.06,-r,r*0.12,2*r);
    c.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<8;i++){const a=i/8*TAU+0.2;circ(c,Math.cos(a)*r*0.78,Math.sin(a)*r*0.78,r*0.055);c.fill()}break;
  case 'poison':
    for(let i=0;i<7;i++){const a=rnd(i)*TAU,d=rnd(i+9)*r*0.75,sz=r*(0.08+rnd(i+20)*0.14);
      c.fillStyle='rgba(220,255,200,.35)';circ(c,Math.cos(a)*d,Math.sin(a)*d,sz);c.fill();c.strokeStyle='rgba(20,80,20,.35)';c.lineWidth=r*0.03;c.stroke()}break;
  case 'frost':
    c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=r*0.045;c.lineCap='round';
    for(let i=0;i<6;i++){const a=i/6*TAU,m=r*0.5;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);
      c.moveTo(Math.cos(a)*m,Math.sin(a)*m);c.lineTo(Math.cos(a+0.35)*m*1.35,Math.sin(a+0.35)*m*1.35);
      c.moveTo(Math.cos(a)*m,Math.sin(a)*m);c.lineTo(Math.cos(a-0.35)*m*1.35,Math.sin(a-0.35)*m*1.35);c.stroke()}break;
  case 'bomber':
    c.fillStyle='rgba(255,255,255,.08)';c.fillRect(-r,-r*0.55,2*r,r*0.18);
    c.fillStyle='rgba(255,90,60,.5)';circ(c,0,r*0.62,r*0.09);c.fill();break;
  case 'lightning':
    c.strokeStyle='#fde68a';c.lineWidth=r*0.17;c.lineJoin='miter';c.beginPath();c.moveTo(-r*1.1,0);
    for(let i=1;i<=7;i++)c.lineTo(-r*1.1+i*r/3,(i%2?-1:1)*r*0.2);c.stroke();
    c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=r*0.05;c.stroke();break;
  case 'mirror':
    for(let i=0;i<8;i++){const a0=i/8*TAU,a1=(i+1)/8*TAU;c.fillStyle=`rgba(255,255,255,${0.04+rnd(i+3)*0.32})`;
      c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a0)*r*1.05,Math.sin(a0)*r*1.05);c.lineTo(Math.cos(a1)*r*1.05,Math.sin(a1)*r*1.05);c.closePath();c.fill()}
    c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=r*0.025;
    for(let i=0;i<8;i++){const a=i/8*TAU;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);c.stroke()}
    c.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU;i?c.lineTo(Math.cos(a)*r*0.5,Math.sin(a)*r*0.5):c.moveTo(r*0.5,0)}c.closePath();c.stroke();break;
  case 'ghost':
    c.fillStyle='rgba(255,255,255,.2)';circ(c,-r*0.25,r*0.3,r*0.38);c.fill();circ(c,r*0.35,-r*0.35,r*0.2);c.fill();break;
  case 'dragon':
    c.strokeStyle='rgba(60,0,10,.4)';c.lineWidth=r*0.055;
    for(let row=0,yy=-r;yy<r*1.1;row++,yy+=r*0.27)for(let xx=-r*1.1+(row%2)*r*0.15;xx<r*1.1;xx+=r*0.3){c.beginPath();c.arc(xx,yy,r*0.15,0.15,Math.PI-0.15);c.stroke()}break;
  case 'porcupine':
    c.strokeStyle='rgba(60,35,15,.4)';c.lineWidth=r*0.045;c.lineCap='round';
    for(let i=0;i<20;i++){const a=i/20*TAU,d=r*(0.25+rnd(i)*0.5);c.beginPath();c.moveTo(Math.cos(a)*d,Math.sin(a)*d);c.lineTo(Math.cos(a+0.15)*(d+r*0.22),Math.sin(a+0.15)*(d+r*0.22));c.stroke()}break;
  case 'whirlwind':
    c.rotate(t*5);c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=r*0.12;c.lineCap='round';
    for(let i=0;i<3;i++){c.beginPath();c.moveTo(0,0);for(let q=1;q<=22;q++){const th=q/22*2.6,rr=r*q/22,a=th+i/3*TAU;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.stroke()}break;
  case 'phoenix':
    c.fillStyle='rgba(255,240,200,.28)';
    for(let row=0;row<5;row++){const yy=-r*0.8+row*r*0.4;for(let xx=-r*1.1+(row%2)*r*0.2;xx<r*1.1;xx+=r*0.4){c.beginPath();c.arc(xx,yy,r*0.18,0,Math.PI);c.fill()}}break;
  case 'fairy':for(let i=0;i<9;i++){const tw=0.4+0.6*Math.abs(Math.sin(t*2+i*1.7));c.fillStyle=`rgba(255,255,255,${0.75*tw})`;star(c,(rnd(i+31)-0.5)*r*1.6,(rnd(i+37)-0.5)*r*1.6,r*0.11*tw+0.5,r*0.03,4)}break;
  case 'mooncat':c.fillStyle='rgba(15,10,50,.28)';for(const q of[-0.35,0,0.35]){c.beginPath();c.moveTo(q*r-r*0.09,-r*1.02);c.quadraticCurveTo(q*r,-r*0.55,q*r+r*0.09,-r*1.02);c.fill()}c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<6;i++){circ(c,(rnd(i+71)-0.5)*r*1.7,(rnd(i+77)-0.5)*r*1.7,r*0.03);c.fill()}break;
  case 'mermaid':c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=r*0.045;for(let row=0,yy=-r*0.1;yy<r*1.1;row++,yy+=r*0.24)for(let xx=-r*1.1+(row%2)*r*0.15;xx<r*1.1;xx+=r*0.3){c.beginPath();c.arc(xx,yy,r*0.15,0.15,Math.PI-0.15);c.stroke()}break;
  case 'unicorn':for(let i=0;i<7;i++){const px=(rnd(i+91)-0.5)*r*1.6,py=(rnd(i+97)-0.5)*r*1.6;c.fillStyle=['rgba(244,114,182,.45)','rgba(56,189,248,.45)','rgba(250,204,21,.5)'][i%3];if(i%2)star(c,px,py,r*0.1,r*0.04,5);else{heartPath(c,px,py,r*0.09);c.fill()}}break;
  case 'gordafarid':c.fillStyle='rgba(251,191,36,.55)';c.save();c.rotate(-0.6);c.fillRect(-r*1.2,r*0.15,r*2.4,r*0.16);c.fillStyle='rgba(120,53,15,.5)';for(let i=-4;i<=4;i++){circ(c,i*r*0.25,r*0.23,r*0.035);c.fill()}c.restore();
    c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=r*0.03;for(let i=0;i<4;i++){c.beginPath();c.arc(0,r*0.9,r*(0.35+i*0.18),Math.PI*1.15,Math.PI*1.85);c.stroke()}break;
  case 'butterfly':c.fillStyle='rgba(28,25,23,.16)';for(const q of[-0.35,0.35]){c.beginPath();c.ellipse(0,q*r,r*1.1,r*0.06,0,0,TAU);c.fill()}c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<8;i++){circ(c,(rnd(i+51)-0.5)*r*1.7,(rnd(i+57)-0.5)*r*1.7,r*0.04);c.fill()}break;
  case 'giant':
    for(let i=0;i<7;i++){const a=rnd(i+40)*TAU,d=rnd(i+50)*r*0.75,sz=r*(0.14+rnd(i+60)*0.18),cx=Math.cos(a)*d,cy=Math.sin(a)*d;
      c.fillStyle=i%2?'rgba(0,0,0,.2)':'rgba(255,255,255,.12)';c.beginPath();
      for(let j=0;j<6;j++){const b=j/6*TAU,q=sz*(0.7+rnd(i*10+j)*0.5);j?c.lineTo(cx+Math.cos(b)*q,cy+Math.sin(b)*q):c.moveTo(cx+q,cy)}c.closePath();c.fill()}
    c.strokeStyle='rgba(30,25,20,.5)';c.lineWidth=r*0.04;c.lineJoin='round';
    c.beginPath();c.moveTo(-r*0.7,-r*0.25);c.lineTo(-r*0.25,0);c.lineTo(-r*0.35,r*0.4);c.moveTo(-r*0.25,0);c.lineTo(r*0.2,-r*0.12);c.lineTo(r*0.55,r*0.15);c.stroke();break;
  }
}
function backFeat(c,k,x,y,r,t,roll,c1,c2,SK){
  switch(k){
  case 'fairy':PART._fwings(c,x,y,r,t,SK&&SK.wing);break;
  case 'butterfly':PART._bwings(c,x,y,r,t,'#fdba74','#ea580c','#1c1917','#fff7ed');break;
  case 'mooncat':{const sw=Math.sin(t*3)*0.25;c.save();c.lineCap='round';
    for(const [w,col] of [[r*0.24,mix(c2,'#000000',0.3)],[r*0.15,c1]]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x+r*0.55,y+r*0.6);c.quadraticCurveTo(x+r*1.45,y+r*0.75,x+r*(1.25+sw*0.4),y-r*(0.15+sw*0.3));c.stroke()}c.restore();
    for(const sd of[-1,1]){const a=-Math.PI/2+sd*0.62;c.save();c.translate(x+Math.cos(a)*r*0.72,y+Math.sin(a)*r*0.72);c.rotate(a+Math.PI/2+sd*0.05);
      const g=c.createLinearGradient(0,-r*0.6,0,r*0.1);g.addColorStop(0,c2);g.addColorStop(1,c1);c.fillStyle=g;c.strokeStyle=mix(c2,'#000000',0.45);c.lineWidth=r*0.05;
      c.beginPath();c.moveTo(-r*0.36,r*0.12);c.quadraticCurveTo(-r*0.12,-r*0.4,r*0.02,-r*0.66);c.quadraticCurveTo(r*0.16,-r*0.35,r*0.36,r*0.12);c.closePath();c.fill();c.stroke();
      c.fillStyle='#f9a8d4';c.beginPath();c.moveTo(-r*0.18,r*0.05);c.quadraticCurveTo(-r*0.06,-r*0.28,r*0.02,-r*0.44);c.quadraticCurveTo(r*0.1,-r*0.25,r*0.18,r*0.05);c.closePath();c.fill();c.restore()}break}
  case 'mermaid':{const hair=(SK&&SK.hair)||'#fb7185',sw=Math.sin(t*4)*0.18,wv=Math.sin(t*3)*r*0.08;
    c.save();c.translate(x+r*0.55,y+r*0.8);c.rotate(0.55+sw);const g=c.createLinearGradient(0,0,0,r*0.85);g.addColorStop(0,c1);g.addColorStop(1,c2);c.fillStyle=g;c.strokeStyle=mix(c2,'#000000',0.4);c.lineWidth=r*0.05;
    c.beginPath();c.moveTo(-r*0.16,0);c.quadraticCurveTo(-r*0.18,r*0.4,-r*0.58,r*0.78);c.quadraticCurveTo(-r*0.12,r*0.72,0,r*0.48);c.quadraticCurveTo(r*0.12,r*0.72,r*0.58,r*0.78);c.quadraticCurveTo(r*0.18,r*0.4,r*0.16,0);c.closePath();c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=r*0.03;for(const q of[-0.3,0,0.3]){c.beginPath();c.moveTo(q*r*0.3,r*0.5);c.lineTo(q*r*1.2,r*0.72);c.stroke()}c.restore();
    const hg=c.createLinearGradient(0,y-r,0,y+r*1.1);hg.addColorStop(0,hair);hg.addColorStop(1,mix(hair,'#000000',0.35));c.fillStyle=hg;
    c.beginPath();c.moveTo(x-r*0.92,y-r*0.45);c.bezierCurveTo(x-r*1.0,y-r*1.3,x+r*1.0,y-r*1.3,x+r*0.92,y-r*0.45);
    c.bezierCurveTo(x+r*1.32,y+r*0.05,x+r*1.0+wv,y+r*0.6,x+r*1.25,y+r*0.95);c.quadraticCurveTo(x+r*0.8,y+r*0.75,x+r*0.7,y+r*0.1);c.lineTo(x-r*0.7,y+r*0.1);
    c.quadraticCurveTo(x-r*0.8,y+r*0.75,x-r*1.25,y+r*0.95);c.bezierCurveTo(x-r*1.0-wv,y+r*0.6,x-r*1.32,y+r*0.05,x-r*0.92,y-r*0.45);c.closePath();c.fill();
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=r*0.035;c.stroke();break}
  case 'unicorn':{const cols=(SK&&SK.mane)||['#f472b6','#fb923c','#facc15','#4ade80','#38bdf8','#a78bfa'];
    for(let i=0;i<cols.length*2;i++){const a=Math.PI*(1.02+i*0.06)+Math.sin(t*3+i)*0.03,L=r*(0.42+0.12*Math.sin(i*1.3));c.save();c.translate(x+Math.cos(a)*r*0.82,y+Math.sin(a)*r*0.82);c.rotate(a+Math.PI/2-0.5);
      c.fillStyle=cols[i%cols.length];c.beginPath();c.ellipse(0,-L*0.55,r*0.13,L*0.6,0,0,TAU);c.fill();c.restore()}
    break}
  case 'gordafarid':{const sw=Math.sin(t*3)*r*0.06,hair=(SK&&SK.hair)||'#1c1917';c.save();
    const pts=[];for(let i=0;i<8;i++){const q=i/7;pts.push([x+r*(0.62+q*0.5)+Math.sin(q*3)*sw,y-r*0.25+q*r*1.35])}
    pts.forEach(([px,py],i)=>{const s0=r*(0.2-i*0.012);c.fillStyle=i%2?hair:mix(hair,'#ffffff',0.18);c.beginPath();c.ellipse(px,py,s0,s0*1.15,0.3,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=r*0.025;c.stroke()});
    const [ex,ey]=pts[7];c.fillStyle='#fbbf24';rrect(c,ex-r*0.11,ey+r*0.06,r*0.22,r*0.1,r*0.03);c.fill();c.fillStyle=hair;c.beginPath();c.moveTo(ex-r*0.1,ey+r*0.15);c.lineTo(ex,ey+r*0.45);c.lineTo(ex+r*0.1,ey+r*0.15);c.closePath();c.fill();c.restore();
    if(!(SK&&SK.noPlume)){c.fillStyle='#dc2626';c.beginPath();c.moveTo(x,y-r*1.42);c.quadraticCurveTo(x-r*0.75,y-r*1.7,x-r*1.05,y-r*1.05+Math.sin(t*4)*r*0.05);c.quadraticCurveTo(x-r*0.6,y-r*1.38,x,y-r*1.28);c.fill()}
    break}
  case 'porcupine':{const n=14;for(let i=0;i<n;i++){const a=i/n*TAU+roll*0.5,w=0.17;
      c.fillStyle=i%2?'#5a3a1c':'#7a5230';c.beginPath();c.moveTo(x+Math.cos(a-w)*r*0.85,y+Math.sin(a-w)*r*0.85);c.lineTo(x+Math.cos(a)*r*1.38,y+Math.sin(a)*r*1.38);c.lineTo(x+Math.cos(a+w)*r*0.85,y+Math.sin(a+w)*r*0.85);c.closePath();c.fill();
      c.fillStyle='#f3e3c8';circ(c,x+Math.cos(a)*r*1.33,y+Math.sin(a)*r*1.33,r*0.035);c.fill()}break}
  case 'rage':horn(c,x,y,r,-Math.PI/2-0.55,'#5a1408','#ffb38a',0.62,-0.45);horn(c,x,y,r,-Math.PI/2+0.55,'#5a1408','#ffb38a',0.62,0.45);break;
  case 'dragon':horn(c,x,y,r,-Math.PI/2-0.5,'#3d0a12','#ffe4e6',0.7,-0.75);horn(c,x,y,r,-Math.PI/2+0.5,'#3d0a12','#ffe4e6',0.7,0.75);break;
  case 'vampire':
    c.fillStyle='#2a0a3d';c.beginPath();c.moveTo(x-r*1.18,y);c.lineTo(x-r*1.0,y-r*1.0);c.lineTo(x-r*0.55,y-r*0.6);c.lineTo(x,y-r*1.08);
    c.lineTo(x+r*0.55,y-r*0.6);c.lineTo(x+r*1.0,y-r*1.0);c.lineTo(x+r*1.18,y);c.closePath();c.fill();
    c.strokeStyle='#be185d';c.lineWidth=r*0.05;c.stroke();
    c.fillStyle='#9f1239';c.beginPath();c.moveTo(x-r*1.0,y-r*0.1);c.lineTo(x-r*0.9,y-r*0.8);c.lineTo(x-r*0.6,y-r*0.45);c.closePath();c.fill();
    c.beginPath();c.moveTo(x+r*1.0,y-r*0.1);c.lineTo(x+r*0.9,y-r*0.8);c.lineTo(x+r*0.6,y-r*0.45);c.closePath();c.fill();break;
  case 'phoenix':
    for(const sd of [-1,1]){const fl=Math.sin(t*9)*0.25;c.save();c.translate(x+sd*r*0.82,y-r*0.05);c.scale(sd,1);c.rotate(-0.25-fl);
      ['#ffe8a3','#ffb347','#e8590c'].forEach((col,i)=>{c.fillStyle=col;c.beginPath();c.ellipse(r*0.38-i*r*0.04,-r*0.12+i*r*0.17,r*0.44-i*r*0.08,r*0.12,-0.35+i*0.3,0,TAU);c.fill()});
      c.restore()}break;
  case 'lightning':
    if(Math.sin(t*23+x)>0.55){c.save();c.strokeStyle='rgba(210,215,255,.95)';c.lineWidth=Math.max(1.2,r*0.05);c.shadowColor='#818cf8';c.shadowBlur=8;
      const a=(t*7)%TAU;c.beginPath();c.moveTo(x+Math.cos(a)*r*1.02,y+Math.sin(a)*r*1.02);
      for(let i=1;i<5;i++){const b=a+i*0.16,rr=r*(1.04+(i%2?0.24:0.06));c.lineTo(x+Math.cos(b)*rr,y+Math.sin(b)*rr)}c.stroke();c.restore()}break;
  }
}
function frontFeat(c,k,x,y,r,t,la,c1,c2,SK){
  switch(k){
  case 'fairy':PART._fcrown(c,x,y,r,t,'#f472b6','#fde047');break;
  case 'butterfly':PART._antennae(c,x,y,r,t,'#1c1917');break;
  case 'mooncat':{c.save();c.shadowColor='#fde68a';c.shadowBlur=r*0.35;c.fillStyle='#fde68a';c.beginPath();c.arc(x,y-r*0.62,r*0.2,Math.PI*0.25,Math.PI*1.75);c.arc(x+r*0.09,y-r*0.66,r*0.16,Math.PI*1.75,Math.PI*0.25,true);c.closePath();c.fill();c.restore();break}
  case 'mermaid':{const hair=(SK&&SK.hair)||'#fb7185';c.save();circ(c,x,y,r*1.01);c.clip();const g=c.createLinearGradient(0,y-r,0,y-r*0.3);g.addColorStop(0,mix(hair,'#ffffff',0.15));g.addColorStop(1,hair);c.fillStyle=g;
    c.beginPath();c.moveTo(x-r*1.05,y-r*0.1);c.lineTo(x-r*1.05,y-r*1.1);c.lineTo(x+r*1.05,y-r*1.1);c.lineTo(x+r*1.05,y-r*0.1);
    for(let i=0;i<=6;i++){const px=x+r*1.05-i*r*0.35,py=y-r*(i%2?0.62:0.42)-(i===0||i===6?-r*0.3:0);c.quadraticCurveTo(px+r*0.17,py-r*0.15,px,py)}c.closePath();c.fill();
    c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=r*0.05;c.beginPath();c.arc(x-r*0.15,y-r*0.15,r*0.75,Math.PI*1.2,Math.PI*1.45);c.stroke();c.restore();
    PART._shell(c,x+r*0.62,y-r*0.7,r*0.24,(SK&&SK.shell)||'#fde68a');break}
  case 'unicorn':PART._horn(c,x,y,r,t,(SK&&SK.horn)||['#fef9c3','#f59e0b']);break;
  case 'gordafarid':PART._ghelm(c,x,y,r,(SK&&SK.helm)||['#f1f5f9','#64748b'],(SK&&SK.trim)||'#fbbf24');break;
  case 'archer':{
    c.save();c.lineCap='round';c.strokeStyle='#6b3f17';c.lineWidth=r*0.14;c.beginPath();c.arc(x,y,r*1.16,la-0.8,la+0.8);c.stroke();
    c.strokeStyle='#d39a5a';c.lineWidth=r*0.05;c.stroke();
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=Math.max(1,r*0.035);c.beginPath();
    c.moveTo(x+Math.cos(la-0.8)*r*1.16,y+Math.sin(la-0.8)*r*1.16);c.lineTo(x+Math.cos(la+0.8)*r*1.16,y+Math.sin(la+0.8)*r*1.16);c.stroke();
    const ax=x+Math.cos(la)*r*1.42,ay=y+Math.sin(la)*r*1.42;c.fillStyle='#e8f6ff';c.beginPath();c.moveTo(ax,ay);
    c.lineTo(ax-Math.cos(la-0.45)*r*0.26,ay-Math.sin(la-0.45)*r*0.26);c.lineTo(ax-Math.cos(la+0.45)*r*0.26,ay-Math.sin(la+0.45)*r*0.26);c.closePath();c.fill();c.restore();break}
  case 'bomber':{
    c.save();c.fillStyle='#4b5563';rrect(c,x-r*0.2,y-r*1.1,r*0.4,r*0.24,r*0.05);c.fill();c.strokeStyle='#cbd5e1';c.lineWidth=r*0.03;c.stroke();
    c.strokeStyle='#c8a26b';c.lineWidth=r*0.07;c.lineCap='round';c.beginPath();c.moveTo(x,y-r*1.08);c.quadraticCurveTo(x+r*0.05,y-r*1.42,x+r*0.32,y-r*1.38);c.stroke();
    const sp=0.7+Math.sin(t*30)*0.3;c.shadowColor='#ffb347';c.shadowBlur=12;c.fillStyle='#fff3c4';star(c,x+r*0.34,y-r*1.39,r*0.17*sp,r*0.05,6);
    c.fillStyle='#ff9f1c';star(c,x+r*0.34,y-r*1.39,r*0.1*sp,r*0.03,6);c.restore();break}
  case 'poison':{
    const b=(t*0.8)%1;c.save();c.globalAlpha*=1-b;c.fillStyle='#9cf28a';const dx=x+r*0.25,dy=y+r*(0.95+b*0.45),s=r*0.11*(1-b*0.3);
    c.beginPath();c.moveTo(dx,dy-s*1.8);c.quadraticCurveTo(dx+s*1.1,dy-s*0.2,dx,dy+s);c.quadraticCurveTo(dx-s*1.1,dy-s*0.2,dx,dy-s*1.8);c.fill();c.restore();break}
  case 'frost':
    c.fillStyle='#e0fbff';for(const q of [-0.4,0,0.4]){const a=Math.PI/2+q,L=r*(q?0.24:0.36),bx=x+Math.cos(a)*r*0.92,by=y+Math.sin(a)*r*0.92;
      c.beginPath();c.moveTo(bx-r*0.09,by-r*0.02);c.lineTo(bx+r*0.09,by-r*0.02);c.lineTo(bx,by+L);c.closePath();c.fill()}break;
  case 'phoenix':
    for(const i of [-1,0,1]){const fl=r*(0.42+(i===0?0.2:0))*(0.85+Math.sin(t*14+i*2)*0.15),bx=x+i*r*0.28,by=y-r*0.86;
      const g=c.createLinearGradient(bx,by,bx,by-fl);g.addColorStop(0,'#e8590c');g.addColorStop(1,'#ffe066');c.fillStyle=g;
      c.beginPath();c.moveTo(bx-r*0.15,by);c.quadraticCurveTo(bx-r*0.17,by-fl*0.6,bx+i*r*0.06,by-fl);c.quadraticCurveTo(bx+r*0.17,by-fl*0.6,bx+r*0.15,by);c.closePath();c.fill();
      c.fillStyle='rgba(255,250,220,.85)';c.beginPath();c.ellipse(bx,by-fl*0.3,r*0.05,fl*0.22,0,0,TAU);c.fill()}break;
  case 'mirror':{const s0=(Math.sin(t*3)+1)/2;c.fillStyle='#ffffff';star(c,x+r*0.72,y-r*0.72,r*0.24*s0+1,r*0.05,4);break}
  case 'tank':
    c.fillStyle='#64748b';rrect(c,x-r*0.06,y-r*1.25,r*0.12,r*0.3,r*0.04);c.fill();
    c.fillStyle=Math.sin(t*6)>0?'#f87171':'#7f1d1d';circ(c,x,y-r*1.27,r*0.08);c.fill();break;
  }
}
function face(c,k,x,y,r,t,la,mood){
  const fx=x+Math.cos(la)*r*0.2,fy=y+Math.sin(la)*r*0.14+r*0.05,ex=r*0.3,ey=fy-r*0.1;
  const px=Math.cos(la)*r*0.06,py=Math.sin(la)*r*0.06,ink='#141a2e';
  const blink=mood!=='dead'&&mood!=='static'&&((t+SEED[k])%3.3)<0.13;
  c.save();c.lineCap='round';c.lineJoin='round';
  if(k==='tank'){
    c.fillStyle='#1b2333';rrect(c,fx-r*0.56,ey-r*0.16,r*1.12,r*0.32,r*0.16);c.fill();c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=r*0.03;c.stroke();
    if(mood==='dead'){c.strokeStyle='#f87171';c.lineWidth=r*0.06;for(const sd of[-1,1]){const cx=fx+sd*ex;c.beginPath();c.moveTo(cx-r*0.08,ey-r*0.08);c.lineTo(cx+r*0.08,ey+r*0.08);c.moveTo(cx+r*0.08,ey-r*0.08);c.lineTo(cx-r*0.08,ey+r*0.08);c.stroke()}}
    else{c.shadowColor=mood==='angry'?'#f87171':'#7dd3fc';c.shadowBlur=8;c.fillStyle=mood==='angry'?'#f87171':'#7dd3fc';
      for(const sd of[-1,1]){const h=blink||mood==='hurt'?r*0.025:r*0.09;rrect(c,fx+sd*ex-r*0.13+px,ey-h/2,r*0.26,h,h/2);c.fill()}}
    c.restore();return;
  }
  for(const sd of [-1,1]){
    const cx=fx+sd*ex,cy=ey;
    if(mood==='dead'){c.strokeStyle=ink;c.lineWidth=r*0.07;c.beginPath();c.moveTo(cx-r*0.09,cy-r*0.09);c.lineTo(cx+r*0.09,cy+r*0.09);c.moveTo(cx+r*0.09,cy-r*0.09);c.lineTo(cx-r*0.09,cy+r*0.09);c.stroke();continue}
    if(mood==='hurt'){c.strokeStyle=ink;c.lineWidth=r*0.07;c.beginPath();c.moveTo(cx-sd*r*0.1,cy-r*0.08);c.lineTo(cx+sd*r*0.06,cy);c.lineTo(cx-sd*r*0.1,cy+r*0.08);c.stroke();continue}
    if(blink){c.strokeStyle=ink;c.lineWidth=r*0.06;c.beginPath();c.moveTo(cx-r*0.11,cy);c.lineTo(cx+r*0.11,cy);c.stroke();continue}
    if(k==='ghost'){c.fillStyle=ink;c.beginPath();c.ellipse(cx+px*0.5,cy+py*0.5,r*0.12,r*0.19,0,0,TAU);c.fill();continue}
    const ew=k==='giant'?r*0.1:r*0.15,eh=k==='giant'?r*0.11:r*0.18;
    c.fillStyle=k==='dragon'?'#ffd34d':k==='mooncat'?'#d9f99d':'#ffffff';c.beginPath();c.ellipse(cx,cy,ew,eh,0,0,TAU);c.fill();
    c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=r*0.02;c.stroke();
    if(FEM[k]){c.strokeStyle=ink;c.lineWidth=r*0.04;for(let j=0;j<3;j++){const q=-Math.PI/2+sd*(0.55+j*0.32),qx=cx+Math.cos(q)*ew,qy=cy+Math.sin(q)*eh;c.beginPath();c.moveTo(qx,qy);c.lineTo(qx+Math.cos(q)*r*0.1,qy+Math.sin(q)*r*0.1);c.stroke()}}
    if(k==='dragon'||k==='mooncat'){c.fillStyle=ink;c.beginPath();c.ellipse(cx+px,cy+py,r*0.035,r*0.13,0,0,TAU);c.fill();if(k==='mooncat'){c.fillStyle='#fff';circ(c,cx+px-r*0.05,cy+py-r*0.06,r*0.03);c.fill()}}
    else{const pr=k==='giant'?r*0.06:r*0.085;c.fillStyle=k==='vampire'?'#e11d48':ink;circ(c,cx+px,cy+py,pr);c.fill();
      c.fillStyle='#ffffff';circ(c,cx+px-pr*0.35,cy+py-pr*0.4,pr*0.36);c.fill();
      if(k==='mirror')star(c,cx+px+pr*0.35,cy+py+pr*0.25,pr*0.55,pr*0.18,4)}
  }
  const angry=k==='rage'||k==='whirlwind'||k==='bomber'||mood==='angry';
  if(angry&&mood!=='dead'){c.strokeStyle=ink;c.lineWidth=r*0.07;for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*(ex+r*0.15),ey-r*0.27);c.lineTo(fx+sd*(ex-r*0.12),ey-r*0.17);c.stroke()}}
  if(k==='giant'){c.strokeStyle='#2b2420';c.lineWidth=r*0.1;c.beginPath();c.moveTo(fx-ex-r*0.16,ey-r*0.17);c.lineTo(fx,ey-r*0.09);c.lineTo(fx+ex+r*0.16,ey-r*0.17);c.stroke()}
  if(k==='gordafarid'&&mood!=='dead'){c.strokeStyle=ink;c.lineWidth=r*0.06;for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*(ex+r*0.16),ey-r*0.25);c.quadraticCurveTo(fx+sd*ex,ey-r*0.3,fx+sd*(ex-r*0.13),ey-r*0.2);c.stroke()}}
  if(k==='frost'||k==='phoenix'||k==='porcupine'||k==='mirror'||FEM[k]||k==='mooncat'){c.fillStyle='rgba(255,110,150,.38)';for(const sd of[-1,1]){c.beginPath();c.ellipse(fx+sd*r*0.47,ey+r*0.19,r*0.1,r*0.06,0,0,TAU);c.fill()}}
  if(k==='porcupine'){c.fillStyle='#2a1a0c';c.beginPath();c.ellipse(fx,ey+r*0.14,r*0.08,r*0.06,0,0,TAU);c.fill()}
  const my=fy+r*0.24;c.strokeStyle=ink;c.lineWidth=r*0.055;
  if(mood==='dead'||mood==='hurt'){c.fillStyle=ink;c.beginPath();c.ellipse(fx,my,r*0.08,r*0.065,0,0,TAU);c.fill()}
  else if(k==='ghost'){c.fillStyle=ink;c.beginPath();c.ellipse(fx,my,r*0.07,r*0.09,0,0,TAU);c.fill()}
  else if(k==='mooncat'){c.fillStyle='#f9a8d4';c.beginPath();c.moveTo(fx-r*0.07,my-r*0.12);c.lineTo(fx+r*0.07,my-r*0.12);c.lineTo(fx,my-r*0.04);c.closePath();c.fill();c.lineWidth=r*0.045;c.beginPath();c.moveTo(fx,my-r*0.04);c.quadraticCurveTo(fx-r*0.05,my+r*0.07,fx-r*0.13,my+r*0.01);c.moveTo(fx,my-r*0.04);c.quadraticCurveTo(fx+r*0.05,my+r*0.07,fx+r*0.13,my+r*0.01);c.stroke();
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=r*0.025;for(const sd of[-1,1])for(const q of[-0.05,0.05]){c.beginPath();c.moveTo(fx+sd*r*0.22,my-r*0.06+q*r);c.lineTo(fx+sd*r*0.62,my-r*0.1+q*r*2.4);c.stroke()}}
  else if(k==='gordafarid'){c.beginPath();c.moveTo(fx-r*0.13,my-r*0.02);c.quadraticCurveTo(fx+r*0.02,my+r*0.08,fx+r*0.16,my-r*0.07);c.stroke()}
  else if(k==='rage'||mood==='angry'){c.fillStyle='#ffffff';rrect(c,fx-r*0.17,my-r*0.06,r*0.34,r*0.12,r*0.03);c.fill();c.lineWidth=r*0.035;c.stroke();
    c.lineWidth=r*0.02;c.beginPath();c.moveTo(fx-r*0.17,my);c.lineTo(fx+r*0.17,my);for(const q of[-0.08,0,0.08]){c.moveTo(fx+q*r,my-r*0.06);c.lineTo(fx+q*r,my+r*0.06)}c.stroke()}
  else if(k==='vampire'){c.beginPath();c.arc(fx,my-r*0.1,r*0.15,0.22*Math.PI,0.78*Math.PI);c.stroke();c.fillStyle='#ffffff';
    for(const sd of[-1,1]){c.beginPath();c.moveTo(fx+sd*r*0.08-r*0.035,my+r*0.03);c.lineTo(fx+sd*r*0.08+r*0.035,my+r*0.03);c.lineTo(fx+sd*r*0.08,my+r*0.14);c.closePath();c.fill()}}
  else if(k==='giant'||k==='bomber'){c.beginPath();c.moveTo(fx-r*0.12,my);c.lineTo(fx+r*0.12,my);c.stroke()}
  else if(k==='dragon'){c.beginPath();c.moveTo(fx-r*0.16,my-r*0.02);c.quadraticCurveTo(fx,my+r*0.08,fx+r*0.16,my-r*0.02);c.stroke();
    c.fillStyle='rgba(60,0,10,.6)';for(const sd of[-1,1]){circ(c,fx+sd*r*0.06,my-r*0.12,r*0.025);c.fill()}}
  else{c.beginPath();c.arc(fx,my-r*0.1,r*0.15,0.2*Math.PI,0.8*Math.PI);c.stroke()}
  c.restore();
}
function drawBall(c,o){
  const {x,y,r,k}=o,t=o.t||0,C=CLASSES[k],SK=o.skin?SKINS[o.skin]:null,c1=SK?SK.c1:C.c1,c2=SK?SK.c2:C.c2,roll=o.roll||0,la=o.look==null?0.6:o.look,mood=o.mood||'idle';
  if(!(SK&&SK.noBack))backFeat(c,k,x,y,r,t,roll,c1,c2,SK);
  if(SK&&SK.back)SK.back.forEach(pn=>PART[pn](c,x,y,r,t,la));
  c.save();c.shadowColor=c1;c.shadowBlur=o.glow==null?14:o.glow;
  const g=c.createRadialGradient(x-r*0.3,y-r*0.38,r*0.05,x,y,r*1.05);
  g.addColorStop(0,mix(c1,'#ffffff',0.45));g.addColorStop(0.5,c1);g.addColorStop(1,c2);
  c.fillStyle=g;circ(c,x,y,r);c.fill();c.restore();
  c.save();circ(c,x,y,r);c.clip();c.translate(x,y);c.rotate(roll);if(SK&&SK.pat)skinPat(c,SK.pat,r,t);else pattern(c,k,r,t);c.restore();
  c.save();circ(c,x,y,r);c.clip();
  const sh=c.createRadialGradient(x-r*0.28,y-r*0.34,r*0.1,x,y,r*1.15);
  sh.addColorStop(0,'rgba(255,255,255,.22)');sh.addColorStop(0.45,'rgba(255,255,255,0)');sh.addColorStop(0.8,'rgba(0,0,0,.12)');sh.addColorStop(1,'rgba(0,0,0,.45)');
  c.fillStyle=sh;c.fillRect(x-r,y-r,2*r,2*r);
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=r*0.07;c.beginPath();c.arc(x,y,r*0.88,0.12*Math.PI,0.55*Math.PI);c.stroke();
  c.restore();
  c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.ellipse(x-r*0.42,y-r*0.47,r*0.19,r*0.09,-0.75,0,TAU);c.fill();
  circ(c,x-r*0.64,y-r*0.22,r*0.04);c.fill();
  c.strokeStyle=mix(c2,'#000000',0.45);c.lineWidth=Math.max(1.5,r*0.06);circ(c,x,y,r);c.stroke();
  if(!(SK&&SK.noFront))frontFeat(c,k,x,y,r,t,la,c1,c2,SK);
  if(!o.noFace){if(SK&&SK.face==='pumpkin')pumpkinFace(c,x,y,r,t,la);else face(c,k,x,y,r,t,la,mood)}
  if(SK&&SK.front)SK.front.forEach(pn=>PART[pn](c,x,y,r,t,la));
}
const ICON={};
function icon(k,sk){
  if(sk===undefined)sk=S.skin[k]||'';
  const key=k+'|'+sk;if(ICON[key]!=null)return ICON[key];
  const cv2=document.createElement('canvas');cv2.width=cv2.height=160;const c=cv2.getContext('2d');
  drawBall(c,{x:80,y:88,r:46,k,t:0.6,look:0.75,glow:10,mood:'static',skin:sk});
  try{ICON[key]=cv2.toDataURL('image/png')}catch(e){ICON[key]=''}
  return ICON[key];
}

