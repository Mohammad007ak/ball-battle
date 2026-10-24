// Ported from prototype/ball-battle.html (lines 2062-2420). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- FINISHERS ---------- */
const e01=x=>x<0?0:x>1?1:x,sg=(T,a,b)=>e01((T-a)/(b-a)),eo=x=>1-Math.pow(1-x,3),ei=x=>x*x*x,eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,lerp=(a,b,q)=>a+(b-a)*q;
let FAX,FVX,FY,VR,VT;function finConsts(){FAX=W*0.34;FVX=W*0.66;FY=H*0.6;VR=W/2+W/2/1.55-4;VT=H*0.55-H*0.55/1.55}finConsts();
const FCAM=1.55,FIN_PROMPT=3.6,RAINBOW=['#f43f5e','#fb923c','#facc15','#4ade80','#38bdf8','#a78bfa'];
function fball(c,P,o){o=o||{};c.save();if(o.a!=null)c.globalAlpha*=o.a;c.translate(o.x,o.y);if(o.rot)c.rotate(o.rot);const s=o.s==null?1:o.s;c.scale((o.sx||1)*s,(o.sy||1)*s);
  drawBall(c,{x:0,y:0,r:P.r,k:P.cls,skin:P.skin,t:G.clock,look:o.look==null?P.look:o.look,mood:o.mood||'idle',glow:o.glow==null?10:o.glow,noFace:!!(o.emo||o.noFace||o.char)});
  if(o.tint){c.fillStyle=o.tint;circ(c,0,0,P.r*1.03);c.fill()}
  if(o.char){c.fillStyle=`rgba(24,16,12,${o.char})`;circ(c,0,0,P.r*1.03);c.fill();if(o.char>0.6){const bl=(G.clock%2.2)<0.12;c.fillStyle='#fff';for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*P.r*0.3,-P.r*0.02,P.r*0.13,bl?P.r*0.02:P.r*0.15,0,0,TAU);c.fill()}}}
  if(o.emo&&!o.char)emoteFace(c,o.emo,0,0,P.r,G.clock);
  c.restore()}
function fsprite(F,mood,tint){const key=mood+(tint||'');F.spr=F.spr||{};if(!F.spr[key]){const P=F.V,R=P.r*1.9,sz=Math.ceil(R*4),cv2=document.createElement('canvas');cv2.width=cv2.height=sz;const c=cv2.getContext('2d');c.scale(2,2);c.translate(R,R);
  drawBall(c,{x:0,y:0,r:P.r,k:P.cls,skin:P.skin,t:G.clock,look:P.look,mood,glow:0});if(tint){c.globalCompositeOperation='source-atop';c.fillStyle=tint;c.fillRect(-R,-R,2*R,2*R)}F.spr[key]={cv:cv2,R}}return F.spr[key]}
function fshatter(c,sp,x,y,p,o){o=o||{};const n=o.n||7,R=sp.R,r0=R*0.42,pow=o.pow||1,g=o.g==null?560:o.g,seed=o.seed||1,fd=o.fade==null?0.9:o.fade;
  for(let i=0;i<n;i++)for(let ring=0;ring<2;ring++){
    const a0=i/n*TAU+rnd(seed+i)*0.35,a1=(i+1)/n*TAU+rnd(seed+i+1)*0.35,am=(a0+a1)/2,id=i*2+ring,
      v=(ring?170:80)*(0.6+rnd(seed+id*3.1)*0.8)*pow,up=(o.up==null?140:o.up)*(0.5+rnd(seed+id*1.7)),
      dx=Math.cos(am)*v*p,dy=Math.sin(am)*v*p-up*p+0.5*g*p*p,rot=(rnd(seed+id*5.3)-0.5)*9*p;
    c.save();c.globalAlpha*=1-sg(p,fd,fd+0.45);c.translate(x+dx,y+dy);c.rotate(rot);
    c.beginPath();if(ring){c.arc(0,0,R,a0,a1);c.arc(0,0,r0,a1,a0,true)}else{c.moveTo(0,0);c.arc(0,0,r0,a0,a1)}c.closePath();c.clip();
    c.drawImage(sp.cv,-R,-R,2*R,2*R);if(o.edge){c.strokeStyle=o.edge;c.lineWidth=2.5;c.stroke()}c.restore()}}
function fslice(c,sp,x,y,p,th,d){const R=sp.R,nx=-Math.sin(th),ny=Math.cos(th),tx=Math.cos(th),ty=Math.sin(th),L=R*3;
  for(let i=-1;i<=1;i++){const lo=i<0?-L:i===0?-d:d,hi=i<0?-d:i===0?d:L;
    c.save();c.globalAlpha*=1-sg(p,1.1,1.5);c.translate(x+nx*i*p*16+tx*i*p*30,y+ny*i*p*16+p*p*(i===0?140:300));c.rotate(i*p*0.7);
    c.beginPath();c.moveTo(-tx*L+nx*lo,-ty*L+ny*lo);c.lineTo(tx*L+nx*lo,ty*L+ny*lo);c.lineTo(tx*L+nx*hi,ty*L+ny*hi);c.lineTo(-tx*L+nx*hi,-ty*L+ny*hi);c.closePath();c.clip();
    c.drawImage(sp.cv,-R,-R,2*R,2*R);c.restore()}}
function farrow(c,x,y,a,L,col,s){c.save();c.translate(x,y);c.rotate(a);if(s)c.scale(s,s);c.strokeStyle='#8b5a2b';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-L,0);c.lineTo(0,0);c.stroke();
  c.fillStyle='#e2e8f0';c.beginPath();c.moveTo(7,0);c.lineTo(-2,3.8);c.lineTo(-2,-3.8);c.closePath();c.fill();
  c.fillStyle=col||'#ef4444';c.beginPath();c.moveTo(-L+5,0);c.lineTo(-L-3,-4.5);c.lineTo(-L,0);c.lineTo(-L-3,4.5);c.closePath();c.fill();c.restore()}
function fbolt(c,x1,y1,x2,y2,seed,w,a){const n=9,dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy)||1;c.save();c.globalAlpha*=a==null?1:a;c.shadowColor='#a5b4fc';c.shadowBlur=22;c.lineJoin='round';c.lineCap='round';
  for(const [lw,col] of [[w*2.8,'rgba(129,140,248,.85)'],[w,'#ffffff']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x1,y1);for(let i=1;i<n;i++){const q=i/n,j=(rnd(seed*13+i)-0.5)*40;c.lineTo(x1+dx*q-dy/L*j,y1+dy*q+dx/L*j)}c.lineTo(x2,y2);c.stroke()}c.restore()}
function fflash(c,a,col){if(a<=0)return;c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=Math.min(1,a);c.fillStyle=col||'#fff';c.fillRect(0,0,c.canvas.width,c.canvas.height);c.restore()}
function fstars(c,x,y,r,col){for(let i=0;i<3;i++){const q=G.clock*4+i/3*TAU;c.fillStyle=col||'#fde047';star(c,x+Math.cos(q)*r*0.95,y-r*1.25+Math.sin(q)*r*0.28,4.5,1.8,5)}}
function fconf(c,x,y,p,n,seed,cols,pow){for(let i=0;i<n;i++){const a=rnd(seed+i)*TAU,v=(90+rnd(seed+i*2.3)*230)*(pow||1),px=x+Math.cos(a)*v*p,py=y+Math.sin(a)*v*p-120*p+260*p*p;
  c.save();c.globalAlpha*=1-sg(p,1.4,2);c.translate(px,py);c.rotate(p*(6+i%5)+i);c.fillStyle=cols[i%cols.length];if(i%4===0){heartPath(c,0,0,4);c.fill()}else if(i%4===1)star(c,0,0,4.5,1.8,5);else c.fillRect(-3,-1.6,6,3.2);c.restore()}}
function fshadow(c,x,y,r,s){c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(x,y+r*0.95,r*0.95*(s||1),r*0.25*(s||1),0,0,TAU);c.fill()}
function fnote(c,x,y,s,col){c.save();c.translate(x,y);c.scale(s,s);c.fillStyle=col;c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.ellipse(0,0,4.5,3.4,-0.4,0,TAU);c.fill();c.beginPath();c.moveTo(4,-1);c.lineTo(4,-15);c.quadraticCurveTo(9,-12,10,-7);c.stroke();c.restore()}
function fcloud(c,x,y,s,col){c.fillStyle=col;for(const [dx,dy,rr] of [[-1,0,0.7],[0,-0.35,0.9],[1,0,0.7],[0.45,0.2,0.65],[-0.45,0.2,0.65]]){circ(c,x+dx*s,y+dy*s,rr*s);c.fill()}}

const FIN={
archer:{n:'باران تیر',dur:4.3,draw(c,T,F,ev){const A=F.A,V=F.V,vx=FVX,vy=FY,ax=FAX-eo(sg(T,0,0.4))*18;
  const H2=[];for(let i=0;i<16;i++)H2.push({ti:1.2+i*0.065,ang:Math.PI/2+(rnd(i+3)-0.5)*1.0,ox:(rnd(i+9)-0.5)*V.r*1.3,oy:(rnd(i+21)-0.75)*V.r*1.1});
  ev('up',0.45,()=>sfx('volley'));
  for(let i=0;i<9;i++){const q=T-0.45-i*0.035;if(q>0&&q<0.5)farrow(c,ax+(i-4)*3,FY-A.r-q*720,-Math.PI/2+(i-4)*0.04,22)}
  const jolt=H2.some(h=>T>h.ti&&T<h.ti+0.07);
  if(T<3.2){fball(c,V,{x:vx+(jolt?(Math.random()-0.5)*5:0),y:vy,mood:'hurt',rot:Math.sin(G.clock*3)*0.07});
    H2.forEach((h,i)=>{if(T>=h.ti){farrow(c,vx+h.ox,vy+h.oy,h.ang,18);ev('h'+i,h.ti,()=>{burst(vx+h.ox,vy+h.oy,'#fff',4,0.6);if(i%3===0)sfx('thunk')})}
      else if(T>h.ti-0.32){const q=(h.ti-T)/0.32;farrow(c,vx+h.ox-Math.cos(h.ang)*300*q,vy+h.oy-Math.sin(h.ang)*300*q,h.ang,22)}})}
  const ch=sg(T,2.4,3.0);fball(c,A,{x:ax,y:FY,look:T<1.1?-1.2:0,mood:T>2.4?'angry':'idle',sx:1-ch*0.08,sy:1+ch*0.05});
  if(ch>0&&T<3.05){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(ax+A.r*1.4,FY,1,ax+A.r*1.4,FY,26*ch);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(79,195,247,0)');c.fillStyle=g;circ(c,ax+A.r*1.4,FY,26*ch);c.fill();c.restore();ev('ch',2.4,()=>sfx('charge'))}
  if(T>=3.0){const q=(T-3.0)/0.18,bx=lerp(ax+A.r*1.4,vx,Math.min(1,q))+Math.max(0,q-1)*700;c.save();c.shadowColor='#4fc3f7';c.shadowBlur=24;farrow(c,bx,FY,0,40,'#4fc3f7',1.6);c.restore();
    c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(79,195,247,.5)';c.lineWidth=8;c.beginPath();c.moveTo(ax,FY);c.lineTo(bx,FY);c.stroke();c.restore()}
  ev('boom',3.2,()=>{G.shake=24;burst(vx,vy,'#ffffff',30,1.8);burst(vx,vy,'#4fc3f7',26,1.4);ring(vx,vy,10,'#4fc3f7',0.5,7,90);sfx('shatter')});
  if(T>=3.2){fflash(c,0.6-(T-3.2)*3);fshatter(c,fsprite(F,'dead'),vx,vy,T-3.2,{pow:1.5,seed:7,up:60})}}},

rage:{n:'پرواز آخر',dur:3.9,draw(c,T,F,ev){const A=F.A,V=F.V;let vx=FVX,vy=FY,ax=FAX,sx=1,sy=1,vrot=Math.sin(G.clock*3)*0.08,vs=1,amood='angry';
  const hits=[0.45,0.67,0.89,1.11,1.33,1.55];let hi=-1;hits.forEach((h,i)=>{if(T>=h)hi=i});
  if(T<0.4){ax=FAX+Math.sin(G.clock*60)*2*sg(T,0,0.4)}
  else if(T<1.75){const ph=((T-0.4)%0.22)/0.22;ax=lerp(FAX+50,vx-A.r-V.r+4,Math.sin(ph*Math.PI));const k=hi>=0?Math.max(0,1-(T-hits[hi])/0.15):0;sx=1+k*0.35;sy=1-k*0.3;vx+=(hi%2?-1:1)*k*6;
    hits.forEach((h,i)=>ev('p'+i,h,()=>{const hx=vx-V.r,hy=vy+(i%2?-8:8);burst(hx,hy,'#ffffff',12,1.2);burst(hx,hy,'#ff8a5c',10,1);ring(hx,hy,4,'#fff',0.25,4,24);G.shake=9+i*2;sfx('punch')}))}
  else if(T<2.25){ax=lerp(vx-A.r-V.r,FAX+40,eo(sg(T,1.75,2.1)));sy=1-0.25*sg(T,1.9,2.2)}
  ev('up',2.3,()=>{G.shake=26;burst(vx,vy+V.r,'#ffffff',30,1.8);burst(vx,vy,'#ffb38a',30,1.5);ring(vx,vy,10,'#fff',0.45,7,80);sfx('uppercut')});
  if(T>=2.25){const q=T-2.3;ax=lerp(FAX+40,vx-6,eo(sg(T,2.25,2.32)));const ay=FY-Math.max(0,Math.sin(Math.min(1,sg(T,2.25,2.85))*Math.PI))*70;
    if(q>0){vy=FY-q*620;vx=FVX+q*60;vrot=q*14;vs=Math.max(0.15,1-q*0.9)}
    fball(c,A,{x:ax,y:ay,mood:'angry',sx:0.85,sy:1.2,look:-1.3});
    if(q<0.9)fball(c,V,{x:vx,y:vy,mood:'dead',rot:vrot,s:vs});
    if(T>3.05){const k=sg(T,3.05,3.3),tw=(1-sg(T,3.6,3.9))*(0.8+Math.sin(G.clock*20)*0.2);c.save();c.shadowColor='#fff';c.shadowBlur=18;c.fillStyle='#fff';star(c,VR-24,VT+30,14*k*tw,3*k,4);c.restore();ev('tw',3.05,()=>sfx('twinkle'))}
    return}
  fball(c,V,{x:vx,y:vy,mood:'hurt',sx,sy,rot:vrot});fball(c,A,{x:ax,y:FY,mood:amood,sx:T<0.4?1.08:1,sy:T<0.4?0.92:1})}},

vampire:{n:'آخرین قطره',dur:3.8,draw(c,T,F,ev){const A=F.A,V=F.V,ax=lerp(FAX,FVX-V.r*2.6,eo(sg(T,0,0.45))),dr=sg(T,0.5,2.4),vs=lerp(1,0.42,eio(dr));
  ev('s',0.5,()=>sfx('drain'));
  if(T>0.5&&T<2.45){for(let i=0;i<14;i++){const q=((G.clock*1.6+i/14)%1),px=lerp(FVX,ax,q),py=FY-Math.sin(q*Math.PI)*22+Math.sin(q*12+i)*4;c.fillStyle=i%2?'#e11d48':'#be123c';circ(c,px,py,2.6+Math.sin(q*Math.PI)*1.6);c.fill()}
    c.save();c.globalCompositeOperation='lighter';c.strokeStyle='rgba(225,29,72,.35)';c.lineWidth=10;c.beginPath();c.moveTo(FVX,FY);c.quadraticCurveTo((FVX+ax)/2,FY-26,ax,FY);c.stroke();c.restore()}
  const fall=sg(T,2.45,2.8),vy=FY+V.r*(1-vs)+eo(fall)*0+Math.abs(Math.sin(fall*Math.PI*2))*-8*(1-fall);
  fball(c,V,{x:FVX,y:vy,s:vs,mood:dr>0.6?'dead':'hurt',tint:`rgba(90,70,110,${dr*0.75})`,rot:Math.sin(G.clock*20)*0.05*(1-fall)*(dr>0?1:0)});
  if(dr>0.5){c.save();c.strokeStyle=`rgba(30,20,40,${(dr-0.5)})`;c.lineWidth=1.2;for(let i=0;i<5;i++){c.beginPath();c.arc(FVX+(i-2)*V.r*vs*0.3,vy+(i%2?-3:3),V.r*vs*0.35,0.2,2.6);c.stroke()}c.restore()}
  const grow=1+eo(dr)*0.22,burp=sg(T,2.9,3.2);fball(c,A,{x:ax,y:FY-(grow-1)*A.r,s:grow*(1+Math.sin(burp*Math.PI)*0.12),mood:'idle',emo:T>2.9&&T<3.4?'wow':T>3.4?'laugh':null});
  if(burp>0&&burp<1){ev('b',2.9,()=>sfx('burp'));c.save();c.globalAlpha=1-burp;c.strokeStyle='#fda4af';c.lineWidth=3;circ(c,ax+A.r*1.3,FY-A.r*0.4,6+burp*16);c.stroke();c.restore()}}},

tank:{n:'پرس',dur:3.9,draw(c,T,F,ev){const A=F.A,V=F.V;let ax=FAX,ay=FY,asx=1,asy=1;
  const crouch=sg(T,0,0.45),jump=sg(T,0.45,0.95),fall=sg(T,1.35,1.6);
  if(T<0.45){asx=1+crouch*0.18;asy=1-crouch*0.2}else if(T<1.35){ax=lerp(FAX,FVX,eo(jump));ay=FY-eo(jump)*360;asy=1.15;asx=0.9}
  ev('j',0.45,()=>sfx('jump'));
  const land=T>=1.6;
  if(T>=0.95&&T<1.6){const k=sg(T,0.95,1.6);c.fillStyle=`rgba(0,0,0,${0.15+k*0.45})`;c.beginPath();c.ellipse(FVX,FY+V.r*0.95,A.r*(0.4+k*0.8),A.r*(0.12+k*0.2),0,0,TAU);c.fill()}
  if(T>=1.35&&!land){ax=FVX;ay=lerp(FY-360,FY-V.r-A.r*0.4,ei(fall));asy=1.2;asx=0.85}
  ev('slam',1.6,()=>{G.shake=30;burst(FVX,FY+V.r,'#d6d3d1',36,1.6);ring(FVX,FY+V.r,10,'#e7e5e4',0.6,6,110);sfx('slam')});
  if(!land){fball(c,V,{x:FVX,y:FY,mood:T>0.95?'idle':'hurt',emo:T>0.95?'wow':null,look:-Math.PI/2});
    fball(c,A,{x:ax,y:ay,sx:asx,sy:asy,look:Math.PI/2});return}
  const flat=FY+V.r*0.85,fl=Math.sin(G.clock*7)*0.04*sg(T,2.6,3);
  fball(c,V,{x:FVX,y:flat,sx:1.9,sy:0.17+fl,mood:'dead'});
  const off=sg(T,2.1,2.6);ax=lerp(FVX,FVX-120,eo(off));ay=flat-V.r*0.17-A.r*0.85-Math.sin(off*Math.PI)*60;
  const bounce=Math.max(0,1-(T-1.6)/0.25);fball(c,A,{x:ax,y:ay,sx:1+bounce*0.3,sy:1-bounce*0.25,mood:off>0.9?'idle':'angry'});
  if(T>2.7){for(let i=0;i<3;i++){const q=G.clock*4+i/3*TAU;c.fillStyle='#fde047';star(c,FVX+Math.cos(q)*V.r*1.4,flat-12+Math.sin(q)*5,4,1.6,5)}}}},

poison:{n:'ذوب',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,cl=sg(T,0.1,0.9),melt=eio(sg(T,0.9,2.7));
  ev('g',0.1,()=>sfx('gas'));
  fball(c,A,{x:FAX,y:FY,mood:'idle',emo:T>2.9?'laugh':null,sx:1+Math.sin(cl*Math.PI)*0.12,sy:1-Math.sin(cl*Math.PI)*0.1});
  if(T>0.1&&T<1.6){for(let i=0;i<16;i++){const q=e01((T-0.1-i*0.04)/0.7),px=lerp(FAX+A.r,FVX,eo(q)),py=FY+(rnd(i)-0.5)*30*q;c.save();c.globalAlpha=0.55*(1-sg(T,1.1,1.6));c.fillStyle=i%2?'#7ee36b':'#3f9a35';circ(c,px,py,6+q*10);c.fill();c.restore()}}
  const base=FY+V.r,sy=lerp(1,0.16,melt),sx=lerp(1,2.1,melt),cy=base-V.r*sy;
  ev('m',0.9,()=>sfx('melt'));
  fball(c,V,{x:FVX,y:cy,sx,sy,mood:melt>0.8?'dead':'hurt',tint:`rgba(126,227,107,${cl*0.35+melt*0.4})`});
  if(melt>0&&melt<1){for(let i=0;i<6;i++){const q=((G.clock*0.9+i/6)%1),dx=FVX+(i-2.5)*V.r*sx*0.28;c.fillStyle='rgba(126,227,107,.85)';c.beginPath();c.ellipse(dx,cy+V.r*sy*0.3+q*V.r*1.1*sy+q*10,2.5,4+q*3,0,0,TAU);c.fill()}}
  if(T>1.6){const pu=sg(T,1.6,2.8);c.fillStyle=`rgba(80,180,70,${0.55*pu})`;c.beginPath();c.ellipse(FVX,base,V.r*(1.2+pu*1.1),V.r*0.22*(0.5+pu),0,0,TAU);c.fill();
    for(let i=0;i<5;i++){const q=((G.clock*1.2+i/5)%1),bx=FVX+(rnd(i+3)-0.5)*V.r*3;c.save();c.globalAlpha=pu*(1-q);c.strokeStyle='#bef264';c.lineWidth=1.5;circ(c,bx,base-q*14,2+q*4);c.stroke();c.restore();if(q>0.95)ev('pop'+i+Math.floor(G.clock),T,()=>{})}}}},

frost:{n:'یخ‌شکن',dur:3.9,draw(c,T,F,ev){const A=F.A,V=F.V,fr=sg(T,0.55,1.2),tap=sg(T,1.35,1.75),cr=sg(T,1.8,2.35),sh=T>=2.45;
  ev('w',0.05,()=>sfx('freeze'));
  if(T<1.3){for(let i=0;i<22;i++){const q=((T*1.4+i/22)%1),px=lerp(FAX+A.r,FVX,q),py=FY+Math.sin(q*9+i)*20*(1-q);c.fillStyle='rgba(224,251,255,.9)';circ(c,px,py,1.4+rnd(i)*2);c.fill()}}
  const ax=lerp(FAX,FVX-V.r*1.6-A.r-8,eo(tap))-Math.sin(sg(T,1.6,1.75)*Math.PI)*-6;
  fball(c,A,{x:ax,y:FY,mood:T>1.3?'angry':'idle'});
  if(!sh){fball(c,V,{x:FVX,y:FY,mood:'hurt',tint:`rgba(191,243,255,${fr*0.35})`});
    if(fr>0){const s=V.r*1.45*(0.6+0.4*eo(fr));c.save();c.globalAlpha=fr;const g=c.createLinearGradient(FVX-s,FY-s,FVX+s,FY+s);g.addColorStop(0,'rgba(240,253,255,.65)');g.addColorStop(1,'rgba(125,211,252,.45)');c.fillStyle=g;rrect(c,FVX-s,FY-s,2*s,2*s,8);c.fill();c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=2.5;c.stroke();
      c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=3;c.beginPath();c.moveTo(FVX-s*0.7,FY-s*0.5);c.lineTo(FVX-s*0.3,FY-s*0.85);c.stroke();
      if(cr>0){c.strokeStyle='rgba(255,255,255,.95)';c.lineWidth=1.6;for(let i=0;i<6;i++){c.beginPath();crackPath(c,FVX-s,FY+(rnd(i)-0.5)*s,i,s*2*cr)}}c.restore()}
    ev('tk',1.75,()=>{sfx('tink');burst(FVX-V.r*1.45,FY,'#e0fbff',8,0.6)});return}
  ev('sh',2.45,()=>{G.shake=26;burst(FVX,FY,'#e0fbff',40,1.8);ring(FVX,FY,10,'#bff3ff',0.5,7,100);sfx('shatter')});
  const p=T-2.45;fflash(c,0.7-p*3,'#e0fbff');fshatter(c,fsprite(F,'dead','rgba(191,243,255,.45)'),FVX,FY,p,{n:8,pow:1.6,seed:3,edge:'rgba(255,255,255,.9)'});
  for(let i=0;i<14;i++){const a=rnd(i+50)*TAU,v=120+rnd(i+60)*220,px=FVX+Math.cos(a)*v*p,py=FY+Math.sin(a)*v*p-100*p+300*p*p;c.save();c.globalAlpha=1-sg(p,0.8,1.3);c.translate(px,py);c.rotate(p*8+i);c.fillStyle='rgba(224,251,255,.9)';c.beginPath();c.moveTo(0,-6);c.lineTo(3,3);c.lineTo(-3,3);c.closePath();c.fill();c.restore()}}},

bomber:{n:'کادو',dur:4.2,draw(c,T,F,ev){const A=F.A,V=F.V,slide=eo(sg(T,0.3,0.8)),gx=lerp(FAX+A.r+12,FVX-V.r-14,slide),lid=sg(T,1.1,1.35),run=sg(T,1.3,1.9),boom=T>=2.1;
  let ax=lerp(FAX,FAX+20,sg(T,0,0.3))-eo(run)*130;
  fball(c,A,{x:ax,y:FY-Math.abs(Math.sin(run*Math.PI*4))*10*(run>0&&run<1?1:0),mood:'idle',emo:T>1.3?'laugh':null});
  if(!boom){fball(c,V,{x:FVX,y:FY,emo:T<1.5?(T>0.8?'love':null):'wow',mood:'hurt'});
    if(T>0.25){const gs=14,gy=FY+V.r-gs;c.fillStyle='#ec4899';c.fillRect(gx-gs,gy,gs*2,gs*2-2);c.fillStyle='#fde047';c.fillRect(gx-3,gy,6,gs*2-2);
      if(lid>0){const bx=gx,by=gy-6-lid*4;c.fillStyle='#1f2937';circ(c,bx,by,9);c.fill();c.strokeStyle='#c8a26b';c.lineWidth=2;c.beginPath();c.moveTo(bx,by-9);c.quadraticCurveTo(bx+4,by-16,bx+9,by-15);c.stroke();c.save();c.shadowColor='#ffb347';c.shadowBlur=10;c.fillStyle='#fff3c4';star(c,bx+9,by-15,4+Math.random()*2,1.5,6);c.restore();ev('fz',1.15,()=>sfx('fuse'))}
      c.save();c.translate(gx,gy-lid*30);c.rotate(-lid*1.2);c.fillStyle='#db2777';c.fillRect(-gs-2,-6,gs*2+4,7);c.fillStyle='#fde047';c.beginPath();c.ellipse(-5,-8,6,3.5,0.4,0,TAU);c.ellipse(5,-8,6,3.5,-0.4,0,TAU);c.fill();c.restore()}
    return}
  ev('bm',2.1,()=>{G.shake=34;burst(FVX,FY,'#ffb347',50,2.2);burst(FVX,FY,'#ff5a1f',40,1.8);burst(FVX,FY,'#3f3f46',30,1.2);ring(FVX,FY,10,'#ffd166',0.6,9,150);sfx('boom')});
  const p=T-2.1;fflash(c,0.9-p*2.5,'#fff3c4');
  if(p<0.6){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(FVX,FY,4,FVX,FY,30+p*200);g.addColorStop(0,`rgba(255,240,180,${1-p*1.6})`);g.addColorStop(0.5,`rgba(255,120,40,${0.8-p*1.3})`);g.addColorStop(1,'rgba(120,20,0,0)');c.fillStyle=g;circ(c,FVX,FY,30+p*200);c.fill();c.restore()}
  const st=sg(T,2.9,3.5);
  if(T<3.5){fball(c,V,{x:FVX,y:FY,char:0.92,rot:st*0});
    c.fillStyle='#18181b';for(let i=0;i<7;i++){circ(c,FVX+(i-3)*V.r*0.28,FY-V.r*0.95-Math.abs(i-3)*-2,V.r*0.22);c.fill()}
    if(T>2.6){for(let i=0;i<3;i++){const q=((G.clock*0.8+i/3)%1);c.fillStyle=`rgba(120,120,130,${0.6*(1-q)})`;circ(c,FVX+Math.sin(q*6+i)*6,FY-V.r*1.2-q*40,4+q*8);c.fill()}}
    if(T>2.8&&T<3.0)ev('cf',2.8,()=>sfx('cough'))}
  else{const q=sg(T,3.5,3.9);fball(c,V,{x:FVX+eo(q)*V.r*0.9,y:FY+eo(q)*V.r*0.25,rot:eo(q)*Math.PI/2,char:0.92});ev('tp',3.85,()=>{G.shake=8;burst(FVX+V.r,FY+V.r,'#52525b',14,0.8);sfx('thud')})}}},

lightning:{n:'خشم آسمان',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,dk=sg(T,0,0.6);
  c.fillStyle=`rgba(5,8,25,${dk*0.55})`;c.fillRect(-W,-H,W*3,H*3);
  for(let i=0;i<5;i++)fcloud(c,FVX-60+i*30+Math.sin(G.clock+i)*4,VT+22+(i%2)*8,22*dk,`rgba(${60+i*8},${66+i*8},${100+i*6},${dk})`);
  const st=[0.8,1.15,1.4,1.6,1.75,1.88];let on=false;st.forEach((s,i)=>{if(T>=s&&T<s+0.1){on=true;fbolt(c,FVX+(rnd(i)-0.5)*40,VT+30,FVX,FY-V.r*0.5,i+Math.floor(G.clock*20),3)}ev('z'+i,s,()=>{G.shake=12;burst(FVX,FY,'#c7d2fe',12,1.2);sfx('zap')})});
  fball(c,A,{x:FAX,y:FY-Math.sin(G.clock*3)*4*dk,mood:'angry',look:-0.6});
  const big=T>=2.1;
  if(!big){if(on&&Math.floor(G.clock*30)%2){fflash(c,0.25,'#c7d2fe');c.fillStyle='#0f172a';circ(c,FVX,FY,V.r);c.fill();c.fillStyle='#e2e8f0';c.beginPath();c.ellipse(FVX,FY-V.r*0.1,V.r*0.7,V.r*0.62,0,0,TAU);c.fill();c.fillStyle='#0f172a';for(const sd of[-1,1]){c.beginPath();c.ellipse(FVX+sd*V.r*0.28,FY-V.r*0.15,V.r*0.17,V.r*0.2,0,0,TAU);c.fill()}c.fillRect(FVX-V.r*0.06,FY+V.r*0.05,V.r*0.12,V.r*0.1);c.fillStyle='#e2e8f0';c.fillRect(FVX-V.r*0.35,FY+V.r*0.35,V.r*0.7,V.r*0.2);c.strokeStyle='#0f172a';c.lineWidth=1.5;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(FVX+i*V.r*0.13,FY+V.r*0.35);c.lineTo(FVX+i*V.r*0.13,FY+V.r*0.55);c.stroke()}}
    else fball(c,V,{x:FVX+(Math.random()-0.5)*(T>0.8?3:0),y:FY,mood:'hurt',char:sg(T,0.8,2)*0.5});return}
  ev('big',2.1,()=>{G.shake=32;burst(FVX,FY,'#ffffff',40,2);burst(FVX,FY,'#818cf8',40,1.6);ring(FVX,FY,10,'#c7d2fe',0.6,8,140);sfx('thunder')});
  const p=T-2.1;if(p<0.35)fbolt(c,FVX,VT,FVX,FY,77,7,1-p*2.5);fflash(c,1-p*3,'#e0e7ff');
  if(p<0.5){fball(c,V,{x:FVX,y:FY,char:0.95});for(let i=0;i<4;i++)fbolt(c,FVX,FY,FVX+Math.cos(i*1.6+G.clock*9)*40,FY+Math.sin(i*1.6+G.clock*9)*40,i+Math.floor(G.clock*30),1.2,0.8)}
  else fshatter(c,fsprite(F,'dead','rgba(20,15,30,.9)'),FVX,FY,p-0.5,{n:8,pow:1.3,seed:11,edge:'rgba(165,180,252,.9)'});
  ev('bz',2.6,()=>{burst(FVX,FY,'#a5b4fc',30,1.6);G.shake=14;sfx('crackle')})}},

mirror:{n:'هزار آینه',dur:3.6,draw(c,T,F,ev){const A=F.A,V=F.V,up=eo(sg(T,0,0.7)),sp=G.clock*(1+sg(T,0.8,1.6)*5),cl=ei(sg(T,1.6,1.9)),done=T>=1.9;
  ev('r',0.05,()=>sfx('chime'));
  fball(c,A,{x:FAX,y:FY,mood:'idle',emo:T>2.4?'love':null});
  if(!done){fball(c,V,{x:FVX,y:FY,mood:'hurt',rot:Math.sin(G.clock*4)*0.1});
    for(let i=0;i<6;i++){const a=i/6*TAU+sp,R2=lerp(V.r*2.6,V.r*1.1,cl),mx=FVX+Math.cos(a)*R2,my=FY+Math.sin(a)*R2*0.8+(1-up)*60;c.save();c.globalAlpha=up;c.translate(mx,my);c.rotate(a+Math.PI/2);
      const g=c.createLinearGradient(-8,-16,8,16);g.addColorStop(0,'#fdf2f8');g.addColorStop(0.5,'#f9a8d4');g.addColorStop(1,'#e0f2fe');c.fillStyle=g;c.beginPath();c.moveTo(0,-18);c.lineTo(8,0);c.lineTo(0,18);c.lineTo(-8,0);c.closePath();c.fill();c.strokeStyle='#9d174d';c.lineWidth=1.5;c.stroke();
      c.fillStyle='rgba(255,255,255,.9)';c.fillRect(-2,-10,2,8);c.restore()}
    if(T>0.8){c.save();c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const a1=i*1.7+G.clock*3,a2=a1+2.4,R2=lerp(V.r*2.6,V.r*1.1,cl);c.strokeStyle=`rgba(249,168,212,${0.5+Math.random()*0.4})`;c.lineWidth=2.5;c.beginPath();c.moveTo(FVX+Math.cos(a1)*R2,FY+Math.sin(a1)*R2*0.8);c.lineTo(FVX,FY);c.lineTo(FVX+Math.cos(a2)*R2,FY+Math.sin(a2)*R2*0.8);c.stroke()}c.restore();ev('bm',0.85,()=>sfx('beam'))}
    return}
  ev('sh',1.9,()=>{G.shake=26;burst(FVX,FY,'#fdf2f8',40,2);burst(FVX,FY,'#f9a8d4',30,1.5);ring(FVX,FY,8,'#f9a8d4',0.5,7,100);sfx('glass')});
  const p=T-1.9;fflash(c,0.8-p*3,'#fdf2f8');fshatter(c,fsprite(F,'dead'),FVX,FY,p,{n:9,pow:1.8,seed:5,edge:'rgba(253,242,248,.95)'});
  for(let i=0;i<26;i++){const a=rnd(i+80)*TAU,v=140+rnd(i+90)*260,px=FVX+Math.cos(a)*v*p,py=FY+Math.sin(a)*v*p-90*p+280*p*p;c.save();c.globalAlpha=1-sg(p,0.9,1.5);c.translate(px,py);c.rotate(p*10+i);c.fillStyle=i%3?'rgba(253,242,248,.9)':'#f9a8d4';c.beginPath();c.moveTo(0,-7);c.lineTo(4,4);c.lineTo(-3,2);c.closePath();c.fill();c.restore()}}},

ghost:{n:'تسخیر',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,mv=eio(sg(T,0,0.6)),pos=T>=0.6&&T<1.7,yank=sg(T,1.6,2.0),def=sg(T,2.0,3.2);
  ev('w',0.05,()=>sfx('whoosh'));
  const lev=sg(T,0.6,1.1)*26;
  if(T<0.6){fball(c,V,{x:FVX,y:FY,mood:'hurt'});fball(c,A,{x:lerp(FAX,FVX,mv),y:FY-Math.sin(mv*Math.PI)*30,a:0.75-mv*0.5})}
  else if(T<2.0){const sp=sg(T,0.9,1.6);fball(c,V,{x:FVX,y:FY-lev,rot:sp*sp*12,noFace:true});
    c.save();c.translate(FVX,FY-lev);c.rotate(sp*sp*12);c.shadowColor='#e9e7ff';c.shadowBlur=14;c.fillStyle='#ffffff';for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*V.r*0.3,-V.r*0.05,V.r*0.14,V.r*0.17,0,0,TAU);c.fill()}c.restore();
    c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(FVX,FY-lev,V.r*0.6,FVX,FY-lev,V.r*2);g.addColorStop(0,'rgba(167,139,250,.4)');g.addColorStop(1,'rgba(167,139,250,0)');c.fillStyle=g;circ(c,FVX,FY-lev,V.r*2);c.fill();c.restore();
    ev('p',0.65,()=>sfx('possess'));
    if(yank>0){const sy=FY-lev-eo(yank)*70;fball(c,V,{x:FVX,y:sy,a:0.55,s:1.05,mood:'hurt',tint:'rgba(233,231,255,.5)',glow:20});fball(c,A,{x:FVX+8,y:sy-V.r*1.5,a:0.9*yank,mood:'angry'});ev('y',1.65,()=>sfx('yank'))}}
  else{const soulY=FY-lev-70-(T-2.0)*45;fball(c,V,{x:FVX+Math.sin(G.clock*4)*8,y:soulY,a:0.55*(1-sg(T,3.0,3.7)),mood:'idle',emo:'cry',tint:'rgba(233,231,255,.5)',glow:20});
    fball(c,A,{x:lerp(FVX+8,FAX,eo(sg(T,2.0,2.6))),y:FY-lerp(lev+70+V.r*1.5,0,eo(sg(T,2.0,2.6))),a:0.9,emo:T>2.6?'laugh':null});
    const by=lerp(FY-lev,FY+V.r*0.9,eo(sg(T,2.0,2.35)));fball(c,V,{x:FVX,y:by,sx:lerp(1,1.6,def),sy:lerp(1,0.12,eo(def)),mood:'dead',a:1});ev('d',2.0,()=>sfx('deflate'))}}},

dragon:{n:'نفس اژدها',dur:4.2,draw(c,T,F,ev){const A=F.A,V=F.V,inh=sg(T,0,0.65),fire=T>=0.7&&T<2.1,ch=sg(T,0.8,2.0);
  ev('in',0.0,()=>sfx('inhale'));
  if(T<0.7){for(let i=0;i<10;i++){const q=((G.clock*2+i/10)%1),a=i/10*TAU;c.fillStyle='rgba(255,200,120,.6)';circ(c,FAX+Math.cos(a)*(1-q)*60,FY+Math.sin(a)*(1-q)*60,2);c.fill()}}
  fball(c,A,{x:FAX,y:FY,s:1+inh*0.18-(fire?0.08:0),mood:'angry'});
  if(fire){ev('f',0.7,()=>sfx('flame'));G.shake=Math.max(G.shake,6);c.save();c.globalCompositeOperation='lighter';
    for(let i=0;i<70;i++){const q=((G.clock*2.2+i/70)%1),px=lerp(FAX+A.r*0.9,FVX+V.r*1.8,q),spread=6+q*40,py=FY+(rnd(i*3.7)-0.5)*2*spread+Math.sin(i*7.1+G.clock*18)*6,rr=7+q*22;const g=c.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,`rgba(255,240,180,${0.9-q*0.5})`);g.addColorStop(0.5,`rgba(255,110,40,${0.7-q*0.4})`);g.addColorStop(1,'rgba(180,20,0,0)');c.fillStyle=g;circ(c,px,py,rr);c.fill()}c.restore()}
  if(T<2.9){fball(c,V,{x:FVX+(fire?(Math.random()-0.5)*3:0),y:FY,mood:'hurt',char:Math.min(0.95,ch*1.1)});
    if(T>2.1){for(let i=0;i<4;i++){const q=((G.clock*0.7+i/4)%1);c.fillStyle=`rgba(90,90,95,${0.6*(1-q)})`;circ(c,FVX+(i-1.5)*8+Math.sin(q*5+i)*5,FY-V.r-q*44,4+q*9);c.fill()}}
    if(T>2.4){const b=sg(T,2.45,2.85);c.save();c.globalAlpha=b*(1-sg(T,2.85,2.9));c.strokeStyle='rgba(200,200,210,.8)';c.lineWidth=2;c.beginPath();c.moveTo(FAX+A.r*1.2,FY-4);c.quadraticCurveTo((FAX+FVX)/2,FY-20,FVX-V.r,FY-4);c.stroke();c.restore();ev('pf',2.45,()=>sfx('puff'))}
    return}
  ev('cr',2.9,()=>{burst(FVX,FY,'#3f3f46',30,1);G.shake=10;sfx('crumble')});
  const p=T-2.9;fshatter(c,fsprite(F,'dead','rgba(28,22,20,.94)'),FVX,FY,p,{n:8,pow:0.35,seed:13,up:20,g:420,fade:2});
  c.fillStyle='#27272a';c.beginPath();c.ellipse(FVX,FY+V.r*0.95,V.r*1.1*eo(sg(p,0.1,0.6)),V.r*0.32*eo(sg(p,0.1,0.6)),0,Math.PI,0);c.fill()}},

porcupine:{n:'بادکنک',dur:3.8,draw(c,T,F,ev){const A=F.A,V=F.V,walk=sg(T,0,0.6),poke=sg(T,0.65,0.8),inf=sg(T,0.8,1.5),fly=T>=1.55;
  const ax=lerp(FAX,FVX-V.r-A.r-6,eo(walk));fball(c,A,{x:ax,y:FY-Math.abs(Math.sin(walk*Math.PI*5))*5,mood:'idle',emo:T>1.6?'laugh':null});
  if(poke>0&&!fly){c.strokeStyle='#f3e3c8';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(ax+A.r,FY);c.lineTo(ax+A.r+poke*16,FY);c.stroke();ev('pk',0.75,()=>sfx('poke'))}
  if(!fly){const s=1+eo(inf)*0.65+Math.sin(G.clock*30)*0.03*inf;fball(c,V,{x:FVX+(s-1)*V.r*0.6,y:FY-(s-1)*V.r,s,emo:inf>0?'wow':null,mood:'hurt'});ev('inf',0.8,()=>sfx('inflate'));return}
  ev('pop',1.55,()=>{G.shake=16;burst(FVX+V.r*0.4,FY-V.r*0.6,'#ffffff',22,1.4);sfx('pop')});
  const p=T-1.55,dur=1.3,q=Math.min(1,p/dur);
  if(p<dur){const px=FVX+Math.sin(p*9)*90*(1-q)+Math.sin(p*23)*12,py=FY-60-Math.cos(p*7)*70*(1-q)+q*q*80,ang=Math.atan2(Math.cos(p*9)*9*90,1)*0.3+p*12,s=lerp(1.6,0.45,q);
    c.save();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;for(let i=1;i<6;i++){const pp=p-i*0.03;const tx=FVX+Math.sin(pp*9)*90*(1-q)+Math.sin(pp*23)*12,ty=FY-60-Math.cos(pp*7)*70*(1-q)+q*q*80;c.globalAlpha=0.5-i*0.08;circ(c,tx,ty,3);c.stroke()}c.restore();
    fball(c,V,{x:px,y:py,s,rot:ang,emo:'wow',sx:1.1,sy:0.9});ev('ff',1.56,()=>sfx('fart'))}
  else{const k=sg(T,1.55+dur,1.55+dur+0.2);fball(c,V,{x:FVX+20,y:FY+V.r*0.85,sx:0.7,sy:0.25,mood:'dead',s:1});ev('lnd',1.55+dur,()=>sfx('splat'))}}},

whirlwind:{n:'سیلی شیشه‌ای',dur:4.1,draw(c,T,F,ev){const A=F.A,V=F.V,tw=sg(T,0,0.8),lift=sg(T,0.8,2.0);
  ev('t',0.05,()=>sfx('wind'));
  fball(c,A,{x:FAX,y:FY,rot:G.clock*16*tw,mood:'angry'});
  if(T<2.0){c.save();c.globalAlpha=tw;c.translate(FVX,FY-lift*40);for(let i=0;i<5;i++){c.strokeStyle=`rgba(204,251,241,${0.5-i*0.07})`;c.lineWidth=3;c.beginPath();c.ellipse(0,-i*12+20,V.r*(1.6+i*0.35),V.r*(0.35+i*0.05),0,G.clock*(8+i)%TAU,G.clock*(8+i)%TAU+4.5);c.stroke()}c.restore();
    const orb=lift*40,a=G.clock*14;fball(c,V,{x:FVX+Math.cos(a)*orb*0.6,y:FY-lift*60+Math.sin(a)*orb*0.15,rot:G.clock*20*lift,mood:'hurt'});return}
  const fly=sg(T,2.0,2.22);if(fly<1){fball(c,V,{x:lerp(FVX,W/2,fly),y:lerp(FY-60,H*0.5,fly),s:lerp(1,5,ei(fly)),rot:G.clock*20*(1-fly),mood:'hurt'});ev('fl',2.0,()=>sfx('whoosh'))}}
  ,screen(c,T,F,ev){const V=F.V;if(T<2.22)return;ev('sp',2.22,()=>{G.shake=30;sfx('splat')});const sl=ei(sg(T,2.7,4.1)),cx=W/2,cy=H*0.5+sl*H*0.8,R=W*0.34;
    c.save();c.globalAlpha=1-sg(T,3.7,4.1);c.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<5;i++){c.fillRect(cx-R*0.6+i*R*0.3,H*0.5-R*0.4,R*0.08,sl*H*0.8+R*0.4)}
    fball(c,V,{x:cx,y:cy,s:R/V.r,sx:1.08,sy:0.95,mood:'idle',emo:'cry',glow:0});
    c.globalCompositeOperation='lighter';c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(cx-R*0.45,cy-R*0.5,R*0.25,R*0.08,-0.6,0,TAU);c.fill();c.restore()}},

phoenix:{n:'خاکستر',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,rise=eo(sg(T,0,0.8)),beam=T>=0.8&&T<1.7,ash=sg(T,0.9,1.6),blow=sg(T,1.9,3.4);
  c.fillStyle=`rgba(255,140,40,${rise*0.12})`;c.fillRect(-W,-H,W*3,H*3);
  const ay=FY-rise*70;c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(FAX,ay,4,FAX,ay,90*rise);g.addColorStop(0,'rgba(255,230,150,.75)');g.addColorStop(1,'rgba(255,120,30,0)');c.fillStyle=g;circ(c,FAX,ay,90*rise);c.fill();c.restore();
  fball(c,A,{x:FAX,y:ay,s:1+rise*0.2,mood:'angry',glow:30});ev('r',0.05,()=>sfx('rise'));
  if(beam){ev('b',0.8,()=>{sfx('beam');G.shake=12});c.save();c.globalCompositeOperation='lighter';const w=V.r*1.5*(0.7+Math.sin(G.clock*30)*0.1),bg=c.createLinearGradient(FVX-w,0,FVX+w,0);bg.addColorStop(0,'rgba(255,200,80,0)');bg.addColorStop(0.5,'rgba(255,250,220,.95)');bg.addColorStop(1,'rgba(255,200,80,0)');c.fillStyle=bg;c.fillRect(FVX-w,-H,w*2,FY+V.r+H);c.restore()}
  if(blow<=0){fball(c,V,{x:FVX,y:FY,mood:ash>0.5?'dead':'hurt',tint:`rgba(${lerp(255,150,ash)},${lerp(240,145,ash)},${lerp(200,140,ash)},${Math.min(0.95,ash*1.1)})`});return}
  ev('bl',1.9,()=>sfx('wind'));
  const sp=fsprite(F,'dead','rgba(150,145,140,.95)'),cut=FVX-sp.R+blow*sp.R*2.2;c.save();c.beginPath();c.rect(cut,-H,W*2,H*3);c.clip();c.drawImage(sp.cv,FVX-sp.R,FY-sp.R,sp.R*2,sp.R*2);c.restore();
  for(let i=0;i<40;i++){const st=rnd(i)*1,q=(blow-st*0.8)/0.5;if(q<=0||q>1.6)continue;const y0=FY+(rnd(i+5)-0.5)*V.r*2,x0=FVX-V.r+st*V.r*2;c.fillStyle=`rgba(160,155,150,${1-q/1.6})`;circ(c,x0+q*130+Math.sin(q*6+i)*8,y0-q*40+Math.sin(q*9)*6,1.5+rnd(i+9)*2.5);c.fill()}
  for(let i=0;i<3;i++){const q=((T*0.4+i/3)%1);c.save();c.translate(FAX+(i-1)*30+Math.sin(q*8)*14,ay-20+q*140);c.rotate(Math.sin(q*6));c.globalAlpha=1-q;c.fillStyle='#ffb347';c.beginPath();c.ellipse(0,0,9,3,0,0,TAU);c.fill();c.restore()}}},

giant:{n:'گُل!',dur:3.9,draw(c,T,F,ev){const A=F.A,V=F.V,stomp=sg(T,0.1,0.35),run=sg(T,0.6,1.1),kick=T>=1.15,goal=sg(T,0.7,1.0);
  ev('st',0.3,()=>{G.shake=22;burst(FAX,FY+A.r,'#d6d3d1',24,1.3);ring(FAX,FY+A.r,10,'#e7e5e4',0.5,6,100);sfx('slam')});
  const nx=VR-2,ny=FY-50;c.save();c.globalAlpha=goal;c.strokeStyle='#f8fafc';c.lineWidth=4;c.beginPath();c.moveTo(nx-34,ny+100);c.lineTo(nx-34,ny);c.lineTo(nx+4,ny);c.stroke();
  const bul=Math.max(0,1-Math.abs(T-1.6)/0.35)*(T>1.5?1:0);c.strokeStyle='rgba(248,250,252,.45)';c.lineWidth=1.2;for(let i=0;i<6;i++){c.beginPath();c.moveTo(nx-34,ny+i*20);c.quadraticCurveTo(nx-12+bul*16,ny+i*20+6,nx+4,ny+i*20);c.stroke()}for(let i=0;i<3;i++){c.beginPath();c.moveTo(nx-24+i*10,ny);c.lineTo(nx-24+i*10+bul*10,ny+100);c.stroke()}c.restore();
  let ax=FAX,ay=FY;if(T<0.35){ay=FY-Math.sin(stomp*Math.PI)*24}else if(T<1.2){ax=lerp(FAX,FVX-A.r-V.r+4,eio(run));ay=FY-Math.abs(Math.sin(run*Math.PI*3))*8}else{ax=FVX-A.r-V.r+4-eo(sg(T,1.2,1.6))*30;ay=FY}
  if(!kick){const hop=T>0.3?Math.abs(Math.sin((T-0.3)*7))*40*Math.max(0,1-(T-0.3)/0.9):0;fball(c,V,{x:FVX,y:FY-hop,mood:'hurt',rot:hop*0.02});}
  else{const q=sg(T,1.15,1.55),bx=lerp(FVX,nx-14,q),by=FY-Math.sin(q*Math.PI)*90+(T>1.55?eo(sg(T,1.55,1.9))*(FY+V.r*0.3-(ny+80))*0:0)-(1-q)*0;ev('k',1.15,()=>{G.shake=18;burst(FVX-V.r,FY,'#ffffff',20,1.3);sfx('kick')});
    const sy=T>1.55?lerp(ny+50,FY+V.r*0.2,eo(sg(T,1.6,2.0))):by;fball(c,V,{x:T>1.55?nx-14:bx,y:sy,rot:T*18,mood:'dead',s:0.9})}
  fball(c,A,{x:ax,y:ay,mood:T>1.7?'idle':'angry',emo:T>1.7?'laugh':null,sx:kick&&T<1.3?1.15:1,sy:kick&&T<1.3?0.88:1});
  ev('g',1.65,()=>{sfx('goal');G.shake=10});
  if(T>1.65){const q=sg(T,1.65,1.95);fconf(c,nx-20,ny+30,T-1.65,40,21,['#facc15','#f43f5e','#38bdf8','#4ade80','#fff'],1.2);c.save();c.translate(W*0.5,H*0.3);c.scale(easeOutBack(q)*1.0,easeOutBack(q));c.rotate(-0.08);c.font='54px Lalezar, Vazirmatn, sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=8;c.strokeStyle='#071233';c.strokeText('گُل!',0,0);c.fillStyle='#facc15';c.fillText('گُل!',0,0);c.restore()}}},

fairy:{n:'گلدان',dur:4.2,draw(c,T,F,ev){const A=F.A,V=F.V,wave=sg(T,0,0.6),vine=sg(T,0.55,1.4),sink=eio(sg(T,1.7,2.3)),bloom=eo(sg(T,2.4,3.3));
  fball(c,A,{x:FAX,y:FY-6-Math.sin(G.clock*3)*4,mood:'idle',emo:T>3.2?'love':null});ev('m',0.05,()=>sfx('magic'));
  if(T<1.2){for(let i=0;i<12;i++){const q=e01((T-i*0.04)/0.7);if(q<=0||q>=1)continue;c.fillStyle=i%2?'#fde047':'#f9a8d4';star(c,lerp(FAX+A.r,FVX,q),FY-Math.sin(q*Math.PI)*40+Math.sin(i)*8,4,1.5,4)}}
  const potY=FY+V.r*0.6,potIn=sg(T,1.5,1.75);
  if(T<2.4){const vs=1-sink*0.4;fball(c,V,{x:FVX,y:lerp(FY,potY+V.r*0.3,sink),s:vs,mood:'hurt'});
    if(vine>0){c.save();c.strokeStyle='#15803d';c.lineWidth=3.5;c.lineCap='round';for(let j=0;j<3;j++){c.beginPath();const n=Math.floor(40*vine);for(let i=0;i<=n;i++){const q=i/40,a=q*TAU*2+j*2.1,rr=V.r*vs*(1.15-q*0.15),py=lerp(FY,potY+V.r*0.3,sink)+V.r*vs*(1-q*2)*0.9;const px=FVX+Math.cos(a)*rr;i?c.lineTo(px,py+Math.sin(a)*rr*0.25):c.moveTo(px,py)}c.stroke()}
      c.fillStyle='#4ade80';for(let i=0;i<Math.floor(10*vine);i++){const a=i*1.3;c.beginPath();c.ellipse(FVX+Math.cos(a)*V.r*1.1,FY+V.r*(0.8-i*0.17),4,2,a,0,TAU);c.fill()}c.restore();ev('v',0.6,()=>sfx('vines'))}}
  if(potIn>0){c.save();c.globalAlpha=potIn;const py=potY;c.fillStyle='#c2410c';c.beginPath();c.moveTo(FVX-V.r*1.2,py);c.lineTo(FVX+V.r*1.2,py);c.lineTo(FVX+V.r*0.9,py+V.r*1.3);c.lineTo(FVX-V.r*0.9,py+V.r*1.3);c.closePath();c.fill();c.fillStyle='#ea580c';rrect(c,FVX-V.r*1.35,py-8,V.r*2.7,12,4);c.fill();c.restore();ev('pt',1.5,()=>sfx('pot'))}
  if(T>=2.4){const sh=potY-8,top=sh-bloom*V.r*2.4;c.strokeStyle='#16a34a';c.lineWidth=5;c.beginPath();c.moveTo(FVX,sh);c.quadraticCurveTo(FVX+8,(sh+top)/2,FVX,top);c.stroke();
    c.fillStyle='#22c55e';for(const sd of[-1,1]){c.beginPath();c.ellipse(FVX+sd*12,(sh+top)/2+6,12*bloom,5*bloom,sd*0.5,0,TAU);c.fill()}
    for(let i=0;i<14;i++){const a=i/14*TAU+G.clock*0.3;c.save();c.translate(FVX+Math.cos(a)*V.r*0.95*bloom,top+Math.sin(a)*V.r*0.95*bloom);c.rotate(a);c.fillStyle=i%2?'#facc15':'#fde047';c.beginPath();c.ellipse(V.r*0.35*bloom,0,V.r*0.5*bloom,V.r*0.2*bloom,0,0,TAU);c.fill();c.restore()}
    fball(c,V,{x:FVX,y:top,s:0.75*Math.max(0.01,bloom),mood:'dead',tint:'rgba(120,53,15,.45)'});ev('bl',2.4,()=>sfx('bloom'));
    if(bloom>=1){for(let i=0;i<3;i++){const q=G.clock*2+i*2;c.fillStyle='#fde047';star(c,FVX+Math.cos(q)*V.r*1.9,top+Math.sin(q*1.3)*V.r*1.2,3.5,1.4,4)}}}}},

mooncat:{n:'نُه چنگ',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,cr=sg(T,0,0.3),go=T>=0.35&&T<1.3,cut=T>=2.35;
  const slashes=[];for(let i=0;i<9;i++)slashes.push({t:0.4+i*0.09,a:rnd(i+40)*Math.PI});
  if(T<0.35){fball(c,A,{x:FAX,y:FY+cr*4,sx:1+cr*0.2,sy:1-cr*0.2,mood:'angry'});if(cr>0.6){c.save();c.shadowColor='#fff';c.shadowBlur=12;c.fillStyle='#fff';star(c,FAX+A.r*0.45,FY-A.r*0.15,10*(1-Math.abs(cr-0.8)*4),2,4);c.restore();ev('gl',0.25,()=>sfx('glint'))}}
  else if(go){slashes.forEach((s,i)=>{if(T>=s.t&&T<s.t+0.18){const k=(T-s.t)/0.18,px=FVX+Math.cos(s.a+Math.PI/2)*V.r*1.9*(i%2?1:-1);fball(c,A,{x:px,y:FY+Math.sin(s.a)*V.r*0.4,a:0.45*(1-k),mood:'angry'})}ev('s'+i,s.t,()=>{sfx('slash');G.shake=6})})}
  else{const land=sg(T,1.3,1.45);fball(c,A,{x:FAX+10,y:FY,sx:1+(1-land)*0.25,sy:1-(1-land)*0.2,look:Math.PI,mood:'idle'});if(T<1.45){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=`rgba(199,210,254,${1-land})`;c.lineWidth=6;c.beginPath();c.moveTo(FVX+V.r*1.5,FY);c.lineTo(FAX+10,FY);c.stroke();c.restore()}}
  if(!cut){fball(c,V,{x:FVX,y:FY,mood:T>1.3?'static':'hurt',noFace:T>1.3});
    if(T>1.3){c.fillStyle='#141a2e';for(const sd of[-1,1]){circ(c,FVX+sd*V.r*0.3-V.r*0.15,FY-V.r*0.05,V.r*0.04);c.fill()}}
    c.save();c.globalCompositeOperation='lighter';slashes.forEach(s=>{if(T<s.t)return;const k=T-s.t,al=k<0.15?1:Math.max(0,0.35-(k-0.15)*0.4);if(al<=0)return;c.strokeStyle=`rgba(255,255,255,${al})`;c.shadowColor='#c7d2fe';c.shadowBlur=12;c.lineWidth=k<0.1?4:2;c.beginPath();c.moveTo(FVX-Math.cos(s.a)*V.r*1.6,FY-Math.sin(s.a)*V.r*1.6);c.lineTo(FVX+Math.cos(s.a)*V.r*1.6*Math.min(1,k*12),FY+Math.sin(s.a)*V.r*1.6*Math.min(1,k*12));c.stroke()});c.restore();
    if(T>2.0){const th=0.62,k=sg(T,2.0,2.35);c.save();c.globalCompositeOperation='lighter';c.strokeStyle=`rgba(255,255,255,${k})`;c.shadowColor='#fde68a';c.shadowBlur=14;c.lineWidth=1.5+k*2;for(const d of[-V.r*0.35,V.r*0.35]){const nx=-Math.sin(th),ny=Math.cos(th);c.beginPath();c.moveTo(FVX-Math.cos(th)*V.r*1.3+nx*d,FY-Math.sin(th)*V.r*1.3+ny*d);c.lineTo(FVX+Math.cos(th)*V.r*1.3+nx*d,FY+Math.sin(th)*V.r*1.3+ny*d);c.stroke()}c.restore();ev('sl',2.0,()=>sfx('sheathe'))}
    return}
  ev('ct',2.35,()=>{G.shake=22;burst(FVX,FY,'#ffffff',26,1.5);sfx('cut')});fflash(c,0.6-(T-2.35)*3,'#fff');fslice(c,fsprite(F,'dead'),FVX,FY,T-2.35,0.62,V.r*0.35)}},

mermaid:{n:'ماهی کوچولو',dur:4.3,draw(c,T,F,ev){const A=F.A,V=F.V,wl=eo(sg(T,0,0.7)),bub=sg(T,0.6,1.1),sing=T>=1.1&&T<2.0,sh=sg(T,1.2,2.0),pop=T>=2.05;
  const lvl=lerp(H+40,FY+V.r*0.6,wl);ev('w',0.05,()=>sfx('water'));
  fball(c,A,{x:FAX,y:FY-6+Math.sin(G.clock*3)*3,mood:'idle',emo:T>2.4?'laugh':null});
  if(sing){for(let i=0;i<6;i++){const q=((G.clock*0.9+i/6)%1);fnote(c,lerp(FAX+A.r,FVX,q),FY-30-Math.sin(q*Math.PI)*30+Math.sin(q*10+i)*6,1,i%2?'#f472b6':'#a5f3fc')}ev('sg',1.1,()=>sfx('sing'))}
  const by=FY-eo(bub)*40,bs=lerp(1,0.4,eio(sh));
  if(!pop){fball(c,V,{x:FVX,y:by,s:bs,emo:'wow',mood:'hurt'});if(bub>0){c.save();c.globalAlpha=bub;const R=V.r*1.5*bs;const g=c.createRadialGradient(FVX-R*0.4,by-R*0.4,2,FVX,by,R);g.addColorStop(0,'rgba(255,255,255,.4)');g.addColorStop(0.7,'rgba(165,243,252,.1)');g.addColorStop(1,'rgba(103,232,249,.55)');c.fillStyle=g;circ(c,FVX,by,R);c.fill();c.strokeStyle='rgba(224,250,255,.95)';c.lineWidth=2;c.stroke();c.restore();ev('bb',0.6,()=>sfx('bubble'))}}
  else{ev('pp',2.05,()=>{burst(FVX,by,'#cffafe',22,1.2);sfx('pop')});const p=T-2.05,fx=FVX+Math.sin(p*2.6)*60,fy=Math.min(lvl+20+Math.sin(p*3.4)*10,by+p*p*300),dir=Math.cos(p*2.6)>=0?1:-1;
    c.save();c.translate(fx,fy);c.scale(dir,1);const fr=V.r*0.55;const tw=Math.sin(G.clock*14)*0.35;c.fillStyle=F.V.c2||'#000';
    const P=CLASSES[V.cls],SK=V.skin?SKINS[V.skin]:null,c1=SK?SK.c1:P.c1,c2=SK?SK.c2:P.c2;c.fillStyle=c2;c.save();c.translate(-fr*0.9,0);c.rotate(tw);c.beginPath();c.moveTo(0,0);c.lineTo(-fr*0.9,-fr*0.6);c.lineTo(-fr*0.9,fr*0.6);c.closePath();c.fill();c.restore();
    const g=c.createRadialGradient(-fr*0.3,-fr*0.3,1,0,0,fr*1.2);g.addColorStop(0,mix(c1,'#ffffff',0.4));g.addColorStop(1,c2);c.fillStyle=g;c.beginPath();c.ellipse(0,0,fr*1.15,fr*0.8,0,0,TAU);c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#fff';circ(c,fr*0.45,-fr*0.15,fr*0.28);c.fill();c.fillStyle='#141a2e';circ(c,fr*0.5,-fr*0.15,fr*0.14);c.fill();c.fillStyle='#141a2e';c.beginPath();c.ellipse(fr*0.95,fr*0.2,fr*0.1,fr*0.14,0,0,TAU);c.fill();c.restore();
    if(fy>lvl){for(let i=0;i<2;i++){const q=((G.clock*1.5+i/2)%1);c.strokeStyle=`rgba(224,250,255,${0.8*(1-q)})`;c.lineWidth=1.2;circ(c,fx+dir*V.r*0.6,fy-q*20,2+q*3);c.stroke()}}ev('sp',2.3,()=>sfx('splash'))}
  if(wl>0){c.save();c.fillStyle='rgba(56,189,248,.38)';c.beginPath();c.moveTo(-W,H*2);c.lineTo(-W,lvl);for(let x=-W;x<=W*2;x+=12)c.lineTo(x,lvl+Math.sin(x*0.05+G.clock*3)*4);c.lineTo(W*2,H*2);c.closePath();c.fill();c.strokeStyle='rgba(224,250,255,.75)';c.lineWidth=2;c.beginPath();for(let x=-W;x<=W*2;x+=12)x===-W?c.moveTo(x,lvl+Math.sin(x*0.05+G.clock*3)*4):c.lineTo(x,lvl+Math.sin(x*0.05+G.clock*3)*4);c.stroke();c.restore()}}},

unicorn:{n:'انفجار رنگین‌کمان',dur:4.1,draw(c,T,F,ev){const A=F.A,V=F.V,chg=sg(T,0,0.6),beam=T>=0.6&&T<1.65,inf=sg(T,1.6,2.1),ex=T>=2.15;
  const hx=FAX+A.r*0.35,hy=FY-A.r*1.65;fball(c,A,{x:FAX,y:FY-(ex?Math.abs(Math.sin((T-2.15)*7))*20*(1-sg(T,2.15,3.5)):0),mood:'idle',emo:ex?'laugh':null});
  if(T<0.65){for(let i=0;i<10;i++){const q=((G.clock*1.8+i/10)%1),a=i/10*TAU;c.fillStyle=RAINBOW[i%6];star(c,hx+Math.cos(a)*(1-q)*50,hy+Math.sin(a)*(1-q)*50,3,1.2,4)}c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(hx,hy,1,hx,hy,22*chg);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(245,208,254,0)');c.fillStyle=g;circ(c,hx,hy,22*chg);c.fill();c.restore();ev('c',0.0,()=>sfx('charge'))}
  if(beam){ev('b',0.6,()=>sfx('rainbow'));c.save();c.globalCompositeOperation='lighter';RAINBOW.forEach((col,i)=>{c.strokeStyle=col;c.globalAlpha=0.75;c.lineWidth=4;c.beginPath();for(let s=0;s<=20;s++){const q=s/20,px=lerp(hx,FVX,q),py=lerp(hy,FY,q)+(i-2.5)*4*Math.sin(q*Math.PI)+Math.sin(q*14-G.clock*20+i)*2;s?c.lineTo(px,py):c.moveTo(px,py)}c.stroke()});c.restore();
    for(let i=0;i<4;i++){const q=((G.clock*1.4+i/4)%1);c.globalAlpha=1-q;c.fillStyle='#f472b6';heartPath(c,FVX+(i-1.5)*14,FY-V.r-q*30,4+q*3);c.fill();c.globalAlpha=1}}
  if(!ex){const s=1+eo(inf)*0.45+Math.sin(G.clock*40)*0.03*inf,pa=sg(T,0.6,1.6);fball(c,V,{x:FVX,y:FY-(s-1)*V.r,s,emo:T>0.8?'love':null,mood:'hurt',tint:`hsla(${(G.clock*200)%360},90%,80%,${pa*0.4})`,glow:10+inf*30});return}
  ev('ex',2.15,()=>{G.shake=26;burst(FVX,FY,'#ffffff',30,1.8);RAINBOW.forEach(col=>burst(FVX,FY,col,10,1.6));ring(FVX,FY,10,'#f5d0fe',0.6,8,120);sfx('confetti')});
  fflash(c,0.7-(T-2.15)*3,'#fdf4ff');fconf(c,FVX,FY,T-2.15,70,3,RAINBOW.concat(['#ffffff','#fde68a']),1.3);
  for(let i=0;i<8;i++){const p=T-2.15,a=rnd(i+30)*TAU,v=100+rnd(i+33)*150,px=FVX+Math.cos(a)*v*p,py=FY+Math.sin(a)*v*p-150*p+330*p*p;c.save();c.globalAlpha=1-sg(p,1.3,1.9);c.translate(px,py);c.rotate(p*5+i);c.fillStyle=RAINBOW[i%6];c.beginPath();c.ellipse(0,0,7,4.5,0,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.7)';c.fillRect(-1.5,-4.5,3,9);c.fillStyle=RAINBOW[(i+2)%6];for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*6,0);c.lineTo(sd*11,-4);c.lineTo(sd*11,4);c.closePath();c.fill()}c.restore()}}},

gordafarid:{n:'نیزهٔ پهلوان',dur:4.0,draw(c,T,F,ev){const A=F.A,V=F.V,back=sg(T,0,0.5),thr=T>=0.6,wallX=VR-14-V.r;const PX=VR-14;c.save();const pg=c.createLinearGradient(PX,0,PX+40,0);pg.addColorStop(0,'#a8a29e');pg.addColorStop(1,'#57534e');c.fillStyle=pg;c.fillRect(PX,FY-90,40,90+V.r+6);c.fillStyle='#d6d3d1';c.fillRect(PX-4,FY-98,48,10);c.fillRect(PX-4,FY+V.r,48,8);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.5;for(let i=0;i<4;i++){c.beginPath();c.moveTo(PX+8+i*9,FY-88);c.lineTo(PX+8+i*9,FY+V.r);c.stroke()}c.restore();
  let ax=FAX-eo(back)*18;const spr=(x,y,a,L)=>{c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#92400e';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-L,0);c.lineTo(8,0);c.stroke();c.fillStyle='#e2e8f0';c.beginPath();c.moveTo(24,0);c.lineTo(6,7);c.lineTo(6,-7);c.closePath();c.fill();c.strokeStyle='#475569';c.lineWidth=1.2;c.stroke();c.fillStyle='#dc2626';c.beginPath();c.moveTo(4,0);c.lineTo(-4,8+Math.sin(G.clock*30)*2);c.lineTo(-1,0);c.lineTo(-4,-8-Math.sin(G.clock*30)*2);c.closePath();c.fill();c.restore()};
  if(!thr){spr(ax-6,FY-A.r*0.9,-0.25-back*0.3,46);fball(c,A,{x:ax,y:FY,mood:'angry',sx:1-back*0.1,sy:1+back*0.06})}
  else fball(c,A,{x:ax+eo(sg(T,0.6,0.8))*22,y:FY,mood:'angry',emo:T>2.2?'thumb':null});
  ev('th',0.6,()=>sfx('throw'));
  const fl=sg(T,0.6,0.72),pin=sg(T,0.72,1.05),pinned=T>=1.05,crumble=T>=2.7;
  if(!thr){fball(c,V,{x:FVX,y:FY,mood:'hurt',rot:Math.sin(G.clock*3)*0.08});return}
  if(fl<1){spr(lerp(ax+A.r,FVX-V.r,fl),FY,0,46);fball(c,V,{x:FVX,y:FY,mood:'hurt'});return}
  ev('hit',0.72,()=>{G.shake=18;burst(FVX-V.r,FY,'#ffffff',16,1.3);sfx('stab')});
  const vx=lerp(FVX,wallX,eo(pin)),wob=pinned?Math.sin((T-1.05)*18)*Math.max(0,1-(T-1.05)/1.2)*0.12:0;
  ev('pin',1.05,()=>{G.shake=28;burst(PX,FY,'#d6d3d1',30,1.5);sfx('slam')});
  if(pinned){c.save();c.strokeStyle='rgba(30,20,15,.85)';c.lineWidth=2.2;for(let i=0;i<7;i++){c.beginPath();c.moveTo(PX,FY);crackPath(c,PX+4,FY,i+20,lerp(10,40,sg(T,1.05,2.6)),0)}c.restore()}
  if(!crumble){c.save();c.translate(PX+6,FY);c.rotate(wob);spr(0,0,0,lerp(46,90,eo(pin))+0);c.restore();fball(c,V,{x:vx,y:FY,rot:wob,mood:pinned?'dead':'hurt'});
    return}
  ev('cm',2.7,()=>{G.shake=16;sfx('crumble')});const p=T-2.7;c.save();c.translate(PX+6,FY);spr(0,0,0,90);c.restore();fshatter(c,fsprite(F,'dead'),wallX,FY,p,{n:7,pow:0.6,seed:17,up:30,g:600})}},

butterfly:{n:'پیلهٔ ابدی',dur:4.3,draw(c,T,F,ev){const A=F.A,V=F.V,sw=sg(T,0,0.6),wrap=sg(T,0.6,1.5),wig=T>=1.5&&T<2.45,hatch=T>=2.45;
  fball(c,A,{x:FAX,y:FY-6+Math.sin(G.clock*4)*5,mood:'idle',emo:T>2.6?'laugh':null});ev('sw',0.05,()=>sfx('flutter'));
  const bf=(x,y,s,col)=>{const fl=0.4+Math.abs(Math.sin(G.clock*24+x))*0.6;c.save();c.translate(x,y);c.fillStyle=col;for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*4*fl*s,-2*s,4.5*fl*s,4*s,sd*0.5,0,TAU);c.fill();c.beginPath();c.ellipse(sd*3*fl*s,3*s,3*fl*s,2.6*s,-sd*0.4,0,TAU);c.fill()}c.fillStyle='#1c1917';c.fillRect(-0.8*s,-4*s,1.6*s,9*s);c.restore()};
  if(T<1.6){for(let i=0;i<10;i++){const a=G.clock*(2+i*0.15)+i,rr=lerp(110,V.r*1.5,eo(sw))+Math.sin(G.clock*3+i)*8;bf(lerp(FAX,FVX,eo(sw))+Math.cos(a)*rr,FY+Math.sin(a)*rr*0.6,1.1,i%2?'#fdba74':'#fde68a')}}
  const cx=FVX,cy=FY+(wig?Math.sin(G.clock*30)*2:0),crot=wig?Math.sin(G.clock*24)*0.12*sg(T,1.6,2.4):0,cW=V.r*1.15,cH=V.r*1.45;
  if(!hatch||T<2.9){if(wrap<1)fball(c,V,{x:FVX,y:FY,mood:'hurt',emo:wrap>0.3?'wow':null});
    if(wrap>0){c.save();c.translate(cx,cy);c.rotate(crot);c.globalAlpha=Math.min(1,wrap*1.4);const g=c.createLinearGradient(0,-cH,0,cH);g.addColorStop(0,'#fef3c7');g.addColorStop(1,'#d6b98c');c.fillStyle=g;c.beginPath();c.ellipse(0,0,cW,cH*(0.6+0.4*wrap),0,0,TAU);c.fill();
      c.strokeStyle='rgba(146,110,60,.6)';c.lineWidth=1.6;const n=Math.floor(12*wrap);for(let i=0;i<n;i++){const yy=-cH*0.8+i*cH*0.14;c.beginPath();c.moveTo(-cW,yy+4);c.quadraticCurveTo(0,yy-6,cW,yy+6);c.stroke()}
      if(hatch){const k=sg(T,2.45,2.9);c.strokeStyle='#78350f';c.lineWidth=2;c.beginPath();c.moveTo(0,-cH);c.lineTo(-6,-cH*0.5);c.lineTo(5,-cH*0.1);c.lineTo(-4,cH*0.3*k);c.stroke()}c.restore();ev('wr',0.6,()=>sfx('wrap'))}
    if(wig)ev('wg',1.5,()=>sfx('wiggle'))}
  if(hatch){ev('h',2.45,()=>{burst(cx,cy-cH,'#fef3c7',18,1);sfx('hatch')});const k=sg(T,2.9,3.1);
    for(const sd of[-1,1]){c.save();c.translate(cx+sd*eo(k)*14,cy+eo(k)*8);c.rotate(sd*eo(k)*0.5);c.fillStyle='#e7d3a8';c.beginPath();c.ellipse(0,0,cW*0.55,cH,0,sd<0?Math.PI*0.5:-Math.PI*0.5,sd<0?Math.PI*1.5:Math.PI*0.5);c.fill();c.restore()}
    const p=T-2.6;if(p>0){const mx=cx+Math.sin(p*5)*30+p*30,my=cy-cH-p*70+Math.sin(p*11)*8,s=0.45;const fl=0.5+Math.abs(Math.sin(G.clock*20))*0.5;
      c.save();c.translate(mx,my);c.fillStyle='rgba(168,162,158,.9)';for(const sd of[-1,1]){c.beginPath();c.ellipse(sd*V.r*0.55*fl,-4,V.r*0.55*fl,V.r*0.45,sd*0.4,0,TAU);c.fill()}c.restore();
      fball(c,V,{x:mx,y:my,s,emo:'cry',mood:'hurt',glow:0})}}}}
};
function crackPath(c,x,y,seed,len,base){let a=base==null?rnd(seed)*TAU:base+(rnd(seed)-0.5)*1.6;c.moveTo(x,y);for(let i=0;i<5;i++){a+=(rnd(seed+i*3.3)-0.5)*1.0;x+=Math.cos(a)*len/5;y+=Math.sin(a)*len/5;c.lineTo(x,y)}c.stroke()}

function startFinish(w,A0,V0){
  const A=A0||G.f[w],V=V0||G.f[1-w];
  Object.assign(G,{arrows:[],zones:[],mines:[],drops:[],beams:[],bolts:[],pups:[],emo:[],banner:null,slow:0,hitstop:0,ins:0,phase:'finish'});
  G.f.forEach(f=>{f.aura=null});
  const P=(f,look)=>({cls:f.cls,skin:f.skin||'',r:f.r,x0:f.x,y0:f.y,look});
  G.fin={w,stage:'prompt',t:0,T:0,A:P(A,0),V:P(V,Math.PI),ev:{},k:A.cls,botGo:w===1&&Math.random()<0.8?1.0+Math.random()*0.9:-1};
  $('#emoPanel').hidden=true;
  if(w===0){const b=$('#finBtn');b.hidden=false;b.style.setProperty('--p',1)}
  sfx('finishHim');musicDuck(true);
}
function finGo(){const F=G&&G.fin;if(!F||F.stage!=='prompt')return;F.stage='play';F.T=0;F.ev={};$('#finBtn').hidden=true;sfx('finGo')}
function finUpdate(dt){const F=G.fin;F.t+=dt;
  if(F.stage==='prompt'){const left=FIN_PROMPT-F.t;if(F.w===0)$('#finBtn').style.setProperty('--p',Math.max(0,left/FIN_PROMPT));
    if(F.botGo>0&&F.t>=F.botGo)finGo();else if(left<=0){F.stage='fall';F.T=0;$('#finBtn').hidden=true;sfx('thud')}}
  else if(F.stage==='play'){F.T+=dt;if(F.T>=FIN[F.k].dur){F.stage='title';F.tt=0;sfx('fatality')}}
  else{F.T+=dt;if(F.stage==='title')F.tt+=dt;const end=F.stage==='title'?2.3:1.3;if((F.stage==='title'?F.tt:F.T)>=end&&!F.done){F.done=true;musicDuck(false);finishMatch(F.w===0,false)}}
}
function finCam(){const F=G.fin,z=1+(FCAM-1)*eo(sg(F.t,0,0.7));ctx.translate(W/2,H*0.55);ctx.scale(z,z);ctx.translate(-W/2,H*-0.55);
  const g=ctx.createRadialGradient(W/2,H*0.55,W*0.15,W/2,H*0.55,W*0.75);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=g;ctx.fillRect(-W,-H,W*3,H*3)}
function drawFin(){const F=G.fin,c=ctx,ev=(id,at,fn)=>{if(F.T>=at&&!F.ev[id]){F.ev[id]=1;fn()}};
  if(F.stage==='prompt'||F.stage==='fall'){const q=eo(sg(F.t,0,0.7)),ax=lerp(F.A.x0,FAX,q),ay=lerp(F.A.y0,FY,q),vx=lerp(F.V.x0,FVX,q),vy=lerp(F.V.y0,FY,q);
    fshadow(c,ax,ay,F.A.r);fball(c,F.A,{x:ax,y:ay,mood:'angry',sy:1+Math.sin(G.clock*5)*0.03});
    if(F.stage==='fall'){const k=eo(sg(F.T,0,0.6));fball(c,F.V,{x:vx+k*F.V.r*0.8,y:vy+k*F.V.r*0.3,rot:k*Math.PI/2,mood:'dead'});return}
    fshadow(c,vx,vy,F.V.r);fball(c,F.V,{x:vx,y:vy,rot:Math.sin(G.clock*2.6)*0.22,mood:'hurt'});fstars(c,vx,vy,F.V.r);return}
  FIN[F.k].draw(c,F.T,F,ev);
}
function drawFinOverlay(){const F=G.fin,c=ctx,ev=(id,at,fn)=>{if(F.T>=at&&!F.ev[id]){F.ev[id]=1;fn()}};
  if(FIN[F.k].screen&&F.stage!=='prompt'&&F.stage!=='fall')FIN[F.k].screen(c,F.T,F,ev);
  const bar=(F.stage==='play'||F.stage==='title')?eo(sg(F.T,0,0.35))*30:0;
  if(bar>0){c.fillStyle='#000';c.fillRect(-M,-M,VW,bar+M);c.fillRect(-M,H+M-bar-M,VW,bar+M)}
  c.textAlign='center';c.textBaseline='middle';const us=W/360;
  if(F.stage==='prompt'){const q=sg(F.t,0.15,0.45),sh=(1-sg(F.t,0.45,0.9))*6;c.save();c.translate(W/2+(Math.random()-0.5)*sh,H*0.24+(Math.random()-0.5)*sh);c.scale(us*easeOutBack(q)*(1+Math.sin(F.t*8)*0.03),us*easeOutBack(q)*(1+Math.sin(F.t*8)*0.03));c.font='44px Lalezar, Vazirmatn, sans-serif';
    c.font=(us*44)+'px Lalezar, Vazirmatn, sans-serif';c.lineJoin='round';c.lineWidth=10;c.strokeStyle='#1a0505';c.strokeText('تمومش کن!',0,0);const g=c.createLinearGradient(0,-22,0,22);g.addColorStop(0,'#ff6b6b');g.addColorStop(1,'#991b1b');c.fillStyle=g;c.fillText('تمومش کن!',0,0);c.restore()}
  if(F.stage==='title'){const q=sg(F.tt,0,0.35),k=easeOutBack(q);c.save();c.translate(W/2,H*0.2);c.scale(k*us,k*us);c.font='50px Lalezar, Vazirmatn, sans-serif';c.lineJoin='round';c.lineWidth=11;c.strokeStyle='#1a0505';c.strokeText('فینیشر!',0,0);
    const g=c.createLinearGradient(0,-26,0,26);g.addColorStop(0,'#fde68a');g.addColorStop(0.5,'#f59e0b');g.addColorStop(1,'#b91c1c');c.fillStyle=g;c.shadowColor='#f59e0b';c.shadowBlur=20;c.fillText('فینیشر!',0,0);c.restore();
    const q2=sg(F.tt,0.35,0.6);c.save();c.globalAlpha=q2;c.font=(us*20)+'px Lalezar, Vazirmatn, sans-serif';c.lineWidth=6;c.strokeStyle='#071233';c.strokeText(FIN[F.k].n,W/2,H*0.2+40*us);c.fillStyle='#fff';c.fillText(FIN[F.k].n,W/2,H*0.2+40*us);c.restore()}
}

