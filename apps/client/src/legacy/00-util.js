// Ported from prototype/ball-battle.html (lines 657-662). Shared-scope legacy script (plain JS, as in the prototype): see vite.config.ts.
const $=s=>document.querySelector(s);
const fa=n=>Math.round(n).toLocaleString('fa-IR');
const sgn=n=>(n>0?'+':n<0?'−':'')+fa(Math.abs(n));
const TAU=Math.PI*2;
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

