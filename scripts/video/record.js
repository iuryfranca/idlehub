'use strict';
// Grava os videos curtos do site (um MP4 por recurso) com o app de verdade e jogos de demonstracao.
// Rodar: node scripts/video/record.js [saida] [cena1,cena2...]
// Precisa do ffmpeg no PATH. Saida padrao: site/public/videos/
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const APP = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(process.argv[2] || path.join(APP, 'site', 'public', 'videos'));
const ONLY = (process.argv[3] || '').split(',').filter(Boolean);
const ELECTRON = path.join(APP, 'node_modules', 'electron', 'dist', 'electron.exe');
const RUNNER = path.join(__dirname, 'runner.js');
fs.mkdirSync(OUT, { recursive: true });

const games = [
  { id: 'g-reino', name: 'Reino Ocioso', url: 'https://reino-ocioso.example/' },
  { id: 'g-minas', name: 'Minas de Cristal', url: 'https://minas-de-cristal.example/' },
  { id: 'g-forja', name: 'Forja Estelar', url: 'https://forja-estelar.example/' }
];
const accounts = [
  { id: 'a-1', gameId: 'g-reino', name: 'Principal' },
  { id: 'a-2', gameId: 'g-reino', name: 'Farm 01' },
  { id: 'a-3', gameId: 'g-reino', name: 'Farm 02' },
  { id: 'a-4', gameId: 'g-reino', name: 'Alt' },
  { id: 'a-5', gameId: 'g-minas', name: 'Conta 1' },
  { id: 'a-6', gameId: 'g-minas', name: 'Conta 2' },
  { id: 'a-7', gameId: 'g-forja', name: 'Main' }
];

// arquivo de saida -> cena e estado inicial
const VIDEOS = {
  hub: { scene: 'hub', games: ['g-reino', 'g-minas'], accounts: ['a-1', 'a-2', 'a-5'] },
  grid: { scene: 'grid', accounts: ['a-1', 'a-2', 'a-3', 'a-5', 'a-7'] },
  spotlight: { scene: 'spotlight' },
  mix: { scene: 'mix' },
  monitor: { scene: 'monitor' },
  hibernate: { scene: 'hibernate' }
};

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'idlehub-video-'));
for (const [file, v] of Object.entries(VIDEOS)) {
  if (ONLY.length && !ONLY.includes(file)) continue;
  const ud = path.join(TMP, file);
  fs.mkdirSync(ud, { recursive: true });
  const gs = games.filter((g) => !v.games || v.games.includes(g.id));
  const state = {
    games: gs.map((g) => ({ ...g, zoom: 1, aspect: 'livre', layout: 'grade', featured: null, split: 0.68, icon: null })),
    accounts: accounts.filter((a) => (!v.accounts || v.accounts.includes(a.id)) && gs.some((g) => g.id === a.gameId)).map((a) => ({ muted: false, hibernated: false, ...a })),
    mixes: [],
    prefs: { lang: 'pt-BR', theme: 'aurora', mode: 'escuro', drawer: true, muted: true, activeGame: 'g-reino', activeMix: null }
  };
  fs.writeFileSync(path.join(ud, 'idlehub.json'), JSON.stringify(state));
  const out = path.join(OUT, file + '.mp4');
  const t = Date.now();
  try {
    const log = execFileSync(ELECTRON, [RUNNER], { env: { ...process.env, IDLEHUB_USERDATA: ud, VIDEO_SCENE: v.scene, VIDEO_OUT: out }, timeout: 180000, encoding: 'utf8' });
    console.log(file, log.trim().split('\n').pop(), ((Date.now() - t) / 1000).toFixed(0) + ' s', fs.existsSync(out) ? (fs.statSync(out).size / 1e6).toFixed(2) + ' MB' : 'SEM ARQUIVO');
  } catch (e) {
    console.log('falhou', file, e.message, e.stdout, e.stderr);
  }
}
fs.rmSync(TMP, { recursive: true, force: true });
