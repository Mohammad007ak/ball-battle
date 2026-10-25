// Ported from prototype/ball-battle.html (lines 1351-1408). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- CARDS TAB ---------- */
let seg='deck';
const dailySkins=()=>CK.EC.dailySkins(CK.B,CK.BK.dayKey());
function msToMidnight(){const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);return m-n}
const fmtHMS=ms=>{let t=Math.floor(ms/1000);const h=Math.floor(t/3600);t%=3600;return `${fa2(h)}:${fa2(Math.floor(t/60))}:${fa2(t%60)}`};
function cardCell(k,inDeck){
  const l=S.lv[k],need=needFor(k);
  const bar=!l?'':l<MAXLVL?`<span class="cbar"><i class="${S.cards[k]>=need?'ok':''}" style="width:${pct(S.cards[k],need)}%"></i><em>${fa(S.cards[k])}/${fa(need)}</em></span>`:`<span class="cbar max"><i class="ok" style="width:100%"></i><em>حداکثر</em></span>`;
  return `<button class="ccard${l?'':' locked'}" data-k="${k}" aria-label="${CLASSES[k].name}"><span class="imw"><img src="${cardArt(k)}" alt="">${l?`<span class="lvtag">سطح ${fa(l)}</span>`:`<span class="lockc">${ICO.lock}</span>`}${canUp(k)?`<span class="upa">${ICO.up}</span>`:''}${!inDeck&&S.team.includes(k)?`<span class="tdot">${ICO.star}</span>`:''}</span>${bar}</button>`;
}
function renderCards(){
  $('#coins2').textContent=fa(S.coins);$('#gems2').textContent=fa(S.gems);
  document.querySelectorAll('#seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.seg===seg));
  $('#deckView').hidden=seg!=='deck';$('#shopView').hidden=seg!=='shop';
  $('#deckRow').innerHTML=S.team.map(k=>cardCell(k,true)).join('');
  $('#collCount').textContent=`${fa(KEYS.filter(k=>S.lv[k]).length)}/${fa(KEYS.length)}`;
  const sorted=[...KEYS].sort((a,b)=>(!S.lv[a])-(!S.lv[b])||RAR_ORDER.indexOf(CLASSES[a].rar)-RAR_ORDER.indexOf(CLASSES[b].rar));
  $('#grid').innerHTML=sorted.map(k=>cardCell(k,false)).join('');
  $('#shopgrid').innerHTML=SHOP.map(o=>`<button class="offer" data-buy="${o.tier}" ${S.gems<o.price?'disabled':''}><b class="tx">${CHESTS[o.tier].name}</b><img src="${chestIcon(o.tier)}" alt="صندوقچهٔ ${CHESTS[o.tier].name}"><small class="odds">${chestOddsText(o.tier)}</small><span class="price gp tx"><svg class="gm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9Z" fill="#34d399" stroke="#064e3b" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 9h18M7 3l2 6 3 12M17 3l-2 6-3 12" fill="none" stroke="#064e3b" stroke-width="1" opacity=".55"/><path d="M8 4h4l-2 4Z" fill="#d1fae5"/></svg>${fa(o.price)}</span></button>`).join('');
  $('#daily').innerHTML=dailySkins().map(([k,st])=>{const own=(S.skins[k]||[]).includes(st),P=SKIN_STYLES[st].price;
    return `<button class="offer skin" data-skin="${k}:${st}" ${own||S.gems<P?'disabled':''}><span class="sname tx">${SKIN_STYLES[st].name}</span><img src="${cardArt(k,st)}" alt="اسکین ${SKIN_STYLES[st].name} ${CLASSES[k].name}">${own?'<span class="price owned">خریده شد</span>':`<span class="price gp tx"><svg class="gm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9Z" fill="#34d399" stroke="#064e3b" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 9h18M7 3l2 6 3 12M17 3l-2 6-3 12" fill="none" stroke="#064e3b" stroke-width="1" opacity=".55"/><path d="M8 4h4l-2 4Z" fill="#d1fae5"/></svg>${fa(P)}</span>`}</button>`}).join('');
  renderGemPacks();
  $('#dailyT').innerHTML=ICO.clock+fmtHMS(msToMidnight());
  if(!$('#cardModal').hidden)renderCardModal();
}
function openCard(k){view=k;renderCardModal();$('#cardModal').hidden=false}
function renderCardModal(){
  const k=view,C=CLASSES[k],R=RAR[C.rar],l=S.lv[k],own=l>0,m=mult(l),need=needFor(k),cost=UPCOST[l]||0;
  let prog='';
  if(own&&l<MAXLVL)prog=`<span class="cbar big"><i class="${S.cards[k]>=need?'ok':''}" style="width:${pct(S.cards[k],need)}%"></i><em>${fa(S.cards[k])}/${fa(need)}</em></span>
    <button class="gbtn tx" id="upBtn" ${canUp(k)?'':'disabled'}>${ICO.up}ارتقا ${coinBadge(cost)}</button>`;
  else if(own)prog=`<span class="cbar big"><i class="ok" style="width:100%"></i><em>حداکثر سطح</em></span>`;
  $('#cardBox').innerHTML=`<div class="mhead"><div class="mt"><span class="rpill" style="--rc:${R.col}">${R.name}</span><b class="tx">${C.name}</b></div><button class="xbtn" data-x aria-label="بستن">${ICO.x}</button></div>
    <div class="mtop"><img src="${cardArt(k)}" alt="" class="${own?'':'lock'}"><div class="mright">${own?`<span class="lvb big">سطح ${fa(l)}</span>`:`<span class="lockline">${ICO.lock}قفل</span>`}<p class="desc">${C.desc}</p>${prog}</div></div>
    <div class="stat3"><div class="st3">${ICO.heart}<b>${fa(C.hp*m)}</b></div><div class="st3">${ICO.sword}<b>${fa(C.dmg*m)}</b></div><div class="st3">${ICO.boot}<b>${fa(C.speed)}</b></div></div>
    <div class="ptitle"><span class="tx">قابلیت ویژه</span></div>
    <div class="abs" role="radiogroup" aria-label="قابلیت ویژه">${C.ab.map((a,i)=>{const lk=S.lv[k]<AB_REQ[i];return `<button class="abopt${lk?' alk':''}" role="radio" aria-checked="${S.ab[k]===i}" data-ab="${i}" ${own&&!lk?'':'disabled'} style="--ac:${C.c1}"><span class="no">${lk?ICO.lock:ICO.bolt}</span><b>${a.n}</b><span class="cd">${lk?`سطح ${fa(AB_REQ[i])}`:ICO.clock+fa(Math.round(a.cd))}</span><small>${a.d}</small></button>`}).join('')}</div>
    <div class="ptitle"><span class="tx">اسکین‌ها</span></div>
    <div class="skins">${['',...skinsOf(k)].map(st=>{const has=!st||(S.skins[k]||[]).includes(st),on=(S.skin[k]||'')===st;return `<button class="skn${on?' on':''}${has?'':' lk'}" data-eq="${st}" ${has&&own?'':'disabled'} aria-pressed="${on}"><img src="${icon(k,st)}" alt=""><span>${st?SKIN_STYLES[st].name:'اصلی'}</span>${has?'':`<i class="sl">${ICO.lock}</i>`}</button>`}).join('')}</div>
    ${own?(S.team.includes(k)?`<div class="inuse">${ICO.star}در تیم نبرد</div>`:`<div class="putrow">${S.team.map((t,i)=>`<button class="b3d put" data-put="${i}"><img src="${icon(t)}" alt="">${ICO.swap}<img src="${icon(k)}" alt=""></button>`).join('')}</div>`):''}`;
}
$('#cards').addEventListener('click',e=>{
  const s=e.target.closest('[data-seg]');if(s){seg=s.dataset.seg;renderCards();return}
  const cc=e.target.closest('.ccard[data-k]');if(cc){openCard(cc.dataset.k);return}
  const sk=e.target.closest('[data-skin]');if(sk){if(sk.disabled)return;const [k,st]=sk.dataset.skin.split(':');act({t:'buySkin',k,st}).then(r=>{renderCards();if(r)toast(`اسکین ${SKIN_STYLES[st].name} ${CLASSES[k].name}`)});return}
  const b=e.target.closest('[data-buy]');if(b&&!b.disabled){act({t:'buyChest',tier:+b.dataset.buy}).then(r=>{renderCards();if(r)showChest(r.tier,r.items)})}
});
$('#cardModal').addEventListener('click',e=>{
  if(e.target.id==='cardModal'||e.target.closest('[data-x]')){$('#cardModal').hidden=true;renderCards();return}
  const t=e.target.closest('button');if(!t||t.disabled)return;
  if(t.dataset.ab!=null){act({t:'ability',k:view,ab:+t.dataset.ab}).then(renderCardModal);return}
  if(t.dataset.eq!=null){act({t:'equip',k:view,st:t.dataset.eq}).then(()=>{renderCards();renderCardModal()});return}
  if(t.id==='upBtn'){const k=view,l=S.lv[k];if(!canUp(k))return;act({t:'upgrade',k}).then(r=>{renderCards();renderCardModal();if(!r)return;sfx('upgrade');const ni=AB_REQ.indexOf(l+1);toast(ni>0?`قابلیت جدید باز شد: ${CLASSES[k].ab[ni].n}`:`${CLASSES[k].name}: سطح ${fa(l+1)}`)});return}
  if(t.dataset.put!=null){act({t:'team',i:+t.dataset.put,k:view}).then(()=>{renderCards();renderCardModal()});return}
});


/** Drop odds shown before buying (CLAUDE.md rule 7). */
function chestOddsText(tier){const T=CHESTS[tier],p=x=>fa(Math.round(x*100))+'٪';
  return `${fa(T.coins[0])}–${fa(T.coins[1])} سکه · ${fa(T.cards)} کارت · کارت جدید ${p(T.newP)}`+(T.skinP?` · اسکین ${p(T.skinP)}`:'')}

/* gem packs: paid in the store app (Bazaar), verified and granted by the server (src/net/store.ts) */
let gemBusy=false;
function renderGemPacks(){
  const open=!!(CK.IAP&&CK.IAP.open()),bag=artUrl('gem-bag');
  $('#gempacks').innerHTML=(CK.B.game.GEM_PACKS||[]).map((p,i)=>`<button class="offer gpack" data-gems="${p.id}" ${open&&!gemBusy?'':'disabled'}>
    ${bag?`<img src="${bag}" alt="" style="--s:${0.78+i*0.11}">`:''}<b class="tx">${fa(p.gems)} الماس</b>
    <span class="price tx">${open?fa(p.toman)+' تومان':'به‌زودی'}</span></button>`).join('');
}
const IAP_ERR={canceled:null,noBazaar:'برای خرید، برنامهٔ بازار را نصب و وارد حساب شو',notVerified:'خرید تأیید نشد؛ اگر پولی کم شده، بازار برمی‌گرداند',network:'اتصال برقرار نشد؛ خرید ذخیره شد و دفعهٔ بعد اعمال می‌شود'};
$('#gempacks').addEventListener('click',async e=>{
  const b=e.target.closest('[data-gems]');if(!b||b.disabled||gemBusy)return;
  gemBusy=true;renderGemPacks();
  try{const r=await CK.IAP.buy(b.dataset.gems);S=CK.BK.profile();
    if(r.ok){sfx('coin');toast(`${fa(r.granted)} الماس اضافه شد`);CK.T.track('purchase',{product:b.dataset.gems,gems:r.granted})}
    else{const m=IAP_ERR[r.code];if(m!==null)toast(m||'خرید انجام نشد')}}
  finally{gemBusy=false;renderCards();$('#gems')&&($('#gems').textContent=fa(S.gems))}
});
if(CK.IAP&&CK.IAP.open())CK.IAP.resume().then(n=>{if(n>0){S=CK.BK.profile();toast(`${fa(n)} الماس از خرید قبلی اضافه شد`);tab==='battle'?renderBattle():renderCards()}});
