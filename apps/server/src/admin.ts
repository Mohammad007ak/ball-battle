import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { AuthError } from './auth';
import type { DB } from './db';

export interface PlayerStat {
  id: string;
  linked: boolean;
  trophies: number;
  matches: number;
  createdAt: number;
  lastMatchAt: number | null;
}

export interface Stats {
  players: number;
  linked: number;
  /** Players with a finished match in the last 24 hours. */
  active24h: number;
  matches: number;
  list: PlayerStat[];
}

/** Player and match counts for the admin dashboard (deleted accounts excluded). */
export function stats(db: DB, now: number): Stats {
  const rows = db
    .prepare(
      `select p.id, p.phone_hash, p.profile, p.created_at,
              count(m.id) as matches, max(m.finished_at) as last
         from players p
         left join matches m on m.player_id = p.id and m.finished_at is not null
        where p.deleted_at is null
        group by p.id
        order by matches desc, p.created_at desc`,
    )
    .all() as {
    id: string;
    phone_hash: string | null;
    profile: string;
    created_at: number;
    matches: number;
    last: number | null;
  }[];
  const list = rows.map((r) => ({
    id: r.id,
    linked: r.phone_hash !== null,
    trophies: Number((JSON.parse(r.profile) as { trophies?: number }).trophies ?? 0),
    matches: r.matches,
    createdAt: r.created_at,
    lastMatchAt: r.last,
  }));
  return {
    players: list.length,
    linked: list.filter((p) => p.linked).length,
    active24h: list.filter((p) => p.lastMatchAt !== null && now - p.lastMatchAt < 86_400_000)
      .length,
    matches: list.reduce((s, p) => s + p.matches, 0),
    list,
  };
}

const hash = (s: string) => createHash('sha256').update(s).digest();

/** Bearer token or `?key=` must equal ADMIN_TOKEN; without a token the dashboard is off. */
function allowed(token: string | undefined, req: FastifyRequest): boolean {
  if (!token) return false;
  const h = req.headers.authorization;
  const given = h?.startsWith('Bearer ') ? h.slice(7) : (req.query as { key?: string }).key;
  return !!given && timingSafeEqual(hash(given), hash(token));
}

const PAGE = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>داشبورد چکاچک</title>
<style>
:root{--bg:#f8fafc;--card:#fff;--fg:#1e293b;--mute:#64748b;--line:#e2e8f0;--acc:#4f46e5}
@media (prefers-color-scheme:dark){:root{--bg:#0f172a;--card:#1e293b;--fg:#e2e8f0;--mute:#94a3b8;--line:#334155;--acc:#818cf8}}
body{font-family:Vazirmatn,Tahoma,sans-serif;margin:0;padding:16px;background:var(--bg);color:var(--fg)}
main{max-width:900px;margin:0 auto}h1{font-size:1.3em}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin:16px 0}
.k{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.k b{display:block;font-size:1.8em;color:var(--acc)}.k span{color:var(--mute);font-size:.9em}
.wrap{overflow-x:auto;background:var(--card);border:1px solid var(--line);border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:.92em}th,td{padding:8px 10px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}
th{color:var(--mute);font-weight:normal}td.n{font-variant-numeric:tabular-nums}code{font-size:.85em}
#err{color:#dc2626}small{color:var(--mute)}
</style></head><body><main>
<h1>داشبورد چکاچک</h1><small id="at"></small><p id="err"></p>
<div class="kpis" id="kpis"></div>
<div class="wrap"><table><thead><tr><th>بازیکن</th><th>بازی‌ها</th><th>جام</th><th>شماره</th><th>ثبت‌نام</th><th>آخرین بازی</th></tr></thead><tbody id="rows"></tbody></table></div>
</main><script>
const fa=n=>Number(n).toLocaleString('fa-IR');
const day=t=>t?new Date(t).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',dateStyle:'short',timeStyle:'short'}):'—';
const key=new URLSearchParams(location.search).get('key')||'';
async function load(){
  const r=await fetch('/admin/stats',{headers:{authorization:'Bearer '+key}});
  if(!r.ok){document.getElementById('err').textContent='دسترسی ندارید (کلید را با ?key= بدهید).';return}
  const s=await r.json();
  document.getElementById('kpis').innerHTML=[['بازیکنان',s.players],['با شماره',s.linked],['فعال ۲۴ ساعت',s.active24h],['کل بازی‌ها',s.matches]]
    .map(([l,v])=>'<div class="k"><b>'+fa(v)+'</b><span>'+l+'</span></div>').join('');
  document.getElementById('rows').innerHTML=s.list.map(p=>'<tr><td><code>'+p.id.slice(0,8)+'</code></td><td class="n">'+fa(p.matches)+
    '</td><td class="n">'+fa(p.trophies)+'</td><td>'+(p.linked?'✓':'—')+'</td><td>'+day(p.createdAt)+'</td><td>'+day(p.lastMatchAt)+'</td></tr>').join('');
  document.getElementById('at').textContent='به‌روزرسانی: '+day(Date.now());
}
load();setInterval(load,30000);
</script></body></html>`;

export function adminRoutes(app: FastifyInstance, db: DB, now: () => number, token?: string) {
  app.get('/admin', async (_req, reply) => reply.type('text/html; charset=utf-8').send(PAGE));
  app.get('/admin/stats', async (req) => {
    if (!allowed(token, req)) throw new AuthError('unauthorized');
    return stats(db, now());
  });
}
