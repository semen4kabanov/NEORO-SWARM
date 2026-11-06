(() => {
'use strict';
const $ = id => document.getElementById(id);
let playerBossArena = null, loopId = null, running = false;
const canvas = $('boss-canvas');
if (window.Shop) window.Shop.load();
$('btn-shop').addEventListener('click', () => { $('shop-modal').style.display = 'flex'; window.Shop.renderShop(); });
$('btn-close-shop').addEventListener('click', () => { $('shop-modal').style.display = 'none'; });
function startGame() {
  try {
    if (!playerBossArena) playerBossArena = window.createPlayerBossArena(canvas);
    const bossType = $('boss-select').value;
    const bot = new window.PerfectBot();
    playerBossArena.reset([bot], ['#ffd700'], bossType);
    const input = playerBossArena.input;
    input.keys.clear(); input.mouse.down = false; input.mouse.rightDown = false;
    const onKeyDown = e => { const k = e.key.toLowerCase(); if (['w','a','s','d','ц','ф','ы','в','arrowup','arrowdown','arrowleft','arrowright',' ','e','shift','f'].includes(k)) e.preventDefault(); input.keys.add(k); };
    const onKeyUp = e => input.keys.delete(e.key.toLowerCase());
    const onMouseMove = e => { const r = canvas.getBoundingClientRect(); input.mouse.x = (e.clientX - r.left) / r.width * 800; input.mouse.y = (e.clientY - r.top) / r.height * 600; };
    const onMouseDown = e => { if (e.button === 0) input.mouse.down = true; if (e.button === 2) input.mouse.rightDown = true; };
    const onMouseUp = e => { if (e.button === 0) input.mouse.down = false; if (e.button === 2) input.mouse.rightDown = false; };
    const onContextMenu = e => e.preventDefault();
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove); canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp); canvas.addEventListener('contextmenu', onContextMenu);
    playerBossArena._cleanup = () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); canvas.removeEventListener('mousemove', onMouseMove); canvas.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); canvas.removeEventListener('contextmenu', onContextMenu); };
    running = true;
    let lt = performance.now();
    function loop() {
      if (!running) return;
      const now = performance.now();
      const dt = Math.min(0.033, (now - lt) / 1000);
      lt = now;
      playerBossArena.step(dt); playerBossArena.render();
      if (playerBossArena.state === 'win') { if (window.Shop) window.Shop.addWin(); }
      if (playerBossArena.state !== 'playing') { setTimeout(() => { if (running) startGame(); }, 2000); running = false; return; }
      loopId = requestAnimationFrame(loop);
    }
    loop();
  } catch (e) { console.error('[main] startGame ошибка:', e); }
}
function stopGame() {
  running = false; if (loopId) cancelAnimationFrame(loopId);
  if (playerBossArena && playerBossArena._cleanup) playerBossArena._cleanup();
  const ctx = canvas.getContext('2d'); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#05020a'; ctx.fillRect(0, 0, 800, 600);
  ctx.fillStyle = '#fff'; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText('ОСТАНОВЛЕНО', 400, 300);
}
$('btn-start').addEventListener('click', () => { stopGame(); startGame(); });
$('btn-stop').addEventListener('click', stopGame);
window.addEventListener('load', () => { setTimeout(startGame, 300); });
console.log('[main] Загружено');
})();
