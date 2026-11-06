(() => {
'use strict';
window.ARTIFACT_POOL = [
  // === БАЗОВЫЕ БАФФЫ ===
  { kind: 'damage',    color: '#ff4f8a', name: 'Урон+',       apply: a => { a.damage += 0.5; } },
  { kind: 'fireRate',  color: '#64dcff', name: 'Скорострел',  apply: a => { a.fireRate += 0.3; } },
  { kind: 'speed',     color: '#7dffb1', name: 'Скорость',    apply: a => { a.speed += 15; } },
  { kind: 'multishot', color: '#ffd700', name: 'Мультивыстрел', apply: a => { a.multishot += 1; } },
  { kind: 'heal',      color: '#ff9900', name: 'Лечение',     apply: a => { a.hp = Math.min(a.maxHp, a.hp + 5); } },

  // === УЛУЧШЕННЫЕ БАФФЫ ===
  { kind: 'crit',      color: '#ff0066', name: 'Крит',        apply: a => { a.damage += 1.0; } },
  { kind: 'rapid',     color: '#00ffff', name: 'Турбо',       apply: a => { a.fireRate += 0.5; } },
  { kind: 'dash',      color: '#aaffaa', name: 'Рывок',       apply: a => { a.speed += 30; } },
  { kind: 'spread',    color: '#ff8800', name: 'Веер',        apply: a => { a.multishot += 2; } },
  { kind: 'bigheal',   color: '#88ff88', name: 'Аптечка',     apply: a => { a.hp = Math.min(a.maxHp, a.hp + 8); } },

  // === УНИКАЛЬНЫЕ ЭФФЕКТЫ ===
  { kind: 'shield',    color: '#4488ff', name: 'Щит',         apply: a => { a.invuln = Math.max(a.invuln, 5.0); a.hp = Math.min(a.maxHp, a.hp + 3); } },
  { kind: 'range',     color: '#c66bff', name: 'Дальность',   apply: a => { a.range += 100; a.tearSpeed += 50; } },
  { kind: 'vampire',   color: '#ff0033', name: 'Вампиризм',   apply: a => { a.vampire = (a.vampire || 0) + 1; } },
  { kind: 'thorns',    color: '#ff5577', name: 'Шипы',        apply: a => { a.thorns = (a.thorns || 0) + 1; } },
  { kind: 'explosive', color: '#ff4400', name: 'Взрыв',       apply: a => { a.explosive = (a.explosive || 0) + 1; } },

  // === СУПЕР-АРТЕФАКТЫ ===
  { kind: 'mega',      color: '#ffd700', name: 'МЕГА',        apply: a => { a.damage += 1.5; a.fireRate += 0.5; a.multishot += 1; a.speed += 20; a.hp = Math.min(a.maxHp, a.hp + 2); } },
  { kind: 'godmode',   color: '#ffffff', name: 'БОГ',         apply: a => { a.invuln = Math.max(a.invuln, 5.0); a.damage += 1; a.speed += 20; } },
  { kind: 'berserk',   color: '#ff0000', name: 'Берсерк',     apply: a => { a.damage += 2; a.fireRate += 0.3; a.hp = Math.max(1, a.hp - 2); } },
  { kind: 'phase',     color: '#aa00ff', name: 'Фаза',        apply: a => { a.invuln = Math.max(a.invuln, 2.0); a.vampire = (a.vampire || 0) + 1; } },
  { kind: 'annihilate',color: '#ff0055', name: 'АННИГИЛЯЦИЯ', apply: a => { a.damage += 2; a.multishot += 1; } },
  { kind: 'timewarp',  color: '#00ddff', name: 'Замедление',  apply: a => { a.fireRate += 1.5; a.range += 200; } },
  { kind: 'fortress',  color: '#4488ff', name: 'Крепость',    apply: a => { a.thorns = (a.thorns || 0) + 2; a.hp = Math.min(a.maxHp, a.hp + 5); } },
  { kind: 'sniper',    color: '#88ff00', name: 'Снайпер',     apply: a => { a.damage += 2; a.range += 300; a.tearSpeed += 100; } },
  { kind: 'storm',     color: '#ffaa00', name: 'Шторм',       apply: a => { a.multishot += 3; a.fireRate += 0.3; } },
];
window.ARTIFACT_BOSS_DAMAGE = 5;
window.BOSS_TYPES = {
  awakened: { name: '👾 Пробуждённый', colors: ['#c66bff', '#4488ff', '#44ff88', '#ffaa00', '#ff0000', '#ffffff'], hp: 10000, speed: 250, draw: (ctx, x, y, r, t) => { ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + t * 0.5; const rad = i % 2 === 0 ? r : r * 0.7; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.4, 0, TAU); ctx.fill(); } },
  sans: { name: '💀 Санс', colors: ['#4a90d9', '#4a90d9', '#3a7acc', '#2a68bb', '#1a58aa', '#ffffff'], hp: 8000, speed: 300, draw: (ctx, x, y, r, t, phase) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.save(); ctx.fillStyle = '#000'; const ey = y - r * 0.15; ctx.beginPath(); ctx.ellipse(x - r * 0.35, ey, r * 0.18, r * 0.24, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + r * 0.35, ey, r * 0.18, r * 0.24, 0, 0, TAU); ctx.fill(); if (phase >= 2) { ctx.fillStyle = phase >= 5 ? '#00aaff' : '#4a90d9'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(x + r * 0.35, ey, r * 0.14, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; } ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + r * 0.35); for (let i = 1; i <= 6; i++) { ctx.lineTo(x - r * 0.5 + (i / 6) * r, y + r * 0.35 + (i % 2 === 0 ? 0 : r * 0.06)); } ctx.stroke(); ctx.restore(); } },
  rumbling_knight: { name: '⚔️ Рокочущий Рыцарь', colors: ['#9a9a9a', '#7a7a7a', '#5a5a5a', '#b8860b', '#aa0000', '#ffd700'], hp: 15000, speed: 200, draw: (ctx, x, y, r, t, phase) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU - Math.PI / 2; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.save(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + t * 0.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.stroke(); } ctx.fillStyle = phase >= 4 ? '#ffaa00' : '#ffffff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(x, y - r * 0.1, r * 0.15, 0, TAU); ctx.fill(); ctx.restore(); } },
  dark_lord: { name: '🖤 Тёмный Лорд', colors: ['#3a0011', '#4a0016', '#5a001a', '#7a001f', '#9a0025', '#ff0033'], hp: 9000, speed: 260, draw: (ctx, x, y, r, t) => { ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ff0000'; ctx.lineWidth = Math.max(2, r * 0.1); ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + t * 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); ctx.stroke(); } ctx.fillStyle = '#ff2222'; ctx.beginPath(); ctx.arc(x, y, r * 0.25, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; } },
  victim: { name: '🔥 Жертва', colors: ['#ff8800', '#ff6600', '#ff4400', '#ff2200', '#cc0000', '#ffff00'], hp: 11000, speed: 240, draw: (ctx, x, y, r, t) => { ctx.beginPath(); ctx.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + t * 0.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); ctx.stroke(); } ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; } },
  devil: { name: '😈 Дьявол', colors: ['#8a0011', '#a00016', '#b8001a', '#cc001f', '#e00024', '#ff0033'], hp: 10000, speed: 250, draw: (ctx, x, y, r, t) => { ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * 0.6, y - r * 0.5); ctx.lineTo(x - r * 0.9, y - r * 1.1); ctx.lineTo(x - r * 0.35, y - r * 0.6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + r * 0.6, y - r * 0.5); ctx.lineTo(x + r * 0.9, y - r * 1.1); ctx.lineTo(x + r * 0.35, y - r * 0.6); ctx.closePath(); ctx.fill(); ctx.save(); ctx.fillStyle = '#ffff00'; ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(x - r * 0.3, y, r * 0.12, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.3, y, r * 0.12, 0, TAU); ctx.fill(); ctx.restore(); } },
  portal: { name: '🌀 Хозяин Порталов', colors: ['#555555', '#444444', '#333333', '#222222', '#111111', '#ffffff'], hp: 8500, speed: 280, draw: (ctx, x, y, r, t) => { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, TAU); ctx.fill(); ctx.save(); ctx.strokeStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 15; for (let i = 0; i < 2; i++) { ctx.lineWidth = 3 + i * 2; ctx.globalAlpha = 0.7 - i * 0.3; ctx.beginPath(); ctx.arc(x, y, r * (0.85 + i * 0.2) + Math.sin(t * 3 + i) * 5, 0, TAU); ctx.stroke(); } ctx.restore(); } },
  delirium: { name: '🌀 Делириум', colors: ['#ff00ff', '#00ffff', '#ff9900', '#ff0000', '#9900ff', '#ffffff'], hp: 10500, speed: 270, draw: (ctx, x, y, r, t) => { ctx.beginPath(); const points = 16; for (let i = 0; i < points; i++) { const a = (i / points) * TAU; const wobble = Math.sin(t * 5 + i * 2) * 0.15 + Math.cos(t * 3 + i) * 0.1; const rad = r * (1 + wobble); const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.fill(); ctx.save(); ctx.fillStyle = '#fff'; const eo = Math.sin(t * 4) * r * 0.1; ctx.beginPath(); ctx.arc(x - r * 0.35 + eo, y - r * 0.1, r * 0.15, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.35 + eo, y - r * 0.1, r * 0.15, 0, TAU); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x - r * 0.35 + eo + Math.sin(t * 10) * 3, y - r * 0.1, r * 0.07, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.35 + eo + Math.sin(t * 10 + 1) * 3, y - r * 0.1, r * 0.07, 0, TAU); ctx.fill(); ctx.restore(); } },
};
console.log('[config] Загружено (' + window.ARTIFACT_POOL.length + ' артефактов)');
})();




