'use strict';
/* global HubLayout, HubIcon, hub */
(async function main() {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  const THEMES = [
    { id: 'grafite', name: 'Grafite' }, { id: 'aurora', name: 'Aurora' }, { id: 'oceano', name: 'Oceano' },
    { id: 'areia', name: 'Areia' }, { id: 'papel', name: 'Papel' }
  ];
  const HEAD = 30;   // altura da faixa de titulo de cada painel
  const GAP = 8;

  const boot = await hub.load();
  let S = boot.state;
  const catalog = boot.catalog;
  $('version').textContent = 'v' + boot.version;

  const views = new Map(); // accountId -> { el, head, frame, wv, url, ready, status }
  let focusId = null;
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
    saving = saving.then(() => hub.save(draft)).then((saved) => { S = saved; render(); }).catch(() => toast('Não foi possível salvar.'));
    return saving;
  }

  // ---------- paineis (webviews) ----------
  function setStatus(view, status) {
    view.status = status;
    view.el.dataset.status = status;
    view.dot.dataset.status = status;
    const dot = document.querySelector('.account-item[data-id="' + view.id + '"] .dot');
    if (dot) dot.dataset.status = status;
  }

  function applyAudio(view) {
    const acc = S.accounts.find((a) => a.id === view.id);
    if (!view.ready || !acc) return;
    try { view.wv.setAudioMuted(S.prefs.muted || acc.muted); } catch {}
  }
  function applyZoom(view) {
    const acc = S.accounts.find((a) => a.id === view.id);
    const g = acc && S.games.find((x) => x.id === acc.gameId);
    if (!view.ready || !g) return;
    try { view.wv.setZoomFactor(g.zoom); } catch {}
  }

  function panelButton(icon, title, onClick) {
    const b = el('button', 'pbtn'); b.type = 'button'; b.title = title;
    b.appendChild(HubIcon(icon));
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  function createView(acc, g) {
    const view = { id: acc.id, url: g.url, ready: false, status: 'loading' };
    const panel = el('section', 'panel'); panel.dataset.id = acc.id;
    const head = el('div', 'panel-head'); head.draggable = true;
    const idx = el('span', 'pidx');
    const dot = el('span', 'dot');
    const name = el('span', 'pname');
    const actions = el('div', 'pactions');
    view.btnStar = panelButton('star', 'Colocar em destaque', () => commit((d) => { const gg = d.games.find((x) => x.id === acc.gameId); gg.featured = acc.id; gg.layout = 'destaque'; }));
    view.btnMute = panelButton('sound', 'Som desta conta', () => commit((d) => { const a = d.accounts.find((x) => x.id === acc.id); if (a) a.muted = !a.muted; }));
    view.btnReload = panelButton('reload', 'Recarregar', () => { try { view.wv.reload(); } catch {} });
    view.btnFocus = panelButton('expand', 'Expandir (Esc volta)', () => toggleFocus(acc.id));
    actions.append(view.btnStar, view.btnMute, view.btnReload, view.btnFocus);
    head.append(idx, dot, name, actions);
    head.addEventListener('dblclick', () => toggleFocus(acc.id));

    const body = el('div', 'panel-body');
    const frame = el('div', 'panel-frame');
    const wv = document.createElement('webview');
    wv.setAttribute('partition', 'persist:acc-' + acc.id);
    wv.setAttribute('allowpopups', '');
    wv.setAttribute('src', g.url);
    frame.appendChild(wv);
    body.appendChild(frame);
    panel.append(head, body);

    Object.assign(view, { el: panel, head, idx, dot, name, frame, wv });
    wv.addEventListener('dom-ready', () => { view.ready = true; applyZoom(view); applyAudio(view); });
    wv.addEventListener('did-start-loading', () => setStatus(view, 'loading'));
    wv.addEventListener('did-stop-loading', () => { if (view.status === 'loading') setStatus(view, 'ok'); });
    wv.addEventListener('did-fail-load', (e) => { if (e.isMainFrame && e.errorCode !== -3) setStatus(view, 'error'); });
    wv.addEventListener('render-process-gone', () => setStatus(view, 'error'));
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
      if (v && v.url !== g.url) { destroyView(acc.id); v = null; } // link do jogo mudou: recria
      if (!v) v = createView(acc, g);
      alive.add(acc.id);
      v.name.textContent = acc.name;
      const muted = S.prefs.muted || acc.muted;
      v.btnMute.replaceChildren(HubIcon(muted ? 'mute' : 'sound'));
      v.btnMute.classList.toggle('on', acc.muted);
      v.btnMute.title = acc.muted ? 'Conta sem som (clique para ligar)' : 'Silenciar esta conta';
      applyAudio(v); applyZoom(v);
    }
    for (const id of [...views.keys()]) if (!alive.has(id)) destroyView(id);
  }

  // ---------- layout ----------
  const splitter = el('div', 'splitter'); splitter.title = 'Arraste para ajustar';
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
      const f = HubLayout.fit(r.w, r.h - HEAD, g.aspect);
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
  function hue(str) { let h = 0; for (const c of str) h = (h * 31 + c.codePointAt(0)) % 360; return h; }

  function renderGames() {
    const list = $('gameList');
    list.replaceChildren();
    for (const g of S.games) {
      const b = el('button', 'game-item'); b.type = 'button'; b.title = g.name;
      b.classList.toggle('active', g.id === S.prefs.activeGame);
      const tile = el('span', 'tile', monogram(g.name));
      tile.style.setProperty('--h', hue(g.name));
      const n = accountsOf(g.id).length;
      b.append(tile, el('span', 'label', g.name), el('span', 'count', n ? String(n) : ''));
      b.addEventListener('click', () => { if (g.id !== S.prefs.activeGame) { focusId = null; commit((d) => { d.prefs.activeGame = g.id; }); } });
      list.appendChild(b);
    }
  }

  function renderAccounts() {
    const g = game();
    $('accountsSection').hidden = !g;
    if (!g) return;
    $('accountsLabel').textContent = 'Contas · ' + g.name;
    const list = $('accountList');
    list.replaceChildren();
    for (const a of accountsOf(g.id)) {
      const li = el('li', 'account-item'); li.dataset.id = a.id;
      li.classList.toggle('focused', focusId === a.id);
      const dot = el('span', 'dot'); dot.dataset.status = views.get(a.id)?.status || 'loading';
      const name = el('button', 'account-name', a.name); name.type = 'button'; name.title = 'Expandir esta conta';
      name.addEventListener('click', () => toggleFocus(a.id));
      const acts = el('span', 'account-actions');
      acts.append(
        panelButton('edit', 'Renomear', () => renameAccount(a)),
        panelButton('trash', 'Remover conta', () => removeAccount(a))
      );
      if (a.muted) li.appendChild(Object.assign(el('span', 'muted-flag'), { title: 'Sem som' })).appendChild(HubIcon('mute'));
      li.prepend(dot, name);
      li.appendChild(acts);
      list.appendChild(li);
    }
    $('addAccount').disabled = accountsOf(g.id).length >= 9;
  }

  function renderThemes() {
    const box = $('themes');
    if (box.childElementCount) { box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.theme === S.prefs.theme))); return; }
    for (const t of THEMES) {
      const b = el('button', 'swatch'); b.type = 'button'; b.title = t.name; b.dataset.theme = t.id;
      b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(t.id === S.prefs.theme));
      b.addEventListener('click', () => commit((d) => { d.prefs.theme = t.id; }));
      box.appendChild(b);
    }
  }

  // ---------- barra ----------
  function renderBar() {
    const g = game();
    $('gameTitle').textContent = g ? g.name : 'Nenhum jogo';
    $('gameHost').textContent = g ? new URL(g.url).host : '';
    $('gameControls').hidden = !g;
    if (g) {
      document.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.layout === g.layout)));
      $('zoomVal').textContent = Math.round(g.zoom * 100) + '%';
      $('aspect').value = g.aspect;
    }
    $('muteAll').replaceChildren(HubIcon(S.prefs.muted ? 'mute' : 'sound'));
    $('muteAll').classList.toggle('on', S.prefs.muted);
    $('fullscreen').replaceChildren(HubIcon(isFullscreen ? 'unfull' : 'full'));
  }

  function renderEmpty() {
    const g = game();
    const box = $('empty');
    box.replaceChildren();
    const n = g ? accountsOf(g.id).length : 0;
    box.hidden = !!(g && n);
    if (!box.hidden) {
      const b = el('button', 'btn primary', g ? 'Criar a primeira conta' : 'Adicionar um jogo'); b.type = 'button';
      b.addEventListener('click', () => (g ? addAccount() : addGame()));
      box.append(
        el('div', 'empty-mark'),
        el('h1', null, g ? 'Nenhuma conta em ' + g.name : 'Seus jogos idle, lado a lado'),
        el('p', null, g ? 'Cada conta abre com sessão própria: cookies e login não se misturam.' : 'Adicione um jogo de navegador e abra várias contas dele na mesma janela.'),
        b
      );
    }
  }

  function render() {
    document.body.dataset.theme = S.prefs.theme;
    $('shell').classList.toggle('drawer-closed', !S.prefs.drawer);
    $('toggleDrawer').replaceChildren(HubIcon('sidebar'));
    $('gameMenu').replaceChildren(HubIcon('gear'));
    syncViews();
    renderGames(); renderAccounts(); renderThemes(); renderBar(); renderEmpty();
    layoutStage();
  }

  // ---------- dialogos ----------
  function ask({ title, fields = [], ok = 'Salvar', danger = false, extra, validate }) {
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
  const gameProblem = (v) => (!v.name ? 'Dê um nome ao jogo.' : !httpsOk(v.url) ? 'Use um link completo começando com https://' : null);

  async function addGame() {
    const v = await ask({
      title: 'Adicionar jogo', ok: 'Adicionar',
      fields: [
        { name: 'name', label: 'Nome', placeholder: 'Ex.: Meu jogo idle', max: 40 },
        { name: 'url', label: 'Link do jogo (HTTPS)', placeholder: 'https://...' }
      ],
      extra: (inputs) => {
        const wrap = el('div', 'catalog');
        wrap.appendChild(el('span', 'catalog-label', 'Sugestões'));
        const chips = el('div', 'chips');
        const have = new Set(S.games.map((g) => new URL(g.url).origin));
        for (const c of catalog) {
          const chip = el('button', 'chip', c.name); chip.type = 'button';
          if (have.has(new URL(c.url).origin)) { chip.disabled = true; chip.title = 'Já adicionado'; }
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
      d.accounts.push({ id: aid, gameId: gid, name: 'Conta 1', muted: false });
      d.prefs.activeGame = gid;
    });
  }

  async function editGame() {
    const g = game(); if (!g) return;
    let removeIt = false;
    const v = await ask({
      title: 'Editar jogo', ok: 'Salvar',
      fields: [
        { name: 'name', label: 'Nome', value: g.name, max: 40 },
        { name: 'url', label: 'Link do jogo (HTTPS)', value: g.url }
      ],
      extra: () => {
        const box = el('div', 'danger-zone');
        const b = el('button', 'btn ghost danger-text', 'Remover este jogo e suas contas'); b.type = 'button';
        b.addEventListener('click', () => { removeIt = true; $('dialogForm').requestSubmit(); });
        box.appendChild(b);
        return box;
      },
      validate: (val) => (removeIt ? null : gameProblem(val))
    });
    if (!v) return;
    if (removeIt) {
      const sure = await ask({ title: 'Remover ' + g.name + '?', ok: 'Remover', danger: true,
        extra: () => el('p', 'dialog-text', 'As ' + accountsOf(g.id).length + ' conta(s) deste jogo serão apagadas, inclusive o login salvo nelas.') });
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
    if (n >= 9) return toast('Máximo de 9 contas por jogo.');
    const v = await ask({ title: 'Nova conta em ' + g.name, ok: 'Criar', fields: [{ name: 'name', label: 'Apelido da conta', value: 'Conta ' + (n + 1), max: 40 }],
      validate: (x) => (x.name ? null : 'Dê um apelido à conta.') });
    if (!v) return;
    await commit((d) => { d.accounts.push({ id: uid('a'), gameId: g.id, name: v.name, muted: false }); });
  }

  async function renameAccount(a) {
    const v = await ask({ title: 'Renomear conta', fields: [{ name: 'name', label: 'Apelido', value: a.name, max: 40 }], validate: (x) => (x.name ? null : 'O apelido não pode ficar vazio.') });
    if (v) commit((d) => { const x = d.accounts.find((y) => y.id === a.id); if (x) x.name = v.name; });
  }

  async function removeAccount(a) {
    const ok = await ask({ title: 'Remover ' + a.name + '?', ok: 'Remover', danger: true,
      extra: () => el('p', 'dialog-text', 'A sessão desta conta (login, cookies e dados salvos pelo jogo) será apagada deste computador.') });
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

  render();
})();
