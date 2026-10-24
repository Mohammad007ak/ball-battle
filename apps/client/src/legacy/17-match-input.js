// Ported from prototype/ball-battle.html (lines 3047-3066). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
$('#abilityBtn').addEventListener('click',()=>{if(G&&G.f.length)useAbility(G.f[0])});
cv.addEventListener('pointerdown',e=>{
  if(!G||!G.f.length)return;e.preventDefault();
  if(G.phase==='finish'){if(G.fin&&G.fin.w===0)finGo();return}
  const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*VW-M,y=(e.clientY-r.top)/r.height*VW-M;
  const ok=nudge(G.f[0],x,y);
  G.taps.push({x,y,life:0.45,ok});
});
const KEYDIR={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],KeyW:[0,-1],KeyS:[0,1],KeyA:[-1,0],KeyD:[1,0]};
window.addEventListener('keydown',e=>{
  if(!G||!G.f.length||$('#match').hidden)return;
  if(e.code==='Space'){e.preventDefault();if(G.phase==='finish'){if(G.fin&&G.fin.w===0)finGo()}else useAbility(G.f[0])}
  else if(KEYDIR[e.code]){e.preventDefault();const f=G.f[0],d=KEYDIR[e.code];nudge(f,f.x+d[0]*100,f.y+d[1]*100)}
});
$('#emoBtn').addEventListener('click',()=>{const p=$('#emoPanel');if(!p.hidden){p.hidden=true;return}const [ek,es]=emoteChar(0);p.innerHTML=EMOTES.map(t=>`<button data-emo="${t}" aria-label="ایموت"><img src="${emoteIcon(t,ek,es)}" alt=""></button>`).join('');p.hidden=false});
$('#emoPanel').addEventListener('click',e=>{const b=e.target.closest('[data-emo]');if(!b||!G)return;$('#emoPanel').hidden=true;if(G.emoCd>0)return;G.emoCd=2.5;sendEmote(0,b.dataset.emo);if(G.online){onlineSend({t:'emo',k:b.dataset.emo});return}
  if(Math.random()<0.4)later(()=>sendEmote(1,pickOne(EMOTES)),900+Math.random()*700)});
$('#quitBtn').addEventListener('click',()=>{if(!G||G.done)return;if(G.phase==='finish'){G.fin.done=true;$('#finBtn').hidden=true;finishMatch(G.fin.w===0,false);return}finishMatch(false,true)});
$('#finBtn').addEventListener('click',()=>finGo());

