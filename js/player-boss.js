(() => {
'use strict';
window.createPlayerBossArena = function (canvas) {
  const ctx = canvas.getContext('2d');
  const VW = 800, VH = 600;
  const WALL = 34;
  const room = { x: WALL, y: WALL, w: VW - WALL*2, h: VH - WALL*2 };
  const cx0 = room.x + room.w / 2, cy0 = room.y + room.h / 2;
  let state = 'playing';
  let boss = null, agents = [], tears = [], minions = [], portals = [], artifacts = [];
  let time = 0, regenTimer = 0, artifactSpawnCd = 2.0, totalArtifacts = 0, deliriumTimer = 2.5;
  const input = { keys: new Set(), mouse: { x: cx0, y: cy0, down: false, rightDown: false }, pkmCd: 0, spaceCd: 0, eCd: 0, shiftCd: 0, fCd: 0 };

  function reset(nets, colors, bossType = 'awakened') {
    state = 'playing'; time = 0;
    tears = []; agents = []; minions = []; portals = []; artifacts = [];
    artifactSpawnCd = 2.0; totalArtifacts = 0;
    const cfg = BOSS_TYPES[bossType] || BOSS_TYPES.awakened;
    if (bossType === 'delirium') deliriumTimer = 2.0;
    boss = { type: bossType, x: cx0, y: cy0 - 100, vx: 0, vy: 0, r: 40,
      hp: (cfg && cfg.hp) || 8000, maxHp: (cfg && cfg.hp) || 8000,
      speed: (cfg && cfg.speed) || 250,
      color: (cfg && cfg.colors && cfg.colors[0]) || '#c66bff',
      attackCd: 0, invuln: 1.0, phase: 1 };
    for (let i = 0; i < nets.length; i++) {
      const angle = (i / nets.length) * Math.PI * 2;
      const hpBonus = window.Shop ? window.Shop.getBonus('hp') : 0;
      const dmgBonus = window.Shop ? window.Shop.getBonus('damage') : 0;
      const spdBonus = window.Shop ? window.Shop.getBonus('speed') : 0;
      const invBonus = window.Shop ? window.Shop.getBonus('invuln') : 0;
      agents.push({ id: i, net: nets[i], color: colors[i],
        x: cx0 + Math.cos(angle) * 250, y: cy0 + 100 + Math.sin(angle) * 150,
        vx: 0, vy: 0, r: 8,
        hp: 15 + hpBonus, maxHp: 15 + hpBonus,
        speed: 180 + spdBonus, damage: 2 + dmgBonus,
        fireRate: 2, range: 500, tearSpeed: 450, multishot: 1,
        shootCd: 0, invuln: 1.0 + invBonus });
    }
    input.pkmCd = 0; input.spaceCd = 0; input.eCd = 0; input.shiftCd = 0; input.fCd = 0;
  }

  function updateBoss(dt) {
    if (!boss || boss.hp <= 0) return;
    if (boss.type === 'delirium') {
      deliriumTimer -= dt;
      if (deliriumTimer <= 0) {
        deliriumTimer = 2.5 + Math.random() * 2.0;
        const forms = ['awakened', 'sans', 'rumbling_knight', 'dark_lord', 'victim', 'devil', 'portal'];
        const nf = pick(forms); const cfg = BOSS_TYPES[nf];
        boss.type = nf;
        boss.color = (cfg && cfg.colors) ? cfg.colors[Math.min(boss.phase - 1, cfg.colors.length - 1)] : '#c66bff';
        boss.maxHp = (cfg && cfg.hp) || 8000;
      }
    }
    let ax = 0, ay = 0;
    if (input.keys.has('w') || input.keys.has('arrowup') || input.keys.has('ц')) ay -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown') || input.keys.has('ы')) ay += 1;
    if (input.keys.has('a') || input.keys.has('arrowleft') || input.keys.has('ф')) ax -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright') || input.keys.has('в')) ax += 1;
    const len = Math.hypot(ax, ay); if (len > 1) { ax /= len; ay /= len; }
    let np = 1;
    if (boss.hp < boss.maxHp * 0.25) np = 6;
    else if (boss.hp < boss.maxHp * 0.40) np = 5;
    else if (boss.hp < boss.maxHp * 0.55) np = 4;
    else if (boss.hp < boss.maxHp * 0.70) np = 3;
    else if (boss.hp < boss.maxHp * 0.85) np = 2;
    if (np !== boss.phase) {
      boss.phase = np;
      const bcfg = BOSS_TYPES[boss.type];
      boss.color = (bcfg && bcfg.colors) ? bcfg.colors[Math.min(boss.phase - 1, bcfg.colors.length - 1)] : '#c66bff';
      boss.invuln = 1.0;
    }
    const sm = 1.0 + (boss.phase - 1) * 0.1;
    boss.vx += (ax * boss.speed * sm - boss.vx) * Math.min(1, dt * 10);
    boss.vy += (ay * boss.speed * sm - boss.vy) * Math.min(1, dt * 10);
    boss.x += boss.vx * dt; boss.y += boss.vy * dt;
    boss.x = clamp(boss.x, room.x + boss.r, room.x + room.w - boss.r);
    boss.y = clamp(boss.y, room.y + boss.r, room.y + room.h - boss.r);
    boss.attackCd = Math.max(0, boss.attackCd - dt);
    input.pkmCd = Math.max(0, input.pkmCd - dt);
    input.spaceCd = Math.max(0, input.spaceCd - dt);
    input.eCd = Math.max(0, input.eCd - dt);
    input.shiftCd = Math.max(0, input.shiftCd - dt);
    input.fCd = Math.max(0, input.fCd - dt);
    const target = agents.find(a => a.hp > 0) || { x: boss.x, y: boss.y };
    const dx = target.x - boss.x, dy = target.y - boss.y, d = Math.hypot(dx, dy) || 1;
    const atk = boss.type;
    const rageMult = boss.hp < boss.maxHp * 0.2 ? 2.0 : 1.0;
    if (input.mouse.down && boss.attackCd <= 0) {
      boss.attackCd = (0.25 - (boss.phase * 0.02)) / rageMult;
      const bullets = 3 + (boss.phase - 1);
      const angle = Math.atan2(input.mouse.y - boss.y, input.mouse.x - boss.x);
      for (let k = -(bullets-1)/2; k <= (bullets-1)/2; k++) {
        const a = angle + k * 0.15;
        tears.push({ x: boss.x, y: boss.y, vx: Math.cos(a)*400, vy: Math.sin(a)*400, r: 7, dmg: 2, life: 2, from: 'boss' });
      }
    }
    if (input.mouse.rightDown && input.pkmCd <= 0) {
      input.pkmCd = 3.0;
      if (atk === 'awakened') { for(let k=0;k<3;k++) tears.push({x:boss.x, y:boss.y, vx:Math.cos(time+k*2)*200, vy:Math.sin(time+k*2)*200, r:6, dmg:2, life:3, from:'boss'}); }
      else if (atk === 'sans') { tears.push({x:boss.x, y:boss.y, vx:Math.cos(Math.atan2(dy,dx))*800, vy:Math.sin(Math.atan2(dy,dx))*800, r:12, dmg:4, life:1.5, from:'boss', isLaser:true}); }
      else if (atk === 'rumbling_knight') { for(let k=0;k<20;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.314)*180,vy:Math.sin(k*0.314)*180,r:6,dmg:2,life:2,from:'boss'}); }
      else if (atk === 'dark_lord') { for(let k=-1;k<=1;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx)+k*0.2)*500,vy:Math.sin(Math.atan2(dy,dx)+k*0.2)*500,r:8,dmg:3,life:1.5,from:'boss'}); }
      else if (atk === 'victim') { for(let k=0;k<8;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.785)*300,vy:Math.sin(k*0.785)*300,r:6,dmg:1,life:2,from:'boss'}); }
      else if (atk === 'devil') { for(let k=0;k<3;k++) minions.push({x:boss.x+rand(-30,30),y:boss.y+rand(-30,30),hp:3,r:8,color:'#ff0000'}); }
      else if (atk === 'portal') { portals = [{x:rand(room.x+80,room.x+room.w/2-80),y:rand(room.y+80,room.y+room.h-80),r:30,color:'#00ffff'},{x:rand(room.x+room.w/2+80,room.x+room.w-80),y:rand(room.y+80,room.y+room.h-80),r:30,color:'#ff00ff'}]; }
      else if (atk === 'delirium') { const nf = pick(['awakened','sans','rumbling_knight','dark_lord','victim','devil','portal']); boss.type = nf; const ncfg = BOSS_TYPES[nf]; boss.color = (ncfg && ncfg.colors) ? ncfg.colors[Math.min(boss.phase-1, ncfg.colors.length-1)] : '#c66bff'; }
    }
    if (input.keys.has(' ') && input.spaceCd <= 0) {
      input.spaceCd = 4.0;
      if (atk === 'awakened') { for(let k=0;k<20;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.314)*150,vy:Math.sin(k*0.314)*150,r:5,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'sans') { for(let k=-2;k<=2;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx))*400+k*60,vy:Math.sin(Math.atan2(dy,dx))*400+k*60,r:4,dmg:2,life:2,from:'boss'}); }
      else if (atk === 'rumbling_knight') { for(let k=0;k<24;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.261)*180,vy:Math.sin(k*0.261)*180,r:6,dmg:2,life:2,from:'boss'}); }
      else if (atk === 'dark_lord') { tears.push({x:target.x,y:room.y-50,vx:0,vy:400,r:20,dmg:4,life:3,from:'boss'}); }
      else if (atk === 'victim') { for(let k=0;k<4;k++) minions.push({x:boss.x+rand(-30,30),y:boss.y+rand(-30,30),hp:2,r:6,color:'#ff0000'}); }
      else if (atk === 'devil') { for(let k=-1;k<=1;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx)+k*0.3)*400,vy:Math.sin(Math.atan2(dy,dx)+k*0.3)*400,r:6,dmg:2,life:2,from:'boss'}); }
      else if (atk === 'portal') { for(let k=0;k<4;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*1.57+Math.PI/4)*250,vy:Math.sin(k*1.57+Math.PI/4)*250,r:6,dmg:2,life:3,from:'boss'}); }
    }
    if (input.keys.has('e') && input.eCd <= 0) {
      input.eCd = 5.0;
      if (atk === 'awakened') { for(let k=0;k<12;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.523)*250,vy:Math.sin(k*0.523)*250,r:7,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'sans') { for(let k=0;k<3;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx))*700,vy:Math.sin(Math.atan2(dy,dx))*700,r:15,dmg:0,life:1.0,from:'boss',isLaser:true}); }
      else if (atk === 'rumbling_knight') { for(let k=0;k<5;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*1.256+time)*250,vy:Math.sin(k*1.256+time)*250,r:8,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'dark_lord') { for(let k=0;k<3;k++) setTimeout(()=>{if(boss.hp>0)tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx))*600,vy:Math.sin(Math.atan2(dy,dx))*600,r:8,dmg:3,life:2,from:'boss'})},k*200); }
      else if (atk === 'victim') { for(let k=0;k<3;k++) tears.push({x:boss.x,y:boss.y+k*40,vx:Math.cos(Math.atan2(dy,dx))*350,vy:0,r:15,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'devil') { for(let k=0;k<20;k++) tears.push({x:rand(room.x,room.x+room.w),y:room.y,vx:0,vy:500,r:8,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'portal') { portals = [{x:rand(room.x+80,room.x+room.w/2-80),y:rand(room.y+80,room.y+room.h-80),r:30,color:'#00ffff'},{x:rand(room.x+room.w/2+80,room.x+room.w-80),y:rand(room.y+80,room.y+room.h-80),r:30,color:'#ff00ff'}]; }
    }
    if (input.keys.has('shift') && input.shiftCd <= 0) {
      input.shiftCd = 4.0;
      if (atk === 'awakened') { for(let k=0;k<4;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*1.57)*600,vy:Math.sin(k*1.57)*600,r:10,dmg:3,life:1.5,from:'boss',isLaser:true}); }
      else if (atk === 'sans') { for(let k=0;k<8;k++) setTimeout(()=>{if(boss.hp>0)tears.push({x:rand(room.x,room.x+room.w),y:room.y,vx:0,vy:400,r:4,dmg:1,life:3,from:'boss'})}, k*100); }
      else if (atk === 'rumbling_knight') { boss.vx = dx/d*600; boss.vy = dy/d*600; }
      else if (atk === 'dark_lord') { for(let k=0;k<6;k++) tears.push({x:rand(room.x,room.x+room.w),y:room.y-50,vx:0,vy:400,r:12,dmg:3,life:3,from:'boss'}); }
      else if (atk === 'victim') { for(let k=0;k<10;k++) tears.push({x:rand(room.x,room.x+room.w),y:room.y-20,vx:0,vy:400,r:8,dmg:2,life:3,from:'boss'}); }
      else if (atk === 'devil') { boss.vx = dx/d*800; boss.vy = dy/d*800; }
      else if (atk === 'portal') { boss.x = rand(room.x+50, room.x+room.w-50); boss.y = rand(room.y+50, room.y+room.h-50); }
    }
    if (input.keys.has('f') && input.fCd <= 0) {
      input.fCd = 6.0;
      if (atk === 'awakened') { for(const a of agents){a.vx+=dx/d*500;a.vy+=dy/d*500;} }
      else if (atk === 'sans') { for(let k=0;k<4;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*1.57+0.785)*700,vy:Math.sin(k*1.57+0.785)*700,r:12,dmg:3,life:1.5,from:'boss',isLaser:true}); }
      else if (atk === 'rumbling_knight') { for(const a of agents){if(dist2(a.x,a.y,boss.x,boss.y)<20000){a.hp-=3;a.invuln=0.5;}} }
      else if (atk === 'dark_lord') { for(let k=0;k<30;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.209)*250,vy:Math.sin(k*0.209)*250,r:8,dmg:3,life:4,from:'boss'}); }
      else if (atk === 'victim') { for(let k=0;k<12;k++) tears.push({x:boss.x,y:boss.y,vx:Math.cos(k*0.523)*500,vy:Math.sin(k*0.523)*500,r:10,dmg:3,life:2,from:'boss'}); }
      else if (atk === 'devil') { boss.hp -= 100; tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx))*150,vy:Math.sin(Math.atan2(dy,dx))*150,r:30,dmg:5,life:5,from:'boss'}); }
      else if (atk === 'portal') { tears.push({x:boss.x,y:boss.y,vx:Math.cos(Math.atan2(dy,dx))*1200,vy:Math.sin(Math.atan2(dy,dx))*1200,r:20,dmg:4,life:1.0,from:'boss',isLaser:true}); }
    }
  }

  function updateArtifacts(dt) {
    artifactSpawnCd -= dt;
    if (artifactSpawnCd <= 0 && artifacts.length < 8) {
      artifactSpawnCd = 1.5 + Math.random() * 1.0;
      const effect = pick(ARTIFACT_POOL);
      artifacts.push({ x: rand(room.x + 60, room.x + room.w - 60), y: rand(room.y + 60, room.y + room.h - 60), r: 12, effect, color: effect.color, bobT: 0 });
    }
    for (let i = artifacts.length - 1; i >= 0; i--) {
      const art = artifacts[i];
      art.bobT += dt;
      let picked = false;
      for (const a of agents) {
        if (a.hp <= 0) continue;
        if (dist2(a.x, a.y, art.x, art.y) < (a.r + art.r + 4)**2) {
          art.effect.apply(a); totalArtifacts++;
          if (boss && boss.hp > 0) boss.hp -= ARTIFACT_BOSS_DAMAGE;
          picked = true; break;
        }
      }
      if (picked) artifacts.splice(i, 1);
    }
  }

  function updateMinions(dt) {
    for (let i = minions.length - 1; i >= 0; i--) {
      const m = minions[i];
      let target = agents.find(a => a.hp > 0);
      if (target) { const dx = target.x - m.x, dy = target.y - m.y, d = Math.hypot(dx, dy) || 1; m.x += (dx/d)*150*dt; m.y += (dy/d)*150*dt; }
      for (const a of agents) {
        if (a.hp > 0 && dist2(m.x, m.y, a.x, a.y) < (m.r + a.r)**2) { if (a.invuln <= 0) { a.hp -= 1; a.invuln = 0.8; } minions.splice(i, 1); break; }
      }
    }
  }

  function updateAgents(dt) {
    for (const a of agents) {
      if (a.hp <= 0) continue;
      a.invuln = Math.max(0, a.invuln - dt);
      regenTimer += dt;
      const regenBonus = window.Shop ? window.Shop.getBonus("regen") : 0;
      const regenInterval = 4.0 / (1 + regenBonus);
      if (regenTimer >= regenInterval) { regenTimer = 0; if (a.hp < a.maxHp && a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + 1); }
      a.shootCd = Math.max(0, a.shootCd - dt);
      let out = a.net.forward(null, a, boss, tears, room, artifacts, minions, dt);
      const ax = clamp(out[0], -1, 1), ay = clamp(out[1], -1, 1);
      const shootAngle = Math.atan2(out[3], out[2]); const shooting = out[4] > 0;
      const len = Math.hypot(ax, ay); let nx = ax, ny = ay;
      if (len > 1) { nx /= len; ny /= len; }
      a.vx += (nx * a.speed - a.vx) * Math.min(1, dt * 18); a.vy += (ny * a.speed - a.vy) * Math.min(1, dt * 18);
      a.x += a.vx * dt; a.y += a.vy * dt;
      a.x = clamp(a.x, room.x + a.r, room.x + room.w - a.r); a.y = clamp(a.y, room.y + a.r, room.y + room.h - a.r);
      if (shooting && a.shootCd <= 0) {
        a.shootCd = 1 / a.fireRate;
        const bulletCount = a.multishot || 1;
        for (let k = 0; k < bulletCount; k++) {
          const spreadAng = shootAngle + (k - (bulletCount-1)/2) * 0.12;
          tears.push({ x: a.x, y: a.y, vx: Math.cos(spreadAng)*a.tearSpeed, vy: Math.sin(spreadAng)*a.tearSpeed, r: 5, dmg: a.damage * 1.2, life: a.range / a.tearSpeed, from: 'agent', agentId: a.id, color: a.color, pierce: 1 });
        }
      }
    }
  }

  function updateTears(dt) {
    for (let i = tears.length - 1; i >= 0; i--) {
      const t = tears[i];
      if (t.isLaser) { t.life -= dt; if (t.life <= 0) tears.splice(i, 1); continue; }
      t.x += t.vx*dt; t.y += t.vy*dt; t.life -= dt;
      if (portals.length === 2) {
        for (let pIdx = 0; pIdx < 2; pIdx++) {
          const p = portals[pIdx];
          if (dist2(t.x, t.y, p.x, p.y) < (t.r + p.r)**2) {
            const other = portals[1-pIdx];
            t.x = other.x; t.y = other.y;
            const spd = Math.hypot(t.vx, t.vy)||1;
            t.x += (t.vx/spd)*(other.r+t.r+10); t.y += (t.vy/spd)*(other.r+t.r+10);
            break;
          }
        }
      }
      if (t.x < room.x || t.x > room.x + room.w || t.y < room.y || t.y > room.y + room.h || t.life <= 0) { tears.splice(i, 1); continue; }
      if (t.from === 'boss') {
        for (const a of agents) {
          if (a.hp > 0 && dist2(t.x, t.y, a.x, a.y) < (t.r + a.r)**2) { if (a.invuln <= 0) { a.hp -= Math.max(1, Math.round(t.dmg * 0.7)); a.invuln = 0.8; } tears.splice(i, 1); break; }
        }
      } else {
        if (boss && boss.hp > 0 && dist2(t.x, t.y, boss.x, boss.y) < (t.r + boss.r)**2) {
          if (boss.invuln <= 0) boss.hp -= t.dmg;
          const shooter = agents.find(a => a.id === t.agentId);
          if (shooter && shooter.vampire) shooter.hp = Math.min(shooter.maxHp, shooter.hp + 0.5 * shooter.vampire);
          if (t.pierce > 0) { t.pierce--; } else { tears.splice(i, 1); }
        }
      }
    }
  }

  function step(dt) {
    if (state !== 'playing') return;
    time += dt;
    if (boss) boss.invuln = Math.max(0, boss.invuln - dt);
    updateBoss(dt); updateMinions(dt); updateAgents(dt); updateTears(dt); updateArtifacts(dt);
    if (boss && boss.hp <= 0) state = 'dead';
    if (agents.every(a => a.hp <= 0)) state = 'win';
  }

  function render() {
    ctx.setTransform(canvas.width / VW, 0, 0, canvas.height / VH, 0, 0);
    const pulse = Math.sin(time * 5) * 0.5 + 0.5;
    ctx.fillStyle = `rgb(${10 + pulse * 10}, ${2 + pulse * 5}, ${20 + pulse * 15})`;
    ctx.fillRect(0, 0, VW, VH);
    ctx.strokeStyle = `rgba(198, 107, 255, ${0.05 + pulse * 0.1})`; ctx.lineWidth = 2;
    for (let x = room.x; x < room.x + room.w; x += 80) { ctx.beginPath(); ctx.moveTo(x, room.y); ctx.lineTo(x, room.y + room.h); ctx.stroke(); }
    for (let y = room.y; y < room.y + room.h; y += 80) { ctx.beginPath(); ctx.moveTo(room.x, y); ctx.lineTo(room.x + room.w, y); ctx.stroke(); }
    for (const p of portals) { ctx.save(); ctx.shadowColor = p.color; ctx.shadowBlur = 30; ctx.strokeStyle = p.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke(); ctx.restore(); }
    for (const art of artifacts) {
      ctx.save();
      const bob = Math.sin(art.bobT * 4) * 3;
      ctx.translate(art.x, art.y + bob); ctx.rotate(art.bobT * 2);
      ctx.shadowColor = art.color; ctx.shadowBlur = 16; ctx.fillStyle = art.color;
      ctx.beginPath(); ctx.moveTo(0, -art.r); ctx.lineTo(art.r, 0); ctx.lineTo(0, art.r); ctx.lineTo(-art.r, 0);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = art.color; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText(art.effect.name || art.effect.kind, art.x, art.y - art.r - 6);
      ctx.restore();
    }
    if (boss && boss.hp > 0) {
      ctx.save(); if (boss.invuln > 0) ctx.globalAlpha = 0.5;
      ctx.shadowColor = boss.color; ctx.shadowBlur = 40; ctx.fillStyle = boss.color;
      const bt = BOSS_TYPES[boss.type];
      if (bt && bt.draw) {
        bt.draw(ctx, boss.x, boss.y, boss.r, time, boss.phase);
      } else {
        ctx.beginPath(); ctx.arc(boss.x, boss.y, boss.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(cx0 - 200, room.y + 10, 400, 16);
      ctx.fillStyle = boss.color; ctx.fillRect(cx0 - 198, room.y + 12, 396 * Math.max(0, boss.hp/boss.maxHp), 12);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      const bname = (BOSS_TYPES[boss.type] && BOSS_TYPES[boss.type].name) || boss.type;
      ctx.fillText(bname + ' · ФАЗА ' + boss.phase, cx0, room.y + 22);
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(room.x + 10, room.y + room.h - 130, 290, 120);
      ctx.strokeStyle = boss.color; ctx.lineWidth = 2; ctx.strokeRect(room.x + 10, room.y + room.h - 130, 290, 120);
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
      ctx.fillText('WASD — Движение', room.x + 20, room.y + room.h - 110);
      ctx.fillText('ЛКМ — Веер Смерти', room.x + 20, room.y + room.h - 92);
      ctx.fillStyle = input.pkmCd > 0 ? '#888' : '#88ff88'; ctx.fillText('ПКМ — Атака 1', room.x + 20, room.y + room.h - 74);
      ctx.fillStyle = input.spaceCd > 0 ? '#888' : '#ffd700'; ctx.fillText('ПРОБЕЛ — Атака 2', room.x + 20, room.y + room.h - 56);
      ctx.fillStyle = input.eCd > 0 ? '#888' : '#ff88aa'; ctx.fillText('E — Атака 3', room.x + 20, room.y + room.h - 38);
      ctx.fillStyle = input.shiftCd > 0 ? '#888' : '#aaffaa'; ctx.fillText('SHIFT — Атака 4', room.x + 20, room.y + room.h - 20);
      ctx.fillStyle = input.fCd > 0 ? '#888' : '#ff0000'; ctx.fillText('F — Атака 5', room.x + 170, room.y + room.h - 20);
    }
    for (const m of minions) { ctx.fillStyle = m.color; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill(); }
    for (const t of tears) {
      if (t.isLaser) { ctx.strokeStyle = boss ? boss.color : '#fff'; ctx.lineWidth = t.r; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + t.vx, t.y + t.vy); ctx.stroke(); }
      else { let color = t.from === 'boss' ? (boss ? boss.color : '#fff') : (t.color || '#88e0ff'); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
    }
    for (const a of agents) {
      if (a.hp <= 0) continue;
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(time * 4);
      ctx.shadowColor = a.color; ctx.shadowBlur = 20; ctx.fillStyle = a.color;
      ctx.beginPath(); ctx.moveTo(0, -a.r*1.5); ctx.lineTo(a.r*1.5, 0); ctx.lineTo(0, a.r*1.5); ctx.lineTo(-a.r*1.5, 0); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = a.hp > 3 ? '#7dffb1' : '#ff5577'; ctx.fillRect(a.x - 10, a.y + 14, 20 * (a.hp / a.maxHp), 3);
    }
    if (state === 'win') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,VW,VH); ctx.fillStyle = '#7dffb1'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'; ctx.fillText('ТЫ ПОБЕДИЛ!', cx0, cy0); }
    else if (state === 'dead') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,VW,VH); ctx.fillStyle = '#ff5577'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'; ctx.fillText('БОСС ПАЛ...', cx0, cy0); }
  }

  return { reset, step, render, get state() { return state; }, input };
};
console.log('[player-boss] Арена готова');
})();
