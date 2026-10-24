// Ported from prototype/ball-battle.html (lines 990-1093). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- NAV ---------- */
function setTab(t){
  tab=t;$('#cardModal').hidden=true;$('#sheet').hidden=true;$('#battle').hidden=t!=='battle';$('#cards').hidden=t!=='cards';$('#match').hidden=true;$('#tabs').hidden=false;
  document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===t?'page':'false'));
  if(t==='battle')renderBattle();else renderCards();
  window.scrollTo(0,0);musicFor();
}
function showMatch(){$('#battle').hidden=true;$('#cards').hidden=true;$('#match').hidden=false;$('#tabs').hidden=true;window.scrollTo(0,0);musicFor();CK.N.keepAwake(true)}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)setTab(b.dataset.tab)});

/* ---------- ICONS ---------- */
const ICO={
  lock:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="#ffd75e" stroke="#5a3500" stroke-width="2"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="#e2e8f0" stroke-width="2.6"/><circle cx="12" cy="15.5" r="1.8" fill="#5a3500"/></svg>',
  up:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 20 13h-5v7H9v-7H4Z" fill="#fff" stroke="#064e1d" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8Z" fill="#ffd75e" stroke="#6b3a00" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  x:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>',
  heart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.1-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.9-8 11-8 11Z" fill="#f43f5e" stroke="#4c0519" stroke-width="1.8"/></svg>',
  sword:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3 9.5 13.5l1 1L21 4V3Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.6" stroke-linejoin="round"/><path d="m6 14 4 4M4 20l3.5-3.5" stroke="#a16207" stroke-width="3" stroke-linecap="round"/></svg>',
  boot:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h6v8l6 3c1.5.8 2 1.6 2 3v2H4V3Z" fill="#38bdf8" stroke="#0c4a6e" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 16h17" stroke="#0c4a6e" stroke-width="1.8"/></svg>',
  clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-width="2.6"/><path d="M12 7v5l3 2" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
  swap:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7Z" fill="#ffd75e" stroke="#6b3a00" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};
const coinBadge=n=>`<span class="ct"><i class="coin-ico sm"></i>${fa(n)}</span>`;

/* ---------- BATTLE TAB ---------- */
let heroRaf=0;
function renderBattle(){
  const li=leagueOf(S.trophies),L=LEAGUES[li],N=LEAGUES[li+1],A=ARENAS[li];
  $('#coins').textContent=fa(S.coins);$('#gems').textContent=fa(S.gems);$('#trophies').textContent=fa(S.trophies);
  $('#leagueName').textContent='لیگ '+L.name;$('#leagueBadge').style.setProperty('--lc',L.color);
  const bu=artUrl('league-'+(L.badge||0));$('#leagueBadge').classList.toggle('art',!!bu);if(bu)$('#leagueBadge svg').style.backgroundImage=`url(${bu})`;
  document.body.style.setProperty('--tint',A.accent);
  $('#arenaNo').textContent='آرنای '+fa(li+1)+'، لیگ '+L.name;$('#arenaName').textContent=A.name;
  $('#ladderFill').style.width=(N?(S.trophies-L.min)/(N.min-L.min)*100:100)+'%';
  $('#ladderText').textContent=N?`${fa(S.trophies)} / ${fa(N.min)}`:fa(S.trophies);
  $('#nextArena').src=arenaIcon(N?li+1:li);
  $('#teamHit').innerHTML=S.team.map((k,i)=>`<button class="th" data-team="${i}" aria-label="تعویض ${CLASSES[k].name}"><span class="swp">${ICO.swap}</span><b class="tx">${CLASSES[k].name}</b><span class="lvb">سطح ${fa(S.lv[k])}</span></button>`).join('');
  document.querySelectorAll('#modes [data-mode]').forEach(b=>b.setAttribute('aria-pressed',(S.mode||'1v1')===b.dataset.mode?'true':'false'));
  renderSlots();
  if(!heroRaf)heroRaf=requestAnimationFrame(heroLoop);
}
function heroLoop(ts){heroRaf=0;if($('#battle').hidden||G)return;paintHero(ts/1000);heroRaf=requestAnimationFrame(heroLoop)}
function paintHero(t){
  const cvA=$('#arenaCv'),w=cvA.clientWidth||340,h=cvA.clientHeight||w*0.8,d=Math.min(window.devicePixelRatio||1,2),pw=Math.round(w*d),ph=Math.round(h*d);
  if(cvA.width!==pw||cvA.height!==ph){cvA.width=pw;cvA.height=ph}
  const c=cvA.getContext('2d'),li=leagueOf(S.trophies);
  c.setTransform(1,0,0,1,0,0);c.drawImage(arenaCanvas(li,pw),0,(ph-pw)/2);
  c.setTransform(d,0,0,d,0,0);
  const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,.4)');g.addColorStop(0.22,'rgba(0,0,0,0)');g.addColorStop(0.68,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.6)');
  c.fillStyle=g;c.fillRect(0,0,w,h);
  const r=w*0.14,y=h*0.52;
  S.team.forEach((k,i)=>{
    const x=w*(i?0.27:0.73),bob=Math.sin(t*2.2+i*1.7)*4;
    const pg=c.createRadialGradient(x,y+r*0.95,2,x,y+r*0.95,r*1.3);pg.addColorStop(0,'rgba(255,255,255,.4)');pg.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=pg;c.beginPath();c.ellipse(x,y+r*0.95,r*1.3,r*0.42,0,0,TAU);c.fill();
    c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.ellipse(x,y+r*0.98,r*(0.92-bob*0.01),r*0.26,0,0,TAU);c.fill();
    drawBall(c,{x,y:y+bob-6,r,k,t:t+i*2.3,look:i?0.2:Math.PI-0.2,mood:'idle',glow:22,skin:S.skin[k]||''});
  });
}
const AICON={};
function arenaIcon(li){if(AICON[li]==null){try{AICON[li]=arenaCanvas(li,144).toDataURL('image/png')}catch(e){AICON[li]=''}}return AICON[li]}
$('#battle').addEventListener('click',e=>{
  const tm=e.target.closest('[data-team]');if(tm){openTeamSheet(+tm.dataset.team);return}
  const sl=e.target.closest('.slot');if(sl){if(!sl.disabled)slotTap(+sl.dataset.slot);return}
  const md=e.target.closest('[data-mode]');if(md){act({t:'mode',mode:md.dataset.mode}).then(renderBattle);return}
  if(e.target.closest('#fightBtn'))startMatch();
});
document.addEventListener('click',e=>{if(e.target.closest('button'))sfx('click');if(e.target.closest('[data-gear]'))openGear()});

function openSheet(html){$('#sheetIn').innerHTML=html;$('#sheet').hidden=false}
function openTeamSheet(i){
  const owned=KEYS.filter(k=>S.lv[k]);
  $('#sheet').dataset.slot=i;
  openSheet(`<div class="mhead"><b class="tx">انتخاب شخصیت</b><button class="xbtn" data-close aria-label="بستن">${ICO.x}</button></div>
    <div class="cgrid">${owned.map(k=>`<button class="ccard pick${k===S.team[i]?' sel':''}" data-pick="${k}"><span class="imw"><img src="${cardArt(k)}" alt="${CLASSES[k].name}"><span class="lvtag">سطح ${fa(S.lv[k])}</span>${S.team.includes(k)?`<span class="tdot">${ICO.star}</span>`:''}</span></button>`).join('')}</div>`);
}
function openGear(){
  openSheet(`<div class="mhead"><b class="tx">تنظیمات</b><button class="xbtn" data-close aria-label="بستن">${ICO.x}</button></div>
    <div class="ptitle"><span class="tx">صدا</span></div>
    <div class="tbtns"><button class="b3d" data-snd="mus">موسیقی: ${AU.musOn?'روشن':'خاموش'}</button><button class="b3d" data-snd="fx">افکت‌ها: ${AU.fxOn?'روشن':'خاموش'}</button></div>
    ${acctHTML()}
    ${CK.BK.dev?`<div class="ptitle"><span class="tx">ابزار تست</span></div>
    <div class="tbtns">${[['unlock','باز کردن همهٔ شخصیت‌ها'],['coins','+۱۰۰۰ سکه'],['gems','+۵۰۰ الماس'],['max','همه سطح ۸'],['tup','+۳۰۰ جام'],['tdown','−۳۰۰ جام'],['fill','پر کردن جایگاه صندوقچه‌ها'],['fast','آماده کردن صندوقچه‌ها'],['reset','شروع از صفر']].map(([a,t])=>`<button class="b3d" data-test="${a}">${t}</button>`).join('')}</div>`:''}`);
}
/* ---------- account (Clash Royale style: guest by default, phone link offered here) ---------- */
let acctPhone='',acctStep='phone',delArm=0;
function acctHTML(){
  const A=CK.BK.account;if(!A||(!A.linked()&&!A.phoneEnabled()))return '';
  const head='<div class="ptitle"><span class="tx">حساب</span></div>';
  if(A.linked())return head+`<div class="acct"><small>پیشرفتت با شمارهٔ موبایل ذخیره شده و روی هر گوشی برمی‌گردد.</small><div class="tbtns"><button class="b3d" data-acct="delete">حذف حساب</button></div></div>`;
  if(acctStep==='code')return head+`<div class="acct"><small>کد ۵ رقمی پیامک‌شده به ${acctPhone} را وارد کن</small><input class="phin" id="acctIn" inputmode="numeric" maxlength="5" autocomplete="one-time-code"><div class="tbtns"><button class="b3d" data-acct="verify">تأیید</button><button class="b3d" data-acct="back">تغییر شماره</button></div></div>`;
  return head+`<div class="acct"><small>با ثبت شمارهٔ موبایل، پیشرفتت ذخیره می‌شود و روی گوشی دیگر هم برمی‌گردد.</small><input class="phin" id="acctIn" inputmode="tel" placeholder="۰۹۱۲۳۴۵۶۷۸۹" value="${acctPhone}"><div class="tbtns"><button class="b3d" data-acct="otp">ثبت پیشرفت</button></div></div>`;
}
const ACCT_ERR={badPhone:'شمارهٔ موبایل درست نیست',tooSoon:'کمی صبر کن و دوباره بفرست',rateLimited:'تعداد درخواست‌ها زیاد است؛ بعداً امتحان کن',wrongCode:'کد اشتباه است',codeExpired:'کد منقضی شد؛ دوباره بفرست',network:'اتصال برقرار نشد'};
async function acctAction(what){
  const A=CK.BK.account,inp=$('#acctIn'),v=inp?inp.value.trim():'';
  if(what==='back'){acctStep='phone';openGear();return}
  if(what==='otp'){acctPhone=v;const r=await A.requestOtp(v);if(!r.ok){toast(ACCT_ERR[r.code]||'انجام نشد');return}acctStep='code';openGear();return}
  if(what==='verify'){const r=await A.verify(acctPhone,v);if(!r.ok){toast(ACCT_ERR[r.code]||'انجام نشد');return}
    acctStep='phone';S=CK.BK.profile();toast(r.data.outcome==='switched'?'به حساب ذخیره‌شده‌ات برگشتی':'پیشرفتت ذخیره شد');openGear();tab==='battle'?renderBattle():renderCards();return}
  if(what==='delete'){if(Date.now()>delArm){delArm=Date.now()+3000;toast('برای حذف همیشگی حساب دوباره بزن');return}
    const r=await A.deleteAccount();if(!r.ok){toast(ACCT_ERR[r.code]||'انجام نشد');return}
    S=CK.BK.profile();$('#sheet').hidden=true;toast('حساب حذف شد');setTab('battle')}
}
// Test tools: only the offline fake backend accepts these (CK.BK.dev).
const TEST_MSG={unlock:'همهٔ شخصیت‌ها باز شدند',coins:'+۱۰۰۰ سکه',gems:'+۵۰۰ الماس',max:'همهٔ کارت‌ها سطح ۸',fill:'جایگاه‌ها پر شدند',fast:'صندوقچه‌ها آماده‌اند',reset:'شروع از صفر'};
async function runTest(a){
  if(!(await act({t:'cheat',what:a})))return;
  if(a==='reset')view=null;
  toast(TEST_MSG[a]||ARENAS[leagueOf(S.trophies)].name);
  tab==='battle'?renderBattle():renderCards();
}
$('#sheet').addEventListener('click',e=>{
  if(e.target.id==='sheet'||e.target.closest('[data-close]')){$('#sheet').hidden=true;return}
  const sn=e.target.closest('[data-snd]');if(sn){const k=sn.dataset.snd;setSound(k,!(k==='mus'?AU.musOn:AU.fxOn));openGear();return}
  const t=e.target.closest('[data-test]');if(t){runTest(t.dataset.test);return}
  const ac=e.target.closest('[data-acct]');if(ac){acctAction(ac.dataset.acct);return}
  const p=e.target.closest('[data-pick]');if(!p)return;
  $('#sheet').hidden=true;act({t:'team',i:+$('#sheet').dataset.slot,k:p.dataset.pick}).then(()=>tab==='battle'?renderBattle():renderCards());
});

