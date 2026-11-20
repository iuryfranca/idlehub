// Gera as capturas do IdleHub usadas na listagem da Microsoft Store e no manual do video (docs/store/screens/).
// Rodar: npm run screens  (precisa do Electron instalado: npm install)
// Cada captura usa uma pasta de dados temporaria e um script que, dentro do app, troca o conteudo dos paineis
// por uma pagina de jogo de demonstracao (ficticia). O app em si nao muda; nada e enviado para fora.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const APP = path.resolve(__dirname, '..');
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'idlehub-shots-'));
const OUT = path.join(S, 'raw');
// Idioma das capturas (SHOTS_LANG=pt-BR|en|es): o app e o jogo de demonstracao ficam nesse idioma.
// pt-BR vai para docs/store/screens/; os outros para docs/store/screens/<idioma>/.
// SHOTS_ONLY=grid-dark,mix-dark gera so as capturas listadas.
const LANG = ['pt-BR', 'en', 'es'].includes(process.env.SHOTS_LANG) ? process.env.SHOTS_LANG : 'pt-BR';
const ONLY = (process.env.SHOTS_ONLY || '').split(',').map((x) => x.trim()).filter(Boolean);
const FINAL = path.join(APP, 'docs', 'store', 'screens', ...(LANG === 'pt-BR' ? [] : [LANG]));

// Textos ficticios da demonstracao em cada idioma.
const T = {
  'pt-BR': { games: ['Reino Ocioso', 'Minas de Cristal', 'Forja Estelar'], accounts: ['Principal', 'Farm 01', 'Farm 02', 'Alt', 'Conta 1', 'Main'], mix: 'Farm da noite', host: 'jogo de demonstração',
    zones: ['Floresta Sombria', 'Pântano de Névoa', 'Ruínas de Âmbar', 'Picos Gelados', 'Mina Profunda'], foes: ['Slime Ancestral', 'Lobo de Névoa', 'Golem de Âmbar', 'Wyrm Gélido', 'Verme de Cristal'],
    floor: 'andar', hp: '% de vida · ataque automático', hero: 'Herói', level: 'Nível', dps: 'Dano/s', kills: 'Abates', gold: ['1,24 M', '860 K', '792 K', '41 K', '9,6 K', '318 K'] },
  en: { games: ['Idle Kingdom', 'Crystal Mines', 'Star Forge'], accounts: ['Main', 'Farm 01', 'Farm 02', 'Alt', 'Account 1', 'Main'], mix: 'Night farm', host: 'demo game',
    zones: ['Shadow Forest', 'Mist Marsh', 'Amber Ruins', 'Frozen Peaks', 'Deep Mine'], foes: ['Ancient Slime', 'Mist Wolf', 'Amber Golem', 'Frost Wyrm', 'Crystal Worm'],
    floor: 'floor', hp: '% health · auto attack', hero: 'Hero', level: 'Level', dps: 'DPS', kills: 'Kills', gold: ['1.24 M', '860 K', '792 K', '41 K', '9.6 K', '318 K'] },
  es: { games: ['Reino Ocioso', 'Minas de Cristal', 'Forja Estelar'], accounts: ['Principal', 'Farm 01', 'Farm 02', 'Alt', 'Cuenta 1', 'Main'], mix: 'Farm nocturno', host: 'juego de demostración',
    zones: ['Bosque Sombrío', 'Pantano de Niebla', 'Ruinas de Ámbar', 'Picos Helados', 'Mina Profunda'], foes: ['Slime Ancestral', 'Lobo de Niebla', 'Gólem de Ámbar', 'Wyrm Gélido', 'Gusano de Cristal'],
    floor: 'piso', hp: '% de vida · ataque automático', hero: 'Héroe', level: 'Nivel', dps: 'Daño/s', kills: 'Bajas', gold: ['1,24 M', '860 K', '792 K', '41 K', '9,6 K', '318 K'] }
}[LANG];
const ELECTRON = path.join(APP, 'node_modules', 'electron', 'dist', 'electron.exe');
fs.mkdirSync(OUT, { recursive: true });

const games = [
  { id: 'g-reino', name: T.games[0], url: 'https://example.com/' },
  { id: 'g-minas', name: T.games[1], url: 'https://example.org/' },
  { id: 'g-forja', name: T.games[2], url: 'https://example.net/' }
];
const accounts = [
  { id: 'a-1', gameId: 'g-reino', name: T.accounts[0] },
  { id: 'a-2', gameId: 'g-reino', name: T.accounts[1], muted: true },
  { id: 'a-3', gameId: 'g-reino', name: T.accounts[2] },
  { id: 'a-4', gameId: 'g-reino', name: T.accounts[3] },
  { id: 'a-5', gameId: 'g-minas', name: T.accounts[4] },
  { id: 'a-6', gameId: 'g-forja', name: T.accounts[5] }
];
// Espaco misto de demonstracao: 4 telas de 3 jogos.
const MIX = { id: 'm-noite', name: T.mix, accounts: ['a-1', 'a-5', 'a-6', 'a-3'], layout: 'grade', aspect: 'livre', featured: null, split: 0.68 };

// Pagina de jogo de demonstracao (ficticia), diferente por conta.
const DEMO = `(i) => {
  const T = ${JSON.stringify(T)};
  const zones = T.zones, foes = T.foes;
  const lvl = [42, 37, 35, 18, 9, 27][i] || 12, gold = T.gold[i] || '58 K', hp = [64, 22, 81, 47, 90, 58][i] || 50;
  return '<style>*{box-sizing:border-box;margin:0}body{font:14px/1.4 Georgia,serif;color:#f3e9d2;background:radial-gradient(circle at 70% 20%,#3b4a2a,#14190f 70%);height:100vh;display:flex;flex-direction:column;gap:14px;padding:18px;overflow:hidden}'
   + '.top{display:flex;justify-content:space-between;align-items:center}.zone{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#c9b98a}'
   + '.res{display:flex;gap:10px}.res span{background:#0008;border:1px solid #6b5a33;border-radius:999px;padding:4px 12px;font-weight:bold}'
   + '.foe{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}.blob{width:120px;height:96px;border-radius:50% 50% 44% 44%;background:radial-gradient(circle at 35% 35%,#b9e86b,#3f7a1f);box-shadow:0 16px 30px #0009}'
   + '.name{font-size:20px;font-weight:bold}.bar{width:70%;height:12px;border-radius:6px;background:#0009;border:1px solid #6b5a33;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#d94b3b,#f08a4b)}'
   + '.hero{display:flex;gap:10px}.card{flex:1;background:#0007;border:1px solid #6b5a33;border-radius:10px;padding:10px}.card b{display:block;color:#ffd77a;font-size:16px}.xp{height:6px;border-radius:3px;background:#0009;margin-top:6px}.xp i{display:block;height:100%;background:#7ad0ff;border-radius:3px}</style>'
   + '<div class="top"><div class="zone">' + zones[i % 5] + ' · ' + T.floor + ' ' + (lvl * 3) + '</div><div class="res"><span>🪙 ' + gold + '</span><span>💎 ' + (lvl * 7) + '</span></div></div>'
   + '<div class="foe"><div class="blob"></div><div class="name">' + foes[i % 5] + '</div><div class="bar"><i style="width:' + hp + '%"></i></div><div style="color:#c9b98a">' + hp + T.hp + '</div></div>'
   + '<div class="hero"><div class="card">' + T.hero + '<b>' + T.level + ' ' + lvl + '</b><div class="xp"><i style="width:' + (30 + i * 13) + '%"></i></div></div><div class="card">' + T.dps + '<b>' + (lvl * 113) + '</b></div><div class="card">' + T.kills + '<b>' + (lvl * 271) + '</b></div></div>';
}`;

function inject(extra = '') {
  return `(async () => {
    const w = (ms) => new Promise((r) => setTimeout(r, ms));
    const demo = ${DEMO};
    const fill = async () => {
      const panels = [...document.querySelectorAll('.panel')];
      for (const p of panels) {
        const wv = p.querySelector('webview'); if (!wv) continue;
        const i = ['a-1','a-2','a-3','a-4','a-5','a-6'].indexOf(p.dataset.id);
        try { await wv.executeJavaScript('document.documentElement.innerHTML = ' + JSON.stringify(demo(i)) + ';'); } catch (e) {}
      }
    };
    await w(1500); await fill();
    const host = document.getElementById('gameHost'); if (host && !document.getElementById('stage').classList.contains('mixed')) host.textContent = ${JSON.stringify(T.host)};
    ${extra}
    await w(600);
    const d = document.documentElement.dataset; return { theme: d.theme, mode: d.mode, lateralRecolhida: document.getElementById('shell').classList.contains('drawer-closed'), monitor: !document.getElementById('monitor').hidden, hibernadas: document.querySelectorAll('.sleep-card').length, userData: (await hub.load()).state.prefs };
  })()`;
}

const shots = [
  { file: 'grid-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' } },
  { file: 'spotlight-light', prefs: { theme: 'oceano', mode: 'claro', drawer: true }, game: { layout: 'destaque', featured: 'a-1', split: 0.66 } },
  { file: 'rail-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: false }, game: { layout: 'grade' } },
  { file: 'hibernate-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' }, hibernate: 'a-2' },
  { file: 'monitor-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' },
    extra: "document.getElementById('navMonitor').click(); await w(9000);" },
  // hub de jogos: catalogo com logos (Adicionar jogo)
  { file: 'hub-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' },
    extra: "document.getElementById('addGame').click(); await w(1200);" },
  // espaco misto: editor com 4 contas de 3 jogos escolhidas, e o espaco pronto na tela
  { file: 'mix-editor-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' },
    extra: "document.getElementById('newMix').click(); await w(400); document.getElementById('mixName').value = 'Farm da noite'; for (const id of ['Principal', 'Conta 1', 'Main', 'Farm 02']) { [...document.querySelectorAll('.mix-acc')].find((b) => b.textContent.endsWith(id)).click(); await w(150); }" },
  { file: 'mix-dark', prefs: { theme: 'aurora', mode: 'escuro', drawer: true, activeMix: 'm-noite' }, game: { layout: 'grade' }, mixes: [MIX] },
  { file: 'themes-grafite', prefs: { theme: 'grafite', mode: 'escuro', drawer: true }, game: { layout: 'grade' } },
  { file: 'themes-aurora', prefs: { theme: 'aurora', mode: 'escuro', drawer: true }, game: { layout: 'grade' } },
  { file: 'themes-oceano', prefs: { theme: 'oceano', mode: 'escuro', drawer: true }, game: { layout: 'grade' } },
  { file: 'themes-areia', prefs: { theme: 'areia', mode: 'claro', drawer: true }, game: { layout: 'grade' } },
  { file: 'themes-papel', prefs: { theme: 'papel', mode: 'claro', drawer: true }, game: { layout: 'grade' } }
];

for (const shot of shots.filter((x) => !ONLY.length || ONLY.includes(x.file))) {
  const ud = path.join(S, 'shots-ud', shot.file);
  fs.rmSync(ud, { recursive: true, force: true });
  fs.mkdirSync(ud, { recursive: true });
  const state = {
    games: games.map((g, i) => ({ ...g, zoom: 1, aspect: 'livre', layout: 'grade', featured: null, split: 0.68, ...(i === 0 ? shot.game : {}) })),
    accounts: accounts.map((a) => ({ muted: false, hibernated: a.id === shot.hibernate, ...a })),
    mixes: shot.mixes || [],
    prefs: { lang: LANG, muted: false, activeGame: 'g-reino', ...shot.prefs }
  };
  fs.writeFileSync(path.join(ud, 'idlehub.json'), JSON.stringify(state));
  const js = path.join(S, 'shots-ud', shot.file + '.js');
  fs.writeFileSync(js, inject(shot.extra || ''));
  const png = path.join(OUT, shot.file + '.png');
  try {
    execFileSync(ELECTRON, [APP], { env: { ...process.env, IDLEHUB_USERDATA: ud, IDLEHUB_SMOKE: png, IDLEHUB_SMOKE_JS: js, IDLEHUB_SMOKE_DELAY: '2000' }, timeout: 90000, stdio: 'ignore' });
  } catch (e) { console.log('falhou', shot.file, e.message); }
  console.log(shot.file, 'pedido:', JSON.stringify(shot.prefs), 'obtido:', fs.existsSync(png + '.json') ? fs.readFileSync(png + '.json','utf8').replace(/s+/g,' ') : '-', fs.existsSync(png) ? fs.statSync(png).size + ' bytes' : 'SEM ARQUIVO');
}

// Reduz para 1600 px de largura (site leve) usando o proprio Electron.
execFileSync(ELECTRON, [path.join(__dirname, 'resize-images.js'), OUT, FINAL, '1600'], { stdio: 'inherit' });
fs.rmSync(S, { recursive: true, force: true });
