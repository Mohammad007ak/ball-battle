// Android back button (Capacitor): close the top-most sheet/modal, otherwise leave the match
// (press twice), otherwise go back to the battle tab, otherwise exit the app (press twice).
let backArmed=0;
function backTwice(msg,fn){const t=performance.now();if(t-backArmed<2000){backArmed=0;fn();return}backArmed=t;toast(msg)}
CK.N.onBack(()=>{
  if(!$('#emoPanel').hidden){$('#emoPanel').hidden=true;return}
  if(!$('#sheet').hidden){$('#sheet').hidden=true;return}
  if(!$('#cardModal').hidden){$('#cardModal').hidden=true;renderCards();return}
  if(!$('#cmodal').hidden){const d=$('#chestDone');if(d&&!$('#cbox').hidden)d.click();else if(!$('#chSkip').hidden)$('#chSkip').click();return}
  if(G){
    if(!$('#result').hidden){$('#homeBtn').click();return}
    if(G.done)return;
    backTwice('برای ترک مسابقه دوباره بزن (باخت حساب می‌شود)',()=>$('#quitBtn').click());return}
  if(tab!=='battle'){setTab('battle');return}
  backTwice('برای خروج دوباره بزن',()=>CK.N.exit());
});
