'use strict';
// Pagina de jogo idle de DEMONSTRACAO (ficticia), usada so na gravacao dos videos do site.
// Tres "jogos" (pelo host): reino-ocioso, minas-de-cristal e forja-estelar. A conta muda os numeros.
// Tudo animado: o heroi ataca sozinho, numeros de dano sobem, o inimigo cai e outro aparece, o ouro conta.
// Clicar no inimigo da um golpe critico.

const KINDS = {
  reino: {
    bg: 'radial-gradient(circle at 70% 18%,#41552c,#151b10 72%)', ink: '#f3e9d2', dim: '#c9b98a', line: '#6b5a33', gold: '#ffd77a', font: 'Georgia,serif',
    zones: ['Floresta Sombria', 'Pântano de Névoa', 'Ruínas de Âmbar', 'Picos Gelados'],
    foes: [['Slime Ancestral', '#b9e86b', '#3f7a1f'], ['Lobo de Névoa', '#c9d3e6', '#56627a'], ['Golem de Âmbar', '#ffc46b', '#9a5a12'], ['Cogumelo Rei', '#ff8a7a', '#8a2a20']],
    res: ['🪙', '💎'], shape: 'blob'
  },
  minas: {
    bg: 'radial-gradient(circle at 30% 20%,#3a2a5c,#120d1f 72%)', ink: '#ece6ff', dim: '#b3a6dc', line: '#5b4a8a', gold: '#9ee8ff', font: '"Trebuchet MS",sans-serif',
    zones: ['Mina Profunda', 'Veio de Quartzo', 'Caverna Ecoante', 'Lago Subterrâneo'],
    foes: [['Verme de Cristal', '#c59bff', '#5b2ca8'], ['Morcego Rúnico', '#8ad8ff', '#1f5a8a'], ['Golem de Ametista', '#e59bff', '#7a1f8a'], ['Aranha de Gema', '#9bffd1', '#1f8a5b']],
    res: ['⛏️', '🔮'], shape: 'gem'
  },
  forja: {
    bg: 'radial-gradient(circle at 75% 25%,#5a2c14,#100c0a 70%)', ink: '#ffeede', dim: '#e0a878', line: '#7a4a2a', gold: '#ffb36b', font: '"Segoe UI",sans-serif',
    zones: ['Anel de Saturno', 'Nebulosa Rubra', 'Doca Orbital', 'Cinturão de Ferro'],
    foes: [['Drone Pirata', '#ffb36b', '#a84a12'], ['Mecha Rebelde', '#ffd36b', '#8a5a12'], ['Núcleo Instável', '#ff7a6b', '#8a1f12'], ['Sentinela Solar', '#ffe39b', '#a8741f']],
    res: ['⚙️', '⭐'], shape: 'core'
  }
};

function kindOf(host) {
  if (host.includes('minas')) return 'minas';
  if (host.includes('forja')) return 'forja';
  return 'reino';
}

function demoHtml(host, seed) {
  const k = KINDS[kindOf(host)];
  const s = Math.abs(seed | 0);
  const cfg = { ...k, seed: s, level: [42, 37, 35, 18, 27, 23, 31, 12][s % 8], gold: [1240000, 860000, 792000, 41000, 318000, 96000, 512000, 9600][s % 8] };
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${k.zones[0]}</title><style>
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{font-family:${k.font};color:${k.ink};background:${k.bg};display:flex;flex-direction:column;gap:2.4vmin;padding:3vmin;overflow:hidden;user-select:none}
.top{display:flex;justify-content:space-between;align-items:center;gap:2vmin}
.zone{font-size:clamp(10px,2.6vmin,15px);letter-spacing:.12em;text-transform:uppercase;color:${k.dim};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.res{display:flex;gap:1.6vmin}
.res span{background:#0008;border:1px solid ${k.line};border-radius:999px;padding:.6vmin 1.8vmin;font-weight:bold;font-size:clamp(10px,2.8vmin,16px);white-space:nowrap;font-variant-numeric:tabular-nums}
.arena{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.6vmin;min-height:0}
.foe{width:30vmin;height:24vmin;position:relative;cursor:pointer;animation:bob 1.6s ease-in-out infinite}
.body{position:absolute;inset:0;transition:transform .12s,filter .12s}
.blob .body{border-radius:50% 50% 44% 44%}
.gem .body{clip-path:polygon(50% 0,100% 38%,80% 100%,20% 100%,0 38%)}
.core .body{border-radius:50%;box-shadow:0 0 6vmin var(--c1)}
.eyes{position:absolute;left:28%;right:28%;top:40%;display:flex;justify-content:space-between}
.eyes i{width:2.4vmin;height:3vmin;background:#111;border-radius:50%}
.hit .body{transform:scale(.9,1.08);filter:brightness(2)}
.dead .foe{animation:die .45s forwards}
@keyframes bob{50%{transform:translateY(-1.4vmin)}}
@keyframes die{to{transform:scale(1.5);opacity:0;filter:blur(4px)}}
.shadow{width:24vmin;height:2.4vmin;border-radius:50%;background:#0007;margin-top:-1vmin}
.name{font-size:clamp(12px,3.4vmin,22px);font-weight:bold}
.bar{width:68%;height:2.2vmin;min-height:7px;border-radius:99px;background:#0009;border:1px solid ${k.line};overflow:hidden}
.bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#d94b3b,#f08a4b);transition:width .25s}
.dmg{position:absolute;font-weight:900;font-size:clamp(12px,3.6vmin,22px);color:#fff;text-shadow:0 2px 0 #000a;pointer-events:none;animation:up .9s ease-out forwards}
.dmg.crit{color:${k.gold};font-size:clamp(16px,5.4vmin,32px)}
@keyframes up{from{transform:translate(-50%,0) scale(.7);opacity:1}to{transform:translate(-50%,-9vmin) scale(1);opacity:0}}
.loot{position:absolute;font-size:clamp(12px,3.4vmin,20px);animation:loot 1s ease-out forwards}
@keyframes loot{from{transform:translate(0,0);opacity:1}to{transform:translate(var(--dx),-12vmin);opacity:0}}
.hud{display:flex;gap:1.6vmin}
.card{flex:1;background:#0007;border:1px solid ${k.line};border-radius:1.4vmin;padding:1.4vmin 1.8vmin;font-size:clamp(9px,2.3vmin,13px);color:${k.dim};min-width:0}
.card b{display:block;color:${k.gold};font-size:clamp(12px,3.2vmin,18px);font-variant-numeric:tabular-nums;white-space:nowrap}
.xp{height:1vmin;min-height:4px;border-radius:99px;background:#0009;margin-top:.8vmin;overflow:hidden}
.xp i{display:block;height:100%;background:#7ad0ff;transition:width .4s}
.up{animation:pop .5s}
@keyframes pop{40%{transform:scale(1.25)}}
</style></head><body>
<div class="top"><div class="zone" id="zone"></div><div class="res"><span id="g"></span><span id="d"></span></div></div>
<div class="arena" id="arena"><div class="foe ${k.shape}" id="foe"><div class="body" id="fb"></div><div class="eyes"><i></i><i></i></div></div><div class="shadow"></div><div class="name" id="fn"></div><div class="bar"><i id="hp"></i></div></div>
<div class="hud"><div class="card">Herói<b id="lv"></b><div class="xp"><i id="xp"></i></div></div><div class="card">Dano/s<b id="dps"></b></div><div class="card">Abates<b id="kills"></b></div></div>
<script>
(() => {
  const C = ${JSON.stringify(cfg)};
  const $ = (id) => document.getElementById(id);
  let rnd = C.seed * 9301 + 49297;
  const r = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  const fmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',') + ' M' : n >= 1e4 ? (n / 1e3).toFixed(1).replace('.', ',') + ' K' : Math.round(n).toLocaleString('pt-BR');
  let lvl = C.level, gold = C.gold, gems = lvl * 7, kills = lvl * 271, xp = 20 + (C.seed * 17) % 60, foe = C.seed % C.foes.length, hp = 100, max = 100;
  const floor = () => C.zones[C.seed % C.zones.length] + ' · andar ' + (lvl * 3);
  const paint = () => {
    $('zone').textContent = floor();
    $('g').textContent = C.res[0] + ' ' + fmt(gold);
    $('d').textContent = C.res[1] + ' ' + fmt(gems);
    $('lv').textContent = 'Nível ' + lvl;
    $('dps').textContent = fmt(lvl * 113);
    $('kills').textContent = fmt(kills);
    $('xp').style.width = xp + '%';
    $('hp').style.width = Math.max(0, (100 * hp) / max) + '%';
  };
  const setFoe = () => {
    const f = C.foes[foe % C.foes.length];
    $('fn').textContent = f[0];
    $('fb').style.background = 'radial-gradient(circle at 35% 30%,' + f[1] + ',' + f[2] + ')';
    $('foe').style.setProperty('--c1', f[1]);
    hp = max = 100;
  };
  const arena = $('arena');
  const float = (txt, crit) => {
    const n = document.createElement('div');
    n.className = 'dmg' + (crit ? ' crit' : '');
    n.textContent = txt;
    const fr = $('foe').getBoundingClientRect(), ar = arena.getBoundingClientRect();
    n.style.left = (fr.left - ar.left + fr.width * (0.2 + r() * 0.6)) + 'px';
    n.style.top = (fr.top - ar.top + fr.height * 0.1) + 'px';
    arena.appendChild(n);
    setTimeout(() => n.remove(), 950);
  };
  let dying = false;
  const hit = (crit) => {
    if (dying) return;
    const dmg = crit ? 34 + r() * 12 : 9 + r() * 9;
    hp -= dmg;
    float(fmt(dmg * lvl * (crit ? 41 : 23)) + (crit ? '!' : ''), crit);
    $('foe').classList.add('hit'); setTimeout(() => $('foe').classList.remove('hit'), 120);
    if (hp <= 0) {
      dying = true; hp = 0; kills++; xp += 9;
      const g = Math.round(lvl * 180 * (1 + r()));
      gold += g; gems += 1;
      for (let i = 0; i < 3; i++) {
        const l = document.createElement('div'); l.className = 'loot'; l.textContent = C.res[i % 2];
        const fr = $('foe').getBoundingClientRect(), ar = arena.getBoundingClientRect();
        l.style.left = (fr.left - ar.left + fr.width / 2) + 'px'; l.style.top = (fr.top - ar.top + fr.height / 2) + 'px';
        l.style.setProperty('--dx', ((i - 1) * 6) + 'vmin');
        arena.appendChild(l); setTimeout(() => l.remove(), 1000);
      }
      if (xp >= 100) { xp -= 100; lvl++; $('lv').classList.add('up'); setTimeout(() => $('lv').classList.remove('up'), 500); }
      $('g').classList.add('up'); setTimeout(() => $('g').classList.remove('up'), 500);
      arena.classList.add('dead');
      setTimeout(() => { arena.classList.remove('dead'); foe++; setFoe(); dying = false; paint(); }, 600);
    }
    paint();
  };
  setFoe(); hp = 35 + (C.seed * 23) % 60; paint();
  setTimeout(function tick() { hit(r() < 0.12); setTimeout(tick, 380 + r() * 260); }, 200 + (C.seed * 97) % 400);
  setInterval(() => { gold += lvl * 3; paint(); }, 250);
  $('foe').addEventListener('mousedown', () => hit(true));
})();
</script></body></html>`;
}

module.exports = { demoHtml, kindOf };
