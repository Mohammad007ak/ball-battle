// Player state. `S` is a read-only view of the backend profile (same shape as the prototype's
// saved state); every change goes through `act()`, which asks the backend and re-renders.
let S = CK.BK.profile();
let view = null,
  tab = 'battle',
  skipArm = -1,
  skipT = 0, CH = null, toastT = 0;

const ERR = {
  gems: (n) => `${fa(n || 0)} الماس لازم است`,
  oneAtATime: () => 'هم‌زمان فقط یک صندوقچه باز می‌شود',
  network: () => 'اتصال برقرار نشد',
};
/** Run a backend action; on success refresh `S` and return its data, otherwise toast and return null. */
async function act(a) {
  const r = await CK.BK.act(a);
  S = CK.BK.profile();
  if (!r.ok) {
    toast((ERR[r.code] || (() => 'انجام نشد'))(r.need));
    return null;
  }
  return r.data ?? {};
}
const save = () => {};

const mult = (l) => CK.E.levelMult(CK.B, l);
const gemTag=n=>`<span class="ct"><svg class="gm" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l4 6-9 12L3 9Z" fill="#34d399" stroke="#064e3b" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 9h18M7 3l2 6 3 12M17 3l-2 6-3 12" fill="none" stroke="#064e3b" stroke-width="1" opacity=".55"/><path d="M8 4h4l-2 4Z" fill="#d1fae5"/></svg>${fa(n)}</span>`;
const needFor = (k) => CK.EC.needFor(CK.B, S, k);
const canUp = (k) => CK.EC.canUpgrade(CK.B, S, k);
const lvlDots=l=>`<span class="lvl">${Array.from({length:MAXLVL},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}<small>سطح ${fa(l)}</small></span>`;
const coinTag=n=>`<span class="ct"><i class="coin-ico sm"></i>${fa(n)}</span>`;
const pct=(a,b)=>Math.min(100,b?a/b*100:100);
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true},2400)}
