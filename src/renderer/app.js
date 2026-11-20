'use strict';
/* global HubLayout, HubIcon, HubI18n, HubMonitor, hub */
(async function main() {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const t = HubI18n.t;
  const THEMES = ['grafite', 'aurora', 'oceano', 'areia', 'papel'];
  const themeName = (id) => t('theme' + id[0].toUpperCase() + id.slice(1));
  const HEAD = 40;          // altura da faixa de titulo de cada painel
  const BODY_INSET_X = 10;  // margens laterais do corpo (4+4) + bordas (1+1)
  const BODY_INSET_Y = 6;   // margem inferior do corpo (4) + bordas (1+1)
  const MODES = [{ id: 'sistema', icon: 'auto', key: 'modeSystem' }, { id: 'claro', icon: 'sun', key: 'modeLight' }, { id: 'escuro', icon: 'moon', key: 'modeDark' }];
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const GAP = 8;

  const boot = await hub.load();
  let S = boot.state;
  const catalog = boot.catalog;
  $('version').textContent = 'v' + boot.version;

  const views = new Map(); // accountId -> { el, head, frame, wv, url, ready, status }
  let focusId = null;
  let screen = 'games'; // 'games' ou 'monitor' (nao fica salvo: o app sempre abre nos jogos)
  let monitorScreen = null;
  let isFullscreen = false;

  // ---------- estado ----------
  const game = () => S.games.find((g) => g.id === S.prefs.activeGame) || null;
  const accountsOf = (gameId) => S.accounts.filter((a) => a.gameId === gameId);
  const uid = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  let saving = Promise.resolve();
  function commit(mutate) {
    const draft = structuredClone(S);
    mutate(draft);
    // So redesenha depois de gravado: o processo principal so libera o <webview> de uma conta que ja esta salva.
    S = draft;
    saving = saving.then(() => hub.save(draft)).then((saved) => { S = saved; render(); }).catch(() => toast(t('saveFailed')));
    return saving;
  }

  // ---------- paineis (webviews) ----------
  function setStatus(view, status) {
    view.status = status;
    view.el.dataset.status = status;
    view.dot.dataset.status = status;
    const dot = document.querySelector('.account-item[data-id="' + view.id + '"] .status');
    if (dot) dot.dataset.status = status;
  }

  function applyAudio(view) {
    const acc = S.accounts.find((a) => a.id === view.id);
    if (!view.wv || !view.ready || !acc) return;
    try { view.wv.setAudioMuted(S.prefs.muted || acc.muted); } catch {}
  }
  function applyZoom(view) {
    const acc = S.accounts.find((a) => a.id === view.id);
    const g = acc && S.games.find((x) => x.id === acc.gameId);
    if (!view.wv || !view.ready || !g) return;
    try { view.wv.setZoomFactor(g.zoom); } catch {}
  }

  function panelButton(icon, title, onClick) {
    const b = el('button', 'pbtn state'); b.type = 'button'; b.title = title;
    b.appendChild(HubIcon(icon));
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  function createView(acc, g) {
    const view = { id: acc.id, url: g.url, hibernated: acc.hibernated, ready: false, status: 'loading', startedAt: acc.hibernated ? 0 : Date.now() };
    const panel = el('section', 'panel'); panel.dataset.id = acc.id;
    const head = el('div', 'panel-head'); head.draggable = true;
    const idx = el('span', 'pidx');
    const dot = el('span', 'status');
    const name = el('span', 'pname');
    const actions = el('div', 'pactions');
    view.btnStar = panelButton('star', t('pinFeatured'), () => commit((d) => { const gg = d.games.find((x) => x.id === acc.gameId); gg.featured = acc.id; gg.layout = 'destaque'; }));
    view.btnMute = panelButton('sound', t('muteAccount'), () => commit((d) => { const a = d.accounts.find((x) => x.id === acc.id); if (a) a.muted = !a.muted; }));
    view.btnReload = panelButton('reload', t('reload'), () => { try { view.wv.reload(); } catch {} });
    view.btnFocus = panelButton('expand', t('expand'), () => toggleFocus(acc.id));
    view.btnSleep = panelButton(acc.hibernated ? 'sun' : 'moon', '', () => toggleHibernate(acc.id));
    view.btnMute.hidden = view.btnReload.hidden = acc.hibernated;
    actions.append(view.btnStar, view.btnMute, view.btnReload, view.btnSleep, view.btnFocus);
    head.append(idx, dot, name, actions);
    head.addEventListener('dblclick', () => toggleFocus(acc.id));

    const body = el('div', 'panel-body');
    const frame = el('div', 'panel-frame');
    panel.append(head, body);
    Object.assign(view, { el: panel, head, idx, dot, name, frame, wv: null });

    if (acc.hibernated) {
      // Conta hibernada: nenhum processo, so um cartao para acordar.
      const card = el('div', 'sleep-card');
      const wake = el('button', 'tonal-btn state'); wake.type = 'button';
      wake.append(HubIcon('sun'), el('span', null, t('wake')));
      wake.addEventListener('click', () => toggleHibernate(acc.id));
      card.append(HubIcon('moon'), el('h3', null, t('hibernated')), el('p', null, t('hibernatedText')), wake);
      body.appendChild(card);
      view.sleepTexts = card;
      wireDrag(view);
      $('stage').appendChild(panel);
      setStatus(view, 'sleep');
      views.set(acc.id, view);
      return view;
    }

    const wv = document.createElement('webview');
    wv.setAttribute('partition', 'persist:acc-' + acc.id);
    wv.setAttribute('allowpopups', '');
    wv.setAttribute('src', g.url);
    frame.appendChild(wv);
    body.appendChild(frame);
    view.wv = wv;
    wv.addEventListener('dom-ready', () => { view.ready = true; applyZoom(view); applyAudio(view); });
    wv.addEventListener('did-start-loading', () => setStatus(view, 'loading'));
    wv.addEventListener('did-stop-loading', () => { if (view.status === 'loading') setStatus(view, 'ok'); });
    wv.addEventListener('did-fail-load', (e) => { if (e.isMainFrame && e.errorCode !== -3) setStatus(view, 'error'); });
    wv.addEventListener('render-process-gone', () => { setStatus(view, 'error'); view.startedAt = Date.now(); });
    wv.addEventListener('page-title-updated', (e) => { head.title = e.title; });

    wireDrag(view);
    $('stage').appendChild(panel);
    setStatus(view, 'loading');
    views.set(acc.id, view);
    return view;
  }

  function destroyView(id) {
    const v = views.get(id);
    if (!v) return;
    v.el.remove();
    views.delete(id);
    if (focusId === id) focusId = null;
  }

  function syncViews() {
    const alive = new Set();
    for (const acc of S.accounts) {
      const g = S.games.find((x) => x.id === acc.gameId);
      let v = views.get(acc.id);
      if (v && (v.url !== g.url || v.hibernated !== acc.hibernated)) { destroyView(acc.id); v = null; } // link mudou ou hibernou/acordou: recria
      if (!v) v = createView(acc, g);
      alive.add(acc.id);
      v.name.textContent = acc.name;
      const muted = S.prefs.muted || acc.muted;
      v.btnMute.replaceChildren(HubIcon(muted ? 'mute' : 'sound'));
      v.btnMute.setAttribute('aria-pressed', String(acc.muted));
      v.btnMute.title = acc.muted ? t('accountMuted') : t('muteAccount');
      v.btnStar.title = t('pinFeatured'); v.btnReload.title = t('reload'); v.btnFocus.title = t('expand');
      v.btnSleep.title = acc.hibernated ? t('wake') : t('hibernate');
      applyAudio(v); applyZoom(v);
    }
    for (const id of [...views.keys()]) if (!alive.has(id)) destroyView(id);
  }

  // ---------- layout ----------
  const splitter = el('div', 'splitter');
  $('stage').appendChild(splitter);

  function layoutStage() {
    const stage = $('stage');
    const g = game();
    const ids = g ? accountsOf(g.id).map((a) => a.id) : [];
    if (focusId && !ids.includes(focusId)) focusId = null;
    const W = stage.clientWidth - GAP * 2, H = stage.clientHeight - GAP * 2;
    const out = HubLayout.compute({ ids, mode: g?.layout, featuredId: g?.featured, split: g?.split ?? 0.68, focusId, width: W, height: H, gap: GAP });

    for (const [id, v] of views) {
      const r = out.rects[id];
      if (!r) { v.el.classList.add('parked'); continue; } // outro jogo ou fora do foco: continua rodando, so nao aparece
      v.el.classList.remove('parked');
      v.el.classList.toggle('is-main', out.main === id && g.layout === 'destaque' && !focusId && ids.length > 1);
      v.el.classList.toggle('is-focus', focusId === id);
      Object.assign(v.el.style, { left: GAP + r.x + 'px', top: GAP + r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
      const f = HubLayout.fit(r.w - BODY_INSET_X, r.h - HEAD - BODY_INSET_Y, g.aspect);
      Object.assign(v.frame.style, { left: f.x + 'px', top: f.y + 'px', width: f.w + 'px', height: f.h + 'px' });
      v.idx.textContent = String(ids.indexOf(id) + 1);
      v.btnStar.hidden = ids.length < 2 || (g.layout === 'destaque' && out.main === id);
      v.btnFocus.replaceChildren(HubIcon(focusId === id ? 'shrink' : 'expand'));
    }
    if (out.splitter) {
      splitter.hidden = false;
      Object.assign(splitter.style, { left: GAP + out.splitter.x + 'px', top: GAP + 'px', width: out.splitter.w + 'px', height: out.splitter.h + 'px' });
    } else splitter.hidden = true;
  }
  new ResizeObserver(() => layoutStage()).observe($('stage'));

  function toggleFocus(id) { focusId = focusId === id ? null : id; layoutStage(); renderAccounts(); }

  // Divisoria do modo Destaque
  splitter.addEventListener('pointerdown', (e) => {
    const g = game(); if (!g) return;
    splitter.setPointerCapture(e.pointerId);
    document.body.classList.add('resizing');
    const rect = $('stage').getBoundingClientRect();
    const move = (ev) => { g.split = Math.min(0.85, Math.max(0.4, (ev.clientX - rect.left - GAP) / (rect.width - GAP * 3))); layoutStage(); };
    const up = () => {
      splitter.removeEventListener('pointermove', move);
      document.body.classList.remove('resizing');
      const split = g.split;
      commit((d) => { d.games.find((x) => x.id === g.id).split = split; });
    };
    splitter.addEventListener('pointermove', move);
    splitter.addEventListener('pointerup', up, { once: true });
  });

  // Arrastar a faixa de um painel sobre outro troca os dois de lugar.
  // Soltar sobre o painel grande do modo Destaque coloca o arrastado em destaque.
  let dragId = null;
  function wireDrag(view) {
    view.head.addEventListener('dragstart', (e) => {
      dragId = view.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', view.id);
      document.body.classList.add('dragging'); view.el.classList.add('drag-src');
    });
    view.head.addEventListener('dragend', () => {
      dragId = null; document.body.classList.remove('dragging');
      document.querySelectorAll('.panel.drag-src, .panel.drop-target').forEach((p) => p.classList.remove('drag-src', 'drop-target'));
    });
    view.el.addEventListener('dragover', (e) => { if (dragId && dragId !== view.id) { e.preventDefault(); view.el.classList.add('drop-target'); } });
    view.el.addEventListener('dragleave', () => view.el.classList.remove('drop-target'));
    view.el.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = dragId, to = view.id;
      if (!from || from === to) return;
      commit((d) => {
        const g = d.games.find((x) => x.id === d.prefs.activeGame);
        if (g.layout === 'destaque' && (g.featured || accountsOf(g.id)[0]?.id) === to) { g.featured = from; return; }
        const i = d.accounts.findIndex((a) => a.id === from), j = d.accounts.findIndex((a) => a.id === to);
        [d.accounts[i], d.accounts[j]] = [d.accounts[j], d.accounts[i]];
      });
    });
  }

  // ---------- lateral ----------
  function monogram(name) {
    const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] || '?') + (words[1]?.[0] || words[0]?.[1] || '')).toUpperCase();
  }

  function renderGames() {
    const list = $('gameList');
    list.replaceChildren();
    for (const g of S.games) {
      const b = el('button', 'nav-item state'); b.type = 'button'; b.title = g.name;
      const active = screen === 'games' && g.id === S.prefs.activeGame;
      b.classList.toggle('active', active);
      if (active) b.setAttribute('aria-current', 'page');
      const indicator = el('span', 'nav-indicator');
      indicator.appendChild(el('span', 'tile', monogram(g.name)));
      const n = accountsOf(g.id).length;
      b.append(indicator, el('span', 'label', g.name), el('span', 'count', n ? String(n) : ''));
      b.addEventListener('click', () => {
        if (screen !== 'games') setScreen('games');
        if (g.id !== S.prefs.activeGame) { focusId = null; commit((d) => { d.prefs.activeGame = g.id; }); }
      });
      list.appendChild(b);
    }
  }

  function renderAccounts() {
    const g = game();
    $('accountsSection').hidden = !g;
    if (!g) return;
    $('accountsLabel').textContent = t('accountsOf', { game: g.name });
    const list = $('accountList');
    list.replaceChildren();
    for (const a of accountsOf(g.id)) {
      const li = el('li', 'account-item'); li.dataset.id = a.id;
      li.classList.toggle('focused', focusId === a.id);
      const dot = el('span', 'status'); dot.dataset.status = views.get(a.id)?.status || 'loading';
      const name = el('button', 'account-name', a.name); name.type = 'button'; name.title = t('expandAccount');
      name.addEventListener('click', () => toggleFocus(a.id));
      const acts = el('span', 'account-actions');
      acts.append(
        panelButton('edit', t('rename'), () => renameAccount(a)),
        panelButton('trash', t('removeAccount'), () => removeAccount(a))
      );
      if (a.muted) li.appendChild(Object.assign(el('span', 'muted-flag'), { title: t('muted') })).appendChild(HubIcon('mute'));
      li.prepend(dot, name);
      li.appendChild(acts);
      list.appendChild(li);
    }
    $('addAccount').disabled = accountsOf(g.id).length >= 9;
  }

  function renderThemes() {
    const box = $('themes');
    if (!box.childElementCount) {
      for (const id of THEMES) {
        const b = el('button', 'swatch'); b.type = 'button'; b.dataset.theme = id;
        b.setAttribute('role', 'radio');
        b.addEventListener('click', () => commit((d) => { d.prefs.theme = id; }));
        box.appendChild(b);
      }
    }
    box.querySelectorAll('button').forEach((b) => {
      b.title = themeName(b.dataset.theme);
      b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-checked', String(b.dataset.theme === S.prefs.theme));
    });
  }

  // ---------- aparencia (claro / escuro / seguir o sistema) ----------
  const resolvedMode = () => (S.prefs.mode === 'claro' ? 'light' : S.prefs.mode === 'escuro' ? 'dark' : darkQuery.matches ? 'dark' : 'light');
  darkQuery.addEventListener('change', () => { if (S.prefs.mode === 'sistema') document.documentElement.dataset.mode = resolvedMode(); });

  function renderModes() {
    const box = $('modes');
    if (!box.childElementCount) {
      for (const m of MODES) {
        const b = el('button', 'state'); b.type = 'button'; b.dataset.mode = m.id; b.setAttribute('role', 'radio');
        b.appendChild(HubIcon(m.icon));
        b.addEventListener('click', () => commit((d) => { d.prefs.mode = m.id; }));
        box.appendChild(b);
      }
    }
    for (const b of box.children) {
      const m = MODES.find((x) => x.id === b.dataset.mode);
      b.title = t(m.key); b.setAttribute('aria-label', b.title);
      b.setAttribute('aria-checked', String(m.id === S.prefs.mode));
    }
  }

  // ---------- idioma ----------
  // Uma lingua por vez: todo texto fixo da interface vem do dicionario do idioma escolhido.
  function renderLanguage() {
    const select = $('language');
    if (!select.options.length) {
      for (const lang of HubI18n.LANGUAGES) select.appendChild(Object.assign(el('option', null, lang.label), { value: lang.id }));
      select.addEventListener('change', () => {
        commit((d) => { d.prefs.lang = select.value; }).then(() => toast(t('languageChanged')));
      });
    }
    select.value = S.prefs.lang;
    HubI18n.setLanguage(S.prefs.lang);
    document.documentElement.lang = S.prefs.lang;
    // textos fixos do index.html
    document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
    splitter.title = t('dragToResize');
    for (const v of views.values()) if (v.sleepTexts) {
      v.sleepTexts.querySelector('h3').textContent = t('hibernated');
      v.sleepTexts.querySelector('p').textContent = t('hibernatedText');
      v.sleepTexts.querySelector('button span').textContent = t('wake');
    }
    monitorScreen?.renderTexts();
  }

  // ---------- barra ----------
  function renderBar() {
    const g = game();
    const onMonitor = screen === 'monitor';
    $('gameTitle').textContent = onMonitor ? t('monitor') : g ? g.name : t('noGame');
    $('gameHost').textContent = onMonitor ? t('monitorSubtitle') : g ? new URL(g.url).host : '';
    $('gameControls').hidden = !g || onMonitor;
    if (g) {
      document.querySelectorAll('[data-layout]').forEach((b) => {
        const on = b.dataset.layout === g.layout;
        b.setAttribute('aria-checked', String(on));
        b.querySelector('.seg-check').replaceChildren(...(on ? [HubIcon('check')] : []));
      });
      $('zoomVal').textContent = Math.round(g.zoom * 100) + '%';
      $('aspect').value = g.aspect;
    }
    $('muteAll').replaceChildren(HubIcon(S.prefs.muted ? 'mute' : 'sound'));
    $('muteAll').setAttribute('aria-pressed', String(S.prefs.muted));
    $('fullscreen').replaceChildren(HubIcon(isFullscreen ? 'unfull' : 'full'));
  }

  function emptyMark() {
    const mark = el('div', 'empty-mark');
    mark.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 4; i++) mark.appendChild(el('span'));
    return mark;
  }

  function renderEmpty() {
    const g = game();
    const box = $('empty');
    box.replaceChildren();
    const n = g ? accountsOf(g.id).length : 0;
    box.hidden = !!(g && n);
    if (!box.hidden) {
      const b = el('button', 'btn filled state', g ? t('emptyCreateFirst') : t('emptyAddGame')); b.type = 'button';
      b.addEventListener('click', () => (g ? addAccount() : addGame()));
      box.append(
        emptyMark(),
        el('h1', null, g ? t('emptyNoAccounts', { game: g.name }) : t('emptyHero')),
        el('p', null, g ? t('emptyNoAccountsText') : t('emptyHeroText')),
        b
      );
    }
  }

  function render() {
    document.documentElement.dataset.theme = S.prefs.theme;
    document.documentElement.dataset.mode = resolvedMode();
    $('shell').classList.toggle('drawer-closed', !S.prefs.drawer);
    renderLanguage();
    renderModes();
    $('monitor').hidden = screen !== 'monitor';
    $('navMonitor').classList.toggle('active', screen === 'monitor');
    $('navMonitor').toggleAttribute('aria-current', screen === 'monitor');
    syncViews();
    renderGames(); renderAccounts(); renderThemes(); renderBar(); renderEmpty();
    layoutStage();
  }

  // ---------- dialogos ----------
  function ask({ title, fields = [], ok = t('save'), danger = false, extra, validate }) {
    const dlg = $('dialog');
    $('dialogTitle').textContent = title;
    const body = $('dialogBody');
    body.replaceChildren();
    const inputs = {};
    if (extra) body.appendChild(extra(inputs));
    for (const f of fields) {
      const lab = el('label', 'field');
      lab.appendChild(el('span', null, f.label));
      const inp = el('input'); inp.name = f.name; inp.value = f.value || ''; inp.placeholder = f.placeholder || ''; inp.maxLength = f.max || 200;
      inp.spellcheck = false;
      lab.appendChild(inp);
      inputs[f.name] = inp;
      body.appendChild(lab);
    }
    const err = el('p', 'field-error'); body.appendChild(err);
    $('dialogOk').textContent = ok;
    $('dialogOk').classList.toggle('danger', danger);
    return new Promise((resolve) => {
      const form = $('dialogForm');
      const done = (v) => { form.removeEventListener('submit', onSubmit); $('dialogCancel').onclick = null; dlg.onclose = null; if (dlg.open) dlg.close(); resolve(v); };
      const onSubmit = (e) => {
        e.preventDefault();
        const values = Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value.trim()]));
        const problem = validate && validate(values);
        if (problem) { err.textContent = problem; return; }
        done(values);
      };
      form.addEventListener('submit', onSubmit);
      $('dialogCancel').onclick = () => done(null);
      dlg.onclose = () => done(null);
      dlg.showModal();
      const first = fields[0] && inputs[fields[0].name];
      if (first) { first.focus(); first.select(); }
    });
  }

  const httpsOk = (u) => { try { const x = new URL(u); return x.protocol === 'https:'; } catch { return false; } };
  const gameProblem = (v) => (!v.name ? t('errGameName') : !httpsOk(v.url) ? t('errGameUrl') : null);

  async function addGame() {
    const v = await ask({
      title: t('addGame'), ok: t('add'),
      fields: [
        { name: 'name', label: t('gameName'), placeholder: t('gameNamePlaceholder'), max: 40 },
        { name: 'url', label: t('gameUrl'), placeholder: 'https://...' }
      ],
      extra: (inputs) => {
        const wrap = el('div', 'catalog');
        wrap.appendChild(el('span', 'catalog-label', t('suggestions')));
        const chips = el('div', 'chips');
        const have = new Set(S.games.map((g) => new URL(g.url).origin));
        for (const c of catalog) {
          const chip = el('button', 'chip state', c.name); chip.type = 'button';
          if (have.has(new URL(c.url).origin)) { chip.disabled = true; chip.title = t('alreadyAdded'); }
          chip.addEventListener('click', () => { inputs.name.value = c.name; inputs.url.value = c.url; inputs.url.focus(); });
          chips.appendChild(chip);
        }
        wrap.appendChild(chips);
        return wrap;
      },
      validate: gameProblem
    });
    if (!v) return;
    const gid = uid('g'), aid = uid('a');
    focusId = null;
    await commit((d) => {
      d.games.push({ id: gid, name: v.name, url: v.url, zoom: 1, aspect: 'livre', layout: 'grade', featured: null, split: 0.68 });
      d.accounts.push({ id: aid, gameId: gid, name: t('defaultAccountName', { n: 1 }), muted: false });
      d.prefs.activeGame = gid;
    });
  }

  async function editGame() {
    const g = game(); if (!g) return;
    let removeIt = false;
    const v = await ask({
      title: t('editGame'), ok: t('save'),
      fields: [
        { name: 'name', label: t('gameName'), value: g.name, max: 40 },
        { name: 'url', label: t('gameUrl'), value: g.url }
      ],
      extra: () => {
        const box = el('div', 'danger-zone');
        const b = el('button', 'btn outlined state', t('removeGameButton')); b.type = 'button';
        b.addEventListener('click', () => { removeIt = true; $('dialogForm').requestSubmit(); });
        box.appendChild(b);
        return box;
      },
      validate: (val) => (removeIt ? null : gameProblem(val))
    });
    if (!v) return;
    if (removeIt) {
      const sure = await ask({ title: t('removeTitle', { name: g.name }), ok: t('remove'), danger: true,
        extra: () => el('p', 'dialog-text', t('removeGameText', { count: accountsOf(g.id).length })) });
      if (!sure) return;
      const gone = accountsOf(g.id).map((a) => a.id);
      await commit((d) => {
        d.games = d.games.filter((x) => x.id !== g.id);
        d.accounts = d.accounts.filter((a) => a.gameId !== g.id);
        d.prefs.activeGame = d.games[0]?.id ?? null;
      });
      for (const id of gone) hub.clearAccount(id);
      return;
    }
    commit((d) => { const x = d.games.find((y) => y.id === g.id); x.name = v.name; x.url = v.url; });
  }

  async function addAccount() {
    const g = game(); if (!g) return;
    const n = accountsOf(g.id).length;
    if (n >= 9) return toast(t('maxAccounts'));
    const v = await ask({ title: t('newAccountIn', { game: g.name }), ok: t('create'), fields: [{ name: 'name', label: t('accountNickname'), value: t('defaultAccountName', { n: n + 1 }), max: 40 }],
      validate: (x) => (x.name ? null : t('errNickname')) });
    if (!v) return;
    await commit((d) => { d.accounts.push({ id: uid('a'), gameId: g.id, name: v.name, muted: false }); });
  }

  async function renameAccount(a) {
    const v = await ask({ title: t('renameAccount'), fields: [{ name: 'name', label: t('nickname'), value: a.name, max: 40 }], validate: (x) => (x.name ? null : t('errNicknameEmpty')) });
    if (v) commit((d) => { const x = d.accounts.find((y) => y.id === a.id); if (x) x.name = v.name; });
  }

  async function removeAccount(a) {
    const ok = await ask({ title: t('removeTitle', { name: a.name }), ok: t('remove'), danger: true,
      extra: () => el('p', 'dialog-text', t('removeAccountText')) });
    if (!ok) return;
    await commit((d) => { d.accounts = d.accounts.filter((x) => x.id !== a.id); });
    hub.clearAccount(a.id);
  }

  // ---------- acoes da barra ----------
  const setZoom = (fn) => { const g = game(); if (g) commit((d) => { const x = d.games.find((y) => y.id === g.id); x.zoom = Math.round(Math.min(2, Math.max(0.5, fn(x.zoom))) * 10) / 10; }); };
  const setLayout = (mode) => { const g = game(); if (g) { focusId = null; commit((d) => { d.games.find((y) => y.id === g.id).layout = mode; }); } };
  const toggleMute = () => commit((d) => { d.prefs.muted = !d.prefs.muted; });
  const toggleDrawer = () => commit((d) => { d.prefs.drawer = !d.prefs.drawer; });

  $('addGame').addEventListener('click', addGame);
  $('addAccount').addEventListener('click', addAccount);
  $('gameMenu').addEventListener('click', editGame);
  $('toggleDrawer').addEventListener('click', toggleDrawer);
  $('muteAll').addEventListener('click', toggleMute);
  $('fullscreen').addEventListener('click', () => hub.toggleFullscreen());
  $('zoomIn').addEventListener('click', () => setZoom((z) => z + 0.1));
  $('zoomOut').addEventListener('click', () => setZoom((z) => z - 0.1));
  $('zoomVal').addEventListener('click', () => setZoom(() => 1));
  $('aspect').addEventListener('change', (e) => { const g = game(); if (g) commit((d) => { d.games.find((y) => y.id === g.id).aspect = e.target.value; }); });
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => setLayout(b.dataset.layout)));

  hub.onFullscreen((on) => { isFullscreen = on; renderBar(); });
  hub.onHotkey((key) => {
    if ($('dialog').open) return;
    if (key === 'escape') { if (focusId) { focusId = null; layoutStage(); renderAccounts(); } return; }
    if (key === 'fullscreen') return hub.toggleFullscreen();
    if (key === 'drawer') return toggleDrawer();
    if (key === 'mute') return toggleMute();
    if (key === 'zoom-in') return setZoom((z) => z + 0.1);
    if (key === 'zoom-out') return setZoom((z) => z - 0.1);
    if (key === 'zoom-reset') return setZoom(() => 1);
    if (key === 'layout') { const g = game(); return g && setLayout(g.layout === 'grade' ? 'destaque' : 'grade'); }
    const m = /^focus-(\d)$/.exec(key);
    if (m) { const g = game(); const a = g && accountsOf(g.id)[Number(m[1]) - 1]; if (a) { toggleFocus(a.id); renderAccounts(); } }
  });
  // Esc com o foco na propria interface (fora de um jogo)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && focusId && !$('dialog').open) { focusId = null; layoutStage(); renderAccounts(); } });

  let toastT = 0;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  // ---------- hibernacao e tela Monitor ----------
  function toggleHibernate(id) {
    const acc = S.accounts.find((a) => a.id === id);
    if (!acc) return;
    const sleeping = !acc.hibernated;
    if (sleeping && focusId === id) focusId = null;
    commit((d) => { const x = d.accounts.find((a) => a.id === id); if (x) x.hibernated = sleeping; })
      .then(() => toast(sleeping ? t('hibernatedToast') : t('wokeToast', { name: acc.name })));
  }

  function setScreen(next) {
    if (next === screen) return;
    screen = next;
    if (screen === 'monitor') hub.monitorStart(); else hub.monitorStop();
    render();
  }

  monitorScreen = HubMonitor({
    root: $('monitor'), t, el, views,
    getState: () => S,
    actions: {
      reload: (id) => { try { views.get(id)?.wv?.reload(); } catch {} },
      toggleMute: (id) => commit((d) => { const a = d.accounts.find((x) => x.id === id); if (a) a.muted = !a.muted; }),
      toggleHibernate,
      clearCache: (id) => hub.clearAccountCache(id).then((ok) => ok && toast(t('cacheCleared'))),
      restart: async (id) => {
        const acc = S.accounts.find((a) => a.id === id);
        if (!acc) return;
        const ok = await ask({ title: t('restartTitle', { name: acc.name }), ok: t('restartProcess'), danger: true, extra: () => el('p', 'dialog-text', t('restartText')) });
        if (ok && await hub.restartAccount(id)) toast(t('restartDone'));
      }
    }
  });
  hub.onMonitorSample((sample) => { if (screen === 'monitor') monitorScreen.update(sample); });
  $('navMonitor').addEventListener('click', () => setScreen(screen === 'monitor' ? 'games' : 'monitor'));

  // icones fixos
  const icons = { toggleDrawer: 'menu', gameMenu: 'gear', zoomOut: 'minus', zoomIn: 'plus' };
  for (const [id, name] of Object.entries(icons)) $(id).replaceChildren(HubIcon(name));
  document.querySelector('#addGame .fab-icon').replaceWith(HubIcon('plus'));
  $('navMonitorIcon').replaceWith(HubIcon('chart'));
  document.querySelector('#addAccount .btn-icon').replaceWith(HubIcon('plus'));

  render();
})();
