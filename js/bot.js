(() => {
'use strict';

window.PerfectBot = class PerfectBot {
  constructor() {
    this.sizes = [37, 24, 24, 5];
    this.dashCd = 0;
    this.teleportCd = 0;
    this.strafeDir = 1;
    this.strafeTimer = 0;
    this.spiralAngle = 0;
    this.difficultyLevel = 1.0;
    this.battleTime = 0;
  }

  forward(obs, agent, boss, tears, room, artifacts, minions, dt) {
    if (!agent || agent.hp <= 0) return new Float32Array([0,0,1,0,0]);

    const d = dt || 0.016;
    this.battleTime += d;
    this.dashCd = Math.max(0, this.dashCd - d);
    this.teleportCd = Math.max(0, this.teleportCd - d);
    this.strafeTimer -= d;
    this.spiralAngle += d * 2.0;

    // === ДИНАМИЧЕСКАЯ СЛОЖНОСТЬ ===
    this.difficultyLevel = 1.0 + Math.floor(this.battleTime / 20) * 0.02;

    let shootAngle = 0;
    const shoot = 1;

    // === ПРИЦЕЛИВАНИЕ С ПРЕДСКАЗАНИЕМ ===
    if (boss && boss.hp > 0) {
      const predictTime = 0.4 * this.difficultyLevel;
      const px = boss.x + boss.vx * predictTime;
      const py = boss.y + boss.vy * predictTime;
      shootAngle = Math.atan2(py - agent.y, px - agent.x);
    }

    // === АНАЛИЗ ОПАСНОСТИ (32 направления) ===
    const dangerMap = [];
    const predictRange = 0.6 * this.difficultyLevel;
    const steps = 10;

    for (let i = 0; i < 32; i++) {
      const ang = (i / 32) * Math.PI * 2;
      const testX = agent.x + Math.cos(ang) * 100 * this.difficultyLevel;
      const testY = agent.y + Math.sin(ang) * 100 * this.difficultyLevel;
      let danger = 0;

      if (testX < room.x + 55 || testX > room.x + room.w - 55) danger += 15000;
      if (testY < room.y + 55 || testY > room.y + room.h - 55) danger += 15000;

      for (const t of tears) {
        if (t.from === 'agent') continue;
        for (let step = 0; step <= steps; step++) {
          const ta = (step / steps) * predictRange;
          const bx = t.x + t.vx * ta;
          const by = t.y + t.vy * ta;
          const dist = Math.hypot(testX - bx, testY - by);
          if (dist < 150) danger += (12000 / (dist + 1)) * (1 - step * 0.08);
        }
      }

      if (minions) for (const m of minions) {
        const dist = Math.hypot(testX - m.x, testY - m.y);
        if (dist < 110) danger += 5000 / (dist + 1);
      }

      const dc = Math.hypot(testX - (room.x + room.w/2), testY - (room.y + room.h/2));
      dangerMap.push({ ang, testX, testY, danger: -danger + Math.max(0, (700 - dc) * 0.5) });
    }

    let bestDir = dangerMap[0];
    for (const dir of dangerMap) if (dir.danger > bestDir.danger) bestDir = dir;

    // === СБОР ВСЕХ АРТЕФАКТОВ (ПРИОРИТЕТ №1) ===
    let targetArt = null;
    if (artifacts && artifacts.length > 0) {
      let md = Infinity;
      for (const art of artifacts) {
        const dist = Math.hypot(art.x - agent.x, art.y - agent.y);
        if (dist < md) { md = dist; targetArt = art; }
      }
    }

    if (targetArt) {
      const da = Math.hypot(targetArt.x - agent.x, targetArt.y - agent.y);
      if (da < 800) {
        for (const dir of dangerMap) {
          const tx = targetArt.x - agent.x, ty = targetArt.y - agent.y;
          const len = Math.hypot(tx, ty) || 1;
          const dot = (Math.cos(dir.ang) * tx + Math.sin(dir.ang) * ty) / len;
          if (dot > 0.2 && dir.danger > -2000 && dir.danger > bestDir.danger) bestDir = dir;
        }
      }
    }

    // === КАЙТИНГ ===
    if (boss && boss.hp > 0) {
      const db = Math.hypot(boss.x - agent.x, boss.y - agent.y);
      const idealDist = 200;
      if (db < idealDist - 50) {
        const away = Math.atan2(agent.y - boss.y, agent.x - boss.x);
        for (const dir of dangerMap) {
          const dot = Math.cos(dir.ang)*Math.cos(away)+Math.sin(dir.ang)*Math.sin(away);
          if (dot > 0.4 && dir.danger > -4000 && dir.danger > bestDir.danger - 1500) { bestDir = dir; break; }
        }
      } else if (db > idealDist + 200) {
        const tow = Math.atan2(boss.y - agent.y, boss.x - agent.x);
        for (const dir of dangerMap) {
          const dot = Math.cos(dir.ang)*Math.cos(tow)+Math.sin(dir.ang)*Math.sin(tow);
          if (dot > 0.4 && dir.danger > -3000 && dir.danger > bestDir.danger - 800) { bestDir = dir; break; }
        }
      }
    }

    // === СТРЕЙФ ПО СПИРАЛИ ===
    if (this.strafeTimer <= 0) {
      this.strafeDir *= -1;
      this.strafeTimer = 0.6 + Math.random() * 0.6;
    }
    if (boss && boss.hp > 0 && bestDir.danger > -1000) {
      const dx = boss.x - agent.x, dy = boss.y - agent.y;
      const baseAng = Math.atan2(dy, dx) + (this.strafeDir * Math.PI / 2);
      const spiralAng = baseAng + Math.sin(this.spiralAngle) * 0.5;
      const sx = agent.x + Math.cos(spiralAng) * 100 * this.difficultyLevel;
      const sy = agent.y + Math.sin(spiralAng) * 100 * this.difficultyLevel;
      let safe = true;
      for (const t of tears) { if (t.from === 'agent') continue; if (Math.hypot(sx - t.x, sy - t.y) < 130) safe = false; }
      if (safe && sx > room.x + 65 && sx < room.x + room.w - 65 && sy > room.y + 65 && sy < room.y + room.h - 65) {
        bestDir = { ang: spiralAng, danger: 9999 };
      }
    }

    let ax = Math.cos(bestDir.ang), ay = Math.sin(bestDir.ang);
    const len = Math.hypot(ax, ay);
    if (len > 1) { ax /= len; ay /= len; }

    if (bestDir.danger < -8000 * this.difficultyLevel && this.dashCd <= 0) {
      ax *= 2.0 * this.difficultyLevel;
      ay *= 2.0 * this.difficultyLevel;
      this.dashCd = 0.6;
    }

    if (bestDir.danger < -15000 && this.teleportCd <= 0) {
      const safeAng = (Math.random() < 0.5 ? 0 : Math.PI);
      ax = Math.cos(safeAng) * 6.0;
      ay = Math.sin(safeAng) * 6.0;
      this.teleportCd = 6.0;
    }

    const out = new Float32Array(5);
    out[0] = ax; out[1] = ay;
    out[2] = Math.cos(shootAngle); out[3] = Math.sin(shootAngle);
    out[4] = shoot;
    return out;
  }

  clone() { return this; }
  serialize() { return {}; }
};

console.log('[bot] ЕДИНЫЙ СУПЕРМОЗГ готов (собирает всё, стреляет насквозь)');
})();




