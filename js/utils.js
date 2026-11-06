(() => {
'use strict';
window.TAU = Math.PI * 2;
window.rand = (a, b) => a + Math.random() * (b - a);
window.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
window.dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx*dx + dy*dy; };
window.pick = arr => arr[Math.floor(Math.random() * arr.length)];
window.lerp = (a, b, t) => a + (b - a) * t;
console.log('[utils] Загружено');
})();
