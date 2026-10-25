// Start-up (prototype: validateSkins + setTab). Profile repair now happens in the backend.
setTab('battle');
// New account: open the starter chest (two random common characters, rolled by the server).
if(S.starter&&S.starter.length){showChest(0,S.starter.map(k=>({type:'card',k,n:1,isNew:true})));CH.starter=true}
// Fade out the splash once the UI is ready.

