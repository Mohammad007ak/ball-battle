// Ported from prototype/ball-battle.html (lines 1094-1178). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- CARD ART ---------- */
const CART={};
function cardArt(k,sk){
  if(sk===undefined)sk=S.skin[k]||'';const key=k+'|'+sk;
  if(CART[key]!=null)return CART[key];
  const w=180,h=224,cv2=document.createElement('canvas');cv2.width=w;cv2.height=h;const c=cv2.getContext('2d');
  const C=CLASSES[k],fr=RAR_FRAME[C.rar],bw=9,r=16;
  let g;
  if(C.rar==='legendary'){g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'#5eead4');g.addColorStop(0.35,'#818cf8');g.addColorStop(0.7,'#f472b6');g.addColorStop(1,'#fde68a')}
  else{g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,fr[0]);g.addColorStop(1,fr[1])}
  rrect(c,2,2,w-4,h-4,r);c.fillStyle=g;c.fill();c.strokeStyle='#071233';c.lineWidth=3;c.stroke();
  const ig=c.createLinearGradient(0,bw,0,h-bw);ig.addColorStop(0,mix(C.c1,'#12204f',0.45));ig.addColorStop(1,'#0b1638');
  rrect(c,bw,bw,w-2*bw,h-2*bw,r*0.7);c.fillStyle=ig;c.fill();
  c.save();rrect(c,bw,bw,w-2*bw,h-2*bw,r*0.7);c.clip();
  const rg=c.createRadialGradient(w/2,h*0.5,4,w/2,h*0.5,w*0.55);rg.addColorStop(0,'rgba(255,255,255,.22)');rg.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=rg;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(255,255,255,.07)';c.beginPath();c.moveTo(0,h*0.45);c.lineTo(w,h*0.1);c.lineTo(w,h*0.25);c.lineTo(0,h*0.6);c.closePath();c.fill();
  c.fillStyle='rgba(5,10,30,.55)';c.fillRect(bw,bw,w-2*bw,h*0.17);
  c.restore();
  c.fillStyle='#fff';c.font='24px Lalezar, Vazirmatn, sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=4;c.strokeStyle='rgba(0,0,0,.6)';c.strokeText(C.name,w/2,bw+h*0.085);c.fillText(C.name,w/2,bw+h*0.085);
  c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(w/2,h*0.73,w*0.26,h*0.04,0,0,TAU);c.fill();
  drawBall(c,{x:w/2,y:h*0.52,r:w*0.27,k,t:0.6,look:0.6,mood:'static',glow:14,skin:sk});
  if(sk){c.save();c.translate(w-26,h-30);c.rotate(-0.5);c.fillStyle='#f0abfc';rrect(c,-22,-9,44,18,6);c.fill();c.fillStyle='#3a0a3a';c.font='800 11px Vazirmatn, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(SKIN_STYLES[sk].name,0,1);c.restore()}
  try{CART[key]=cv2.toDataURL('image/png')}catch(e){CART[key]=''}
  return CART[key];
}

/* ---------- CHESTS ---------- */
function slotState(s){return CK.EC.slotState(s,CK.BK.now())}
const skipCost=s=>CK.EC.skipCost(s,CK.BK.now());
function updateBadge(){const ready=S.slots.filter(s=>slotState(s)==='ready').length,bd=$('#tabBadge');bd.hidden=!ready;bd.textContent=fa(ready)}
function renderSlots(){
  const now=CK.BK.now(),box=$('#slots');
  if(box.children.length!==4)box.innerHTML=[0,1,2,3].map(i=>`<button class="slot" data-slot="${i}"></button>`).join('');
  S.slots.forEach((s,i)=>{
    const st=slotState(s),el=box.children[i];let html;
    if(st==='empty')html='';
    else{
      const T=CHESTS[s.tier];let sub;
      if(st==='locked')sub=`<span class="tpill">${ICO.clock}${fmtT(T.sec)}</span>`;
      else if(st==='unlocking')sub=`<span class="tpill on">${fmtT((s.end-now)/1000)}</span><span class="skc"><svg class="gm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9Z" fill="#34d399" stroke="#064e3b" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 9h18M7 3l2 6 3 12M17 3l-2 6-3 12" fill="none" stroke="#064e3b" stroke-width="1" opacity=".55"/><path d="M8 4h4l-2 4Z" fill="#d1fae5"/></svg>${fa(skipCost(s))}</span>`;
      else sub=`<span class="tpill go">باز کن</span>`;
      html=`<img src="${chestIcon(s.tier)}" alt="صندوقچهٔ ${T.name}">${sub}`;
    }
    const cls='slot '+st;
    if(el.className!==cls)el.className=cls;
    el.disabled=st==='empty';
    if(el.dataset.h!==html){el.dataset.h=html;el.innerHTML=html}
  });
  updateBadge();
}
async function slotTap(i){
  const s=S.slots[i],st=slotState(s);
  if(st==='locked'){
    if(S.slots.some(x=>slotState(x)==='unlocking')){toast('هم‌زمان فقط یک صندوقچه باز می‌شود');return}
    if(await act({t:'unlock',slot:i}))renderSlots();
  }else if(st==='unlocking'){
    const c=skipCost(s);
    if(S.gems<c){toast(`${fa(c)} الماس لازم است`);return}
    if(skipArm!==i||Date.now()>skipT){skipArm=i;skipT=Date.now()+3000;toast(`دوباره بزن: ${fa(c)} الماس`);return}
    skipArm=-1;openSlot(i);
  }else if(st==='ready')openSlot(i);
}
/** The backend rolls and grants the chest; the client only plays the opening scene. */
async function openSlot(i){const r=await act({t:'open',slot:i});if(r)showChest(r.tier,r.items)}
