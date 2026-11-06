(() => {
'use strict';

const SHOP_KEY = 'neuro_swarm_progress';
const UPGRADES = [
  { id: 'hp',      name: '❤️ Больше HP',       desc: '+5 HP боту',           cost: 100, apply: s => { s.hpBonus = (s.hpBonus || 0) + 5; } },
  { id: 'damage',  name: '⚔️ Больше урона',    desc: '+0.5 урона боту',      cost: 150, apply: s => { s.damageBonus = (s.damageBonus || 0) + 0.5; } },
  { id: 'speed',   name: '🏃 Больше скорости',  desc: '+20 скорости',         cost: 120, apply: s => { s.speedBonus = (s.speedBonus || 0) + 20; } },
  { id: 'regen',   name: '💚 Регенерация',      desc: '+0.5 HP/сек',          cost: 200, apply: s => { s.regenBonus = (s.regenBonus || 0) + 0.5; } },
  { id: 'invuln',  name: '🛡 Долгая неуязвимость', desc: '+0.3 сек invuln',   cost: 180, apply: s => { s.invulnBonus = (s.invulnBonus || 0) + 0.3; } },
];

window.Shop = {
  progress: { coins: 0, wins: 0, hpBonus: 0, damageBonus: 0, speedBonus: 0, regenBonus: 0, invulnBonus: 0 },
  upgrades: UPGRADES,

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SHOP_KEY));
      if (saved) Object.assign(this.progress, saved);
    } catch (e) { console.warn('Не удалось загрузить прогресс', e); }
    this.updateUI();
  },

  save() {
    localStorage.setItem(SHOP_KEY, JSON.stringify(this.progress));
    this.updateUI();
  },

  addCoins(n) { this.progress.coins += n; this.save(); },
  addWin() { this.progress.wins++; this.progress.coins += 50; this.save(); },

  buy(upgradeId) {
    const up = UPGRADES.find(u => u.id === upgradeId);
    if (!up) return false;
    if (this.progress.coins < up.cost) { alert('❌ Недостаточно монет! Нужно ' + up.cost); return false; }
    this.progress.coins -= up.cost;
    up.apply(this.progress);
    this.save();
    return true;
  },

  getBonus(type) { return this.progress[type + 'Bonus'] || 0; },

  updateUI() {
    const coinsEl = document.getElementById('s-coins');
    const winsEl = document.getElementById('s-wins');
    if (coinsEl) coinsEl.textContent = this.progress.coins;
    if (winsEl) winsEl.textContent = this.progress.wins;
    this.renderShop();
  },

  renderShop() {
    const list = document.getElementById('shop-items');
    if (!list) return;
    list.innerHTML = '';
    for (const up of UPGRADES) {
      const canAfford = this.progress.coins >= up.cost;
      const div = document.createElement('div');
      div.style.cssText = 'padding:12px; background:rgba(255,255,255,0.05); border-radius:8px; display:flex; justify-content:space-between; align-items:center;';
      div.innerHTML = `
        <div>
          <div style="font-weight:700; color:#fff;">${up.name}</div>
          <div style="font-size:12px; color:#aaa;">${up.desc}</div>
        </div>
        <button style="padding:8px 16px; background:${canAfford ? '#ffd700' : '#444'}; color:${canAfford ? '#000' : '#888'}; border:none; border-radius:6px; cursor:${canAfford ? 'pointer' : 'not-allowed'}; font-weight:700;" ${canAfford ? '' : 'disabled'}>${up.cost} 🪙</button>
      `;
      div.querySelector('button').addEventListener('click', () => {
        if (this.buy(up.id)) alert('✅ Куплено: ' + up.name);
      });
      list.appendChild(div);
    }
  }
};

console.log('[shop] Магазин готов (монеты, апгрейды, localStorage)');
})();
