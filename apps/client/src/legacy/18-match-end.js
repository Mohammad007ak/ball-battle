// Ported from prototype/ball-battle.html (lines 3208-3264). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
function finishMatch(win,quit){
  if(G.done)return;G.done=true;G.ended=true;G.phase='end';clearTimeout(G.pickT);$('#ov').hidden=true;$('#mm').hidden=true;
  // Trophies and chest are decided by the backend (offline: the local fake server).
  act({t:'match',win,mode:G.mode}).then(r=>{
  if(!r)return;
  const {trophies:dt,tier,slot,before,after}=r;
  later(()=>{
    sfx(win?'win':'lose');$('#rTitle').textContent=win?'بردی!':'باختی';$('#rTitle').className=win?'w':'l';
    $('#rSub').textContent=quit?'تسلیم شدی':G.mode==='2v2'?'نبرد ۲ در ۲':'';
    $('#rScore').textContent=`${fa(G.score[0])} - ${fa(G.score[1])}`;
    $('#rChest').innerHTML=slot>=0
      ?`<img src="${chestIcon(tier)}" alt=""><b>صندوقچهٔ ${CHESTS[tier].name}</b>`
      :`<b>جایگاه صندوقچه پر بود</b>`;
    $('#rTroph').textContent=sgn(dt);$('#rTroph').style.color=dt>=0?'var(--win)':'var(--lose)';
    const p=$('#rPromo');p.hidden=after===before;
    if(after!==before)p.textContent=after>before?`به آرنای ${ARENAS[after].name} رسیدی`:`به آرنای ${ARENAS[after].name} برگشتی`;
    $('#result').hidden=false;
  },quit?0:900);
  });
}
function closeMatch(){$('#emoPanel').hidden=true;$('#finBtn').hidden=true;musicDuck(false);cancelAnimationFrame(raf);if(G)clearTimeout(G.pickT);G=null;$('#result').hidden=true;$('#ov').hidden=true;$('#mm').hidden=true}
$('#againBtn').addEventListener('click',()=>{closeMatch();startMatch()});
$('#homeBtn').addEventListener('click',()=>{closeMatch();setTab('battle')});

