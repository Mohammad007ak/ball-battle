// Ported from prototype/ball-battle.html (lines 1737-1808). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
/* ---------- SKINS (costumes) ---------- */
// Skin art and prices come from packages/content (same data as the prototype).
const SKINS =CK.B.game.SKINS;
const SKIN_BY={};Object.keys(SKINS).forEach(id=>{const k=SKINS[id].k;(SKIN_BY[k]=SKIN_BY[k]||[]).push(id)});
const SKIN_STYLES=SKINS;
function skinsOf(k){return SKIN_BY[k]||[]}
function dome(c,x,y,r,top,base,a,b,ink){c.beginPath();c.ellipse(x,y-r*base,r*0.97,r*(top-base),0,Math.PI,0);c.closePath();const g=c.createLinearGradient(0,y-r*top,0,y-r*base);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fill();c.strokeStyle=ink||'rgba(0,0,0,.6)';c.lineWidth=r*0.05;c.stroke()}
