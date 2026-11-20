'use strict';
// Estado do app: jogos, contas e preferencias. O processo principal e a fonte da verdade:
// tudo que vem da interface passa por normalize() antes de ser gravado ou usado para liberar um painel.
const fs = require('node:fs');
const path = require('node:path');

const LIMITS = Object.freeze({ games: 40, accountsPerGame: 9, name: 40 });
const ASPECTS = Object.freeze(['livre', '16:9', '4:3', '3:2', '9:16']);
const LAYOUTS = Object.freeze(['grade', 'destaque']);
const THEMES = Object.freeze(['grafite', 'aurora', 'oceano', 'areia', 'papel']);
const LANGS = Object.freeze(['pt-BR', 'en', 'es']);
const MODES = Object.freeze(['sistema', 'claro', 'escuro']);

// Idioma inicial a partir do idioma do sistema (ex.: 'pt-BR', 'es-419', 'en-US').
const langFromLocale = (locale) => {
  const base = String(locale || '').toLowerCase().split('-')[0];
  return base === 'pt' ? 'pt-BR' : base === 'es' ? 'es' : 'en';
};
const ZOOM = Object.freeze({ min: 0.5, max: 2, step: 0.1 });
const SPLIT = Object.freeze({ min: 0.4, max: 0.85, initial: 0.68 });

const ID = /^[a-z0-9][a-z0-9-]{0,39}$/;
// Icone do jogo: so PNG em data URL (a interface ja converte o favicon para 64x64), ate ~45 KB.
const ICON = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
const ICON_MAX = 60000;
const cleanIcon = (s) => (typeof s === 'string' && s.length <= ICON_MAX && ICON.test(s) ? s : null);

const clamp = (n, lo, hi, fallback) => (Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback);
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const cleanName = (s) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, LIMITS.name) : '');

function cleanUrl(raw) {
  let u;
  try { u = new URL(String(raw).trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  u.hash = '';
  return u.href;
}

function emptyState() {
  return { version: 1, games: [], accounts: [], prefs: { theme: 'grafite', mode: 'sistema', lang: null, drawer: true, muted: false, activeGame: null } };
}

// Recebe qualquer coisa e devolve um estado valido; o que nao passa e descartado em silencio.
function normalize(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = emptyState();
  const gameIds = new Set();

  for (const g of Array.isArray(src.games) ? src.games : []) {
    if (out.games.length >= LIMITS.games) break;
    if (!g || !ID.test(g.id) || gameIds.has(g.id)) continue;
    const name = cleanName(g.name), url = cleanUrl(g.url);
    if (!name || !url) continue;
    gameIds.add(g.id);
    out.games.push({
      id: g.id, name, url,
      zoom: Math.round(clamp(Number(g.zoom), ZOOM.min, ZOOM.max, 1) * 100) / 100,
      aspect: pick(g.aspect, ASPECTS, 'livre'),
      layout: pick(g.layout, LAYOUTS, 'grade'),
      featured: typeof g.featured === 'string' ? g.featured : null,
      split: Math.round(clamp(Number(g.split), SPLIT.min, SPLIT.max, SPLIT.initial) * 1000) / 1000,
      icon: cleanIcon(g.icon)
    });
  }

  const accIds = new Set(), perGame = new Map();
  for (const a of Array.isArray(src.accounts) ? src.accounts : []) {
    if (!a || !ID.test(a.id) || accIds.has(a.id) || !gameIds.has(a.gameId)) continue;
    const n = perGame.get(a.gameId) || 0;
    if (n >= LIMITS.accountsPerGame) continue;
    const name = cleanName(a.name);
    if (!name) continue;
    accIds.add(a.id); perGame.set(a.gameId, n + 1);
    out.accounts.push({ id: a.id, gameId: a.gameId, name, muted: a.muted === true, hibernated: a.hibernated === true });
  }

  // o destaque precisa ser uma conta do proprio jogo
  for (const g of out.games) {
    if (g.featured && !out.accounts.some((a) => a.id === g.featured && a.gameId === g.id)) g.featured = null;
  }

  const p = src.prefs && typeof src.prefs === 'object' ? src.prefs : {};
  out.prefs.theme = pick(p.theme, THEMES, 'grafite');
  out.prefs.mode = pick(p.mode, MODES, 'sistema');
  out.prefs.lang = pick(p.lang, LANGS, null); // null = ainda nao escolhido (o processo principal usa o idioma do sistema)
  out.prefs.drawer = p.drawer !== false;
  out.prefs.muted = p.muted === true;
  out.prefs.activeGame = gameIds.has(p.activeGame) ? p.activeGame : (out.games[0]?.id ?? null);
  return out;
}

const partitionOf = (accountId) => 'persist:acc-' + accountId;
const accountOfPartition = (partition) => {
  const m = /^persist:acc-([a-z0-9][a-z0-9-]{0,39})$/.exec(String(partition || ''));
  return m ? m[1] : null;
};

class Store {
  constructor(file) {
    this.file = file;
    this.state = emptyState();
    try { this.state = normalize(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch (e) {
      if (e.code !== 'ENOENT') {
        // arquivo corrompido: guarda uma copia para nao perder nada e comeca do zero
        try { fs.copyFileSync(file, file + '.corrompido-' + Date.now()); } catch {}
      }
    }
  }
  save(next) {
    const state = normalize(next);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, this.file); // troca atomica: um crash no meio nao deixa o arquivo pela metade
    this.state = state;
    return state;
  }
  account(id) { return this.state.accounts.find((a) => a.id === id) || null; }
  game(id) { return this.state.games.find((g) => g.id === id) || null; }
}

module.exports = { Store, normalize, cleanUrl, cleanIcon, emptyState, partitionOf, accountOfPartition, langFromLocale, LIMITS, ASPECTS, LAYOUTS, THEMES, LANGS, MODES, ZOOM, SPLIT };
