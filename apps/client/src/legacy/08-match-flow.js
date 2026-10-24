// Ported from prototype/ball-battle.html (lines 1409-1595). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- MATCH ---------- */
let W=360,H=360,M=14,VW=W+2*M;
function setWorld(n){W=H=n;M=14*n/360;VW=W+2*M;if(typeof finConsts==='function')finConsts()}
const cv=$('#cv');let ctx=cv.getContext('2d');
let G =null,raf=0,last=0,scale=1, bg =null;
function hexPath(b,x,y,s){b.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i,px=x+s*Math.cos(a),py=y+s*Math.sin(a);i?b.lineTo(px,py):b.moveTo(px,py)}b.closePath()}
const ARENA_CACHE={};
function arenaCanvas(li,px){
  const key=li+'_'+px;if(ARENA_CACHE[key])return ARENA_CACHE[key];
  const c=document.createElement('canvas');c.width=c.height=px;const b=c.getContext('2d');
  // Arena art from the league's image when present, otherwise the prototype's canvas painting.
  const A=ARENAS[li]||ARENAS[ARENAS.length-1],im=A.art&&artImg(A.art.replace(/\.webp$/,''));
  if(im){b.drawImage(im,0,0,px,px);return ARENA_CACHE[key]=c}
  const sw=W;W=H=360;M=14;VW=388;b.setTransform(px/VW,0,0,px/VW,0,0);paintArena(b,A.paint!=null?A.paint:li%5);setWorld(sw);
  return ARENA_CACHE[key]=c;
}
function sizeCanvas(){
  const w=cv.clientWidth||340,d=window.devicePixelRatio||1;
  cv.width=Math.round(w*d);cv.height=Math.round(w*d);scale=cv.width/VW;
  bg=arenaCanvas(G?G.li:0,cv.width);
}
window.addEventListener('resize',()=>{if(G)sizeCanvas();});

const MTILE={};
function mapTile(li,id){
  const key=li+'_'+id;if(MTILE[key]!=null)return MTILE[key];
  const px=192,c=document.createElement('canvas');c.width=c.height=px;const k=c.getContext('2d');
  k.drawImage(arenaCanvas(li,px),0,0);
  const sc=px/VW,sCtx=ctx,sG=G;
  try{ctx=k;G={map:viewMap(id,360),ins:0};ctx.setTransform(sc,0,0,sc,M*sc,M*sc);drawMap(0.4,{x0:0,y0:0,x1:W,y1:H})}
  finally{ctx=sCtx;G=sG}
  try{MTILE[key]=c.toDataURL('image/png')}catch(e){MTILE[key]=''}
  return MTILE[key];
}
function showReveal(mp){
  const ov=$('#ov'),N=26,target=N-4,seq=[];
  for(let i=0;i<N;i++)seq.push(MAPS[(i*5+G.round)%MAPS.length]);
  seq[target]=mp;if(seq[target-1]===mp)seq[target-1]=MAPS[(MAPS.indexOf(mp)+1)%MAPS.length];if(seq[target+1]===mp)seq[target+1]=MAPS[(MAPS.indexOf(mp)+2)%MAPS.length];
  ov.innerHTML=`<div class="rv-top">راند ${fa(G.round)} از ۳</div>
    <div class="reel"><i class="marker"></i><div class="strip" id="strip">${seq.map(m=>`<div class="mt" style="--mc:${m.color}"><img src="${mapTile(G.li,m.id)}" alt=""><span>${m.name}</span></div>`).join('')}</div></div>
    <div id="rvInfo" class="rvinfo"></div>`;
  ov.hidden=false;
  if(!reduceMotion)for(let i=0;i<22;i++){const q=i/21;later(()=>sfx('reel'),2400*(1-Math.pow(1-q,0.45)))}
  const strip=$('#strip'),rw=strip.parentElement.clientWidth,tw=104,base=rw/2-48;
  strip.style.transition='none';strip.style.transform=`translateX(${base}px)`;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{strip.style.transition=reduceMotion?'none':'transform 2.4s cubic-bezier(.1,.7,.16,1)';strip.style.transform=`translateX(${base-target*tw}px)`}));
  later(()=>{
    strip.children[target].classList.add('hit');sfx('reelHit');
    $('#rvInfo').innerHTML=`<div class="rv-name" style="--mc:${mp.color}">${mp.name}</div><div class="rv-desc">${mp.desc}</div>`;
    G.shake=6;
    later(showPick,1600);
  },reduceMotion?300:2500);
}
function showPick(){
  G.phase='pick';
  const alive=G.teams[0].map((e,i)=>({e,i})).filter(x=>x.e.alive),foeAlive=G.teams[1].filter(e=>e.alive);
  const card=x=>{const C=CLASSES[x.e.cls];return `<button class="opt" data-opt="${x.i}"><img src="${icon(x.e.cls,x.e.skin)}" alt=""><b>${C.name}</b><span class="hpm"><i style="width:${x.e.hp/x.e.maxHp*100}%"></i></span><small>جان ${fa(Math.ceil(x.e.hp))} از ${fa(x.e.maxHp)}</small><small class="abn">${C.ab[x.e.ab].n}</small></button>`};
  const multi=alive.length>1;
  $('#ov').innerHTML=`<div class="rv-top">راند ${fa(G.round)}، ${G.map.name}</div><h3>${multi?'کدام شخصیت وارد زمین شود؟':'فقط این شخصیت برایت مانده'}</h3>
    <div class="opts${multi?'':' one'}">${alive.map(card).join('')}</div>
    <div class="foeline">حریف ${foeAlive.map(e=>`<img src="${icon(e.cls,e.skin)}" alt="${CLASSES[e.cls].name}" title="${CLASSES[e.cls].name}">`).join('')}</div>
    ${multi?'<div class="ptimer" style="--d:10s"><i></i></div>':''}`;
  $('#ov').hidden=false;
  clearTimeout(G.pickT);
  G.pickT=later(()=>{if(G.phase!=='pick')return;const best=alive.slice().sort((a,b)=>b.e.hp/b.e.maxHp-a.e.hp/a.e.maxHp)[0];choose(best.i)},multi?10000:1800);
}
$('#ov').addEventListener('click',e=>{const o=e.target.closest('[data-opt]');if(o&&G&&G.phase==='pick')choose(+o.dataset.opt);const o2=e.target.closest('[data-opt2]');if(o2&&G&&G.phase==='pick2')choose2(+o2.dataset.opt2)});
function hudIdle(){
  ['#meHp','#foeHp','#meGhost','#foeGhost'].forEach(s=>$(s).style.width='0%');
  $('#meHpT').textContent='';$('#foeHpT').textContent='';$('#meCls').textContent='';$('#foeCls').textContent='';
  $('#clock').textContent=fa(MATCH_TIME);$('#clock').classList.remove('hot');
  const btn=$('#abilityBtn');btn.classList.remove('ready');btn.style.setProperty('--p',0);$('#abName').textContent='قابلیت ویژه';$('#abCd').textContent='';
}
function setupHud(){
  const me=G.f[0],foe=G.mode==='2v2'?G.f[2]:G.f[1],MC=CLASSES[me.cls],FC=CLASSES[foe.cls];
  $('#meCls').textContent=`${MC.name}، سطح ${fa(me.lvl)}`;$('#foeCls').textContent=`${FC.name}، سطح ${fa(foe.lvl)}`;
  if(G.mode==='2v2'){$('#meCls').textContent=`${MC.name} و ${CLASSES[G.f[1].cls].name}`;$('#foeCls').textContent=G.f.slice(2).map(f=>CLASSES[f.cls].name).join(' و ')}
  $('#abName').textContent=MC.ab[me.ab].n;$('#abilityBtn').style.setProperty('--c1',MC.c1);
  const mc=G.mode==='2v2'?'#60a5fa':MC.c1,fc=G.mode==='2v2'?'#f87171':FC.c1;$('#meHp').style.background=mc;$('#meHp').style.color=mc;$('#foeHp').style.background=fc;$('#foeHp').style.color=fc;
}
function renderRosters(){
  const r=(team,side)=>team.map((e,i)=>`<span class="rs${e.alive?'':' out'}${G.active&&G.active[side]===i?' on':''}" title="${CLASSES[e.cls].name}"><img src="${icon(e.cls,e.skin)}" alt="${CLASSES[e.cls].name}"><i><b style="width:${e.alive?e.hp/e.maxHp*100:0}%"></b></i></span>`).join('');
  $('#meRoster').innerHTML=r(G.teams[0],0);$('#foeRoster').innerHTML=r(G.teams[1],1);
  $('#score').innerHTML=[0,1,2].map(i=>`<i class="${G.hist[i]===0?'w':G.hist[i]===1?'l':''}"></i>`).join('');
  $('#roundNo').textContent=G.round?`راند ${fa(G.round)} از ۳`:'';
}

function addText(x,y,t,c,big){G.texts.push({x,y,t,c,life:0.9,big})}
function burst(x,y,c,n,spd){for(let i=0;i<n;i++){const a=Math.random()*TAU,s=(spd||1)*(60+Math.random()*200);G.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.35+Math.random()*0.35,max:0.7,c,sz:1.5+Math.random()*2.5})}}
function ring(x,y,r,c,max,w,grow){G.rings.push({x,y,r0:r,r,c,life:max||0.4,max:max||0.4,w:w||3,grow:grow||36})}
function banner(t,c,l){G.banner={t,c:c||'#ffffff',life:l||1.4,max:l||1.4}}

