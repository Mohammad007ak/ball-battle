// Start-up (prototype: validateSkins + setTab). Profile repair now happens in the backend.
setTab('battle');
// Fade out the splash once the UI is ready.
setTimeout(()=>{const b=$('#boot');if(b){b.classList.add('gone');setTimeout(()=>b.remove(),500)}},700);
