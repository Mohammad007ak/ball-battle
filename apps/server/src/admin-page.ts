/** The /admin dashboard page: self-contained (no fonts or scripts from outside), Persian RTL. */
export const PAGE = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>داشبورد چکاچک</title>
<style>
@font-face{font-family:Vazirmatn;font-weight:400;font-display:swap;src:url(/admin/fonts/vazirmatn-arabic-400-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:Vazirmatn;font-weight:700;font-display:swap;src:url(/admin/fonts/vazirmatn-arabic-700-normal.woff2) format('woff2');unicode-range:U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC}
@font-face{font-family:Vazirmatn;font-weight:400;font-display:swap;src:url(/admin/fonts/vazirmatn-latin-400-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Vazirmatn;font-weight:700;font-display:swap;src:url(/admin/fonts/vazirmatn-latin-700-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
:root{--bg:#f8fafc;--card:#fff;--fg:#1e293b;--mute:#64748b;--line:#e2e8f0;--acc:#4f46e5;--acc2:#0d9488;--bad:#dc2626}
@media (prefers-color-scheme:dark){:root{--bg:#0f172a;--card:#1e293b;--fg:#e2e8f0;--mute:#94a3b8;--line:#334155;--acc:#818cf8;--acc2:#2dd4bf;--bad:#f87171}}
*{box-sizing:border-box}body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;padding:16px;background:var(--bg);color:var(--fg)}
main{max-width:1000px;margin:0 auto}h1{font-size:1.3em;margin:0}h2{font-size:1em;margin:0 0 10px;color:var(--mute);font-weight:normal}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.k b{display:block;font-size:1.7em;color:var(--acc);font-variant-numeric:tabular-nums}.k span{color:var(--mute);font-size:.88em}.k i{display:block;font-style:normal;font-size:.8em;color:var(--mute);margin-top:2px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-bottom:12px}
.bars{display:flex;align-items:flex-end;gap:4px;height:120px;direction:ltr}
.bars div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;min-width:0}
.bars em{width:100%;background:var(--acc);border-radius:3px 3px 0 0;min-height:1px}.bars.t em{background:var(--acc2)}
.bars small{font-size:.65em;color:var(--mute);margin-top:4px;white-space:nowrap}.bars b{font-size:.65em;font-weight:normal;color:var(--mute)}
.wrap{overflow-x:auto;padding:0}
table{width:100%;border-collapse:collapse;font-size:.9em}th,td{padding:8px 10px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}
th{color:var(--mute);font-weight:normal;cursor:pointer}td.n{font-variant-numeric:tabular-nums}code{font-size:.85em}
.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--line)}.row:last-child{border:0}
#err{color:var(--bad)}small{color:var(--mute)}.bad{color:var(--bad)}
</style></head><body><main>
<h1>داشبورد چکاچک</h1><small id="at"></small><p id="err"></p>
<div class="kpis" id="kpis"></div>
<div class="grid">
<div class="card"><h2>بازی‌ها در ۱۴ روز اخیر</h2><div class="bars" id="dm"></div></div>
<div class="card"><h2>بازیکنان فعال روزانه</h2><div class="bars t" id="da"></div></div>
<div class="card"><h2>ثبت‌نام روزانه</h2><div class="bars" id="ds"></div></div>
<div class="card"><h2>نوع بازی</h2><div id="modes"></div><h2 style="margin-top:14px">قیمت بسته‌های الماس روی سرور</h2><div id="packs"></div></div>
</div>
<div class="card wrap"><table><thead><tr><th data-k="id">بازیکن</th><th data-k="matches">بازی‌ها</th><th data-k="wins">برد</th><th data-k="rate">درصد برد</th><th data-k="trophies">جام</th><th data-k="coins">سکه</th><th data-k="gems">الماس</th><th data-k="linked">شماره</th><th data-k="createdAt">ثبت‌نام</th><th data-k="lastMatchAt">آخرین بازی</th></tr></thead><tbody id="rows"></tbody></table></div>
</main><script>
const $=id=>document.getElementById(id),fa=n=>Number(n).toLocaleString('fa-IR');
const when=t=>t?new Date(t).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}):'—';
const dd=t=>new Date(t+43200000).toLocaleDateString('fa-IR',{timeZone:'Asia/Tehran',day:'numeric',month:'numeric'});
const key=new URLSearchParams(location.search).get('key')||'';
const MODES={'1v1':'تک‌به‌تک با بات','2v2':'دونفره با بات',online:'آنلاین'};
let S=null,sortK='matches',desc=true;
function bars(el,days,f){const m=Math.max(1,...days.map(f));
  $(el).innerHTML=days.map((d,i)=>'<div title="'+fa(f(d))+'"><b>'+(f(d)?fa(f(d)):'')+'</b><em style="height:'+(f(d)/m*85)+'%"></em><small>'+(i%2?'&nbsp;':dd(d.day))+'</small></div>').join('')}
function table(){const l=S.list.map(p=>({...p,rate:p.matches?p.wins/p.matches:0}));
  l.sort((a,b)=>{const x=a[sortK]??-1,y=b[sortK]??-1;return (x>y?1:x<y?-1:0)*(desc?-1:1)});
  $('rows').innerHTML=l.map(p=>'<tr><td><code>'+p.id.slice(0,8)+'</code></td><td class="n">'+fa(p.matches)+'</td><td class="n">'+fa(p.wins)+
   '</td><td class="n">'+(p.matches?fa(Math.round(p.rate*100))+'٪':'—')+'</td><td class="n">'+fa(p.trophies)+'</td><td class="n">'+fa(p.coins)+'</td><td class="n">'+fa(p.gems)+
   '</td><td>'+(p.linked?'✓':'—')+'</td><td>'+when(p.createdAt)+'</td><td>'+when(p.lastMatchAt)+'</td></tr>').join('')}
document.querySelectorAll('th').forEach(th=>th.onclick=()=>{const k=th.dataset.k;desc=sortK===k?!desc:true;sortK=k;if(S)table()});
async function load(){
  const r=await fetch('/admin/stats',{headers:{authorization:'Bearer '+key}});
  if(!r.ok){$('err').textContent='دسترسی ندارید (کلید را با ?key= بدهید).';return}
  S=await r.json();$('err').textContent='';const P=S.purchases;
  $('kpis').innerHTML=[['بازیکنان',S.players,fa(S.linked)+' نفر با شماره'],['فعال امروز',S.active24h,'۲۴ ساعت اخیر'],['فعال هفته',S.active7d,'۷ روز اخیر'],
   ['کل بازی‌ها',S.matches,fa(S.matches24h)+' در ۲۴ ساعت'],['میانگین بازی',S.players?Math.round(S.matches/S.players*10)/10:0,'برای هر بازیکن'],
   ['خریدها',P.count,fa(P.gems)+' الماس'],['درآمد تقریبی',P.toman,'تومان، به قیمت فعلی'],['خطاها',S.errors24h,'۲۴ ساعت اخیر']]
   .map(([l,v,i])=>'<div class="card k"><b>'+fa(v)+'</b><span>'+l+'</span><i>'+i+'</i></div>').join('');
  bars('dm',S.days,d=>d.matches);bars('da',S.days,d=>d.active);bars('ds',S.days,d=>d.signups);
  $('modes').innerHTML=Object.entries(S.byMode).map(([m,n])=>'<div class="row"><span>'+(MODES[m]||m)+'</span><b>'+fa(n)+'</b></div>').join('')||'<small>هنوز بازی‌ای نیست</small>';
  $('packs').innerHTML=S.config.gemPacks.map(p=>'<div class="row"><span>'+fa(p.gems)+' الماس — <b>'+fa(p.toman)+' تومان</b></span><small>'+fa(P.byProduct[p.id]||0)+' خرید</small></div>').join('')+
   '<small>نسخهٔ تنظیمات از راه دور: '+fa(S.config.version)+(S.config.version?' (بالانس پیش‌فرض را بازنویسی کرده)':' (پیش‌فرض)')+'</small>';
  table();$('at').textContent='به‌روزرسانی: '+when(Date.now());
}
load();setInterval(load,30000);
</script></body></html>`;
