// Content tables. The prototype defined these inline; they now come from packages/content
// (CLAUDE.md rule 4) so the server can change them without an app update.
const GD = CK.B.game;
const RAR = GD.RAR;
const RAR_ORDER = ['common', 'rare', 'epic', 'legendary'];
const CLASSES = GD.CLASSES;
const PUPS = GD.PUPS;
const MAPS = GD.MAPS;
const LEAGUES = GD.LEAGUES;
// One arena per league; a league added later without its own arena reuses the last one.
const ARENAS = GD.LEAGUES.map((_, i) => GD.ARENAS[Math.min(i, GD.ARENAS.length - 1)]);
const BOT_NAMES = ['آرش', 'نیما', 'سارا', 'پویا', 'مهسا', 'کیان', 'رضا', 'الناز', 'بردیا', 'یاسمن', 'امید', 'ترانه'];
const MAXLVL = GD.MAXLVL, MATCH_TIME = GD.MATCH_TIME, SHRINK_AT = GD.SHRINK_AT;
const NUDGE_MAX = GD.NUDGE_MAX, NUDGE_RECHARGE = GD.NUDGE_RECHARGE;
const UPCOST = GD.UPCOST;
const AB_REQ = GD.AB_REQ;
const CHESTS = GD.CHESTS;
const SHOP = GD.SHOP;
const KEYS = Object.keys(CLASSES);
const leagueOf = (t) => CK.EC.leagueOf(CK.B, t);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fa2 = (n) => Math.floor(n).toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });
/** Chest timers: "۸ ساعت", "۲:۳۰" (h:mm) from 1 hour up, "۱۴:۰۵" (m:ss) or "۴۵ ثانیه" below. */
const fmtT = (s) => {
  s = Math.max(0, Math.ceil(s));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  if (h) return m ? fa(h) + ':' + fa2(m) : fa(h) + ' ساعت';
  return m ? fa(m) + ':' + fa2(s % 60) : fa(s) + ' ثانیه';
};
