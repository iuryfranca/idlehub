'use strict';
/* global HubIcon, HubWinProc, HubSkeleton */
// Tela Monitor: graficos e numeros em tempo real da maquina, das contas e dos processos internos do IdleHub.
// O historico fica so na memoria desta tela (5 minutos) e some ao fechar o app.
(function () {
  const HISTORY = 300;        // 5 min a 1 amostra/s
  const ROW_HISTORY = 60;     // 1 min nos graficos pequenos das contas
  const SVG = 'http://www.w3.org/2000/svg';

  class Ring {
    constructor(size) { this.size = size; this.values = []; }
    push(v) { this.values.push(v); if (this.values.length > this.size) this.values.shift(); }
    last() { return this.values[this.values.length - 1]; }
  }

  // ---------- grafico de area (SVG) ----------
  function chart(cls) {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('viewBox', '0 0 300 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('chart', cls || '');
    for (const y of [25, 50, 75]) {
      const g = document.createElementNS(SVG, 'line');
      Object.entries({ x1: 0, x2: 300, y1: y, y2: y }).forEach(([k, v]) => g.setAttribute(k, v));
      g.classList.add('chart-grid');
      svg.appendChild(g);
    }
    const area = document.createElementNS(SVG, 'path'); area.classList.add('chart-area');
    const line = document.createElementNS(SVG, 'path'); line.classList.add('chart-line');
    const line2 = document.createElementNS(SVG, 'path'); line2.classList.add('chart-line2');
    svg.append(area, line, line2);
    return { svg, area, line, line2 };
  }
  function pathOf(values, max, size) {
    if (!values.length) return '';
    const step = 300 / (size - 1);
    const x0 = 300 - (values.length - 1) * step;
    return values.map((v, i) => `${i ? 'L' : 'M'}${(x0 + i * step).toFixed(1)},${(100 - Math.min(100, (100 * (v ?? 0)) / max)).toFixed(1)}`).join('');
  }
  function drawChart(c, main, second, max, limit = HISTORY) {
    const top = max || 1;
    // Janela que cresce: comeca em 1 minuto e vai ate o limite (5 min), para o grafico ja ficar legivel ao abrir a tela.
    const size = Math.min(limit, Math.max(60, main.length));
    const d = pathOf(main, top, size);
    c.line.setAttribute('d', d);
    c.area.setAttribute('d', d ? `${d}L300,100L${(300 - (main.length - 1) * (300 / (size - 1))).toFixed(1)},100Z` : '');
    c.line2.setAttribute('d', second ? pathOf(second, top, size) : '');
  }

  window.HubMonitor = function createMonitorScreen(ctx) {
    const { root, t, el, actions } = ctx;
    const hist = {
      cpu: new Ring(HISTORY), appCpu: new Ring(HISTORY), mem: new Ring(HISTORY), appMem: new Ring(HISTORY),
      gpu: new Ring(HISTORY), appGpu: new Ring(HISTORY), disk: new Ring(HISTORY), rx: new Ring(HISTORY), tx: new Ring(HISTORY)
    };
    const rowHist = new Map(); // accountId -> Ring
    let last = null;

    // ---------- formatacao ----------
    const nf = (digits) => new Intl.NumberFormat(document.documentElement.lang, { maximumFractionDigits: digits, minimumFractionDigits: digits });
    const pct = (v) => (v == null ? '—' : nf(v < 10 ? 1 : 0).format(v) + '%');
    const bytes = (b) => {
      if (b == null) return '—';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let i = 0, v = b;
      while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
      return nf(v < 10 && i ? 1 : 0).format(v) + ' ' + units[i];
    };
    const duration = (ms) => {
      const s = Math.max(0, Math.floor(ms / 1000));
      if (s < 60) return s + ' s';
      const m = Math.floor(s / 60);
      if (m < 60) return m + ' min';
      return Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min';
    };

    // ---------- estrutura ----------
    root.replaceChildren();
    // Cabecalho de secao (nivel abaixo do titulo da pagina na barra superior):
    // icone + titulo na cor primaria + divisoria + detalhes em chips a direita.
    function sectionHeader(icon) {
      const box = el('div', 'mon-section');
      const title = el('h2', 'mon-title');
      const meta = el('div', 'mon-meta');
      const ico = HubIcon(icon); ico.classList.add('mon-section-icon');
      box.append(ico, title, el('span', 'mon-rule'), meta);
      return { box, title, meta };
    }
    const chip = (text) => el('span', 'mon-chip', text);
    const hMachine = sectionHeader('chip');

    const cards = el('div', 'mon-cards');
    const CARD_DEFS = [
      { id: 'cpu', icon: 'chip' }, { id: 'mem', icon: 'memory' }, { id: 'gpu', icon: 'gpu' },
      { id: 'disk', icon: 'disk' }, { id: 'net', icon: 'net' }
    ];
    const card = {};
    for (const def of CARD_DEFS) {
      const box = el('article', 'mon-card');
      const top = el('div', 'mon-card-top');
      const label = el('span', 'mon-card-label');
      top.append(HubIcon(def.icon), label);
      const value = el('div', 'mon-card-value', '—');
      const desc = el('p', 'mon-card-desc');
      const c = chart(def.id);
      const legend = el('div', 'mon-legend');
      box.append(top, value, desc, c.svg, legend);
      cards.appendChild(box);
      card[def.id] = { box, label, value, desc, chart: c, legend };
    }

    const hAccounts = sectionHeader('panels');
    const table = el('div', 'mon-table');
    table.setAttribute('role', 'table');
    const thead = el('div', 'mon-row mon-row-head');
    thead.setAttribute('role', 'row');
    const cols = ['colAccount', 'colCpu', 'colMemory', 'colUptime', 'colActions'].map((k) => { const c = el('span', 'mon-cell'); c.dataset.key = k; c.setAttribute('role', 'columnheader'); return c; });
    thead.append(...cols);
    const tbody = el('div', 'mon-tbody');
    table.append(thead, tbody);
    const accEmpty = el('p', 'mon-empty');

    const hInternals = sectionHeader('layers');
    const winproc = HubWinProc({ t, el, fmt: { pct, bytes }, actions, sectionHeader });
    const internals = el('div', 'mon-internals');
    internals.setAttribute('aria-busy', 'true');
    internals.appendChild(HubSkeleton.procCards(4));
    const foot = el('footer', 'mon-foot');
    const live = el('p');
    const cost = el('p');
    const footText = el('div');
    footText.append(live, cost);
    foot.append(HubIcon('info'), footText);

    root.append(hMachine.box, cards, hAccounts.box, table, accEmpty, hInternals.box, internals, winproc.box, foot);

    // ---------- linhas das contas (criadas uma vez, atualizadas no lugar) ----------
    const rows = new Map();
    function iconButton(icon, onClick) {
      const b = el('button', 'pbtn state'); b.type = 'button';
      b.appendChild(HubIcon(icon));
      b.addEventListener('click', onClick);
      return b;
    }
    function buildRow(acc) {
      const row = el('div', 'mon-row'); row.setAttribute('role', 'row');
      const who = el('span', 'mon-cell mon-who');
      const dot = el('span', 'status');
      const names = el('span', 'mon-names');
      const name = el('span', 'mon-name');
      const game = el('span', 'mon-game');
      names.append(name, game);
      who.append(dot, names);
      const cpuCell = el('span', 'mon-cell mon-num');
      const cpuVal = el('span');
      const spark = chart('spark');
      cpuCell.append(cpuVal, spark.svg);
      const memCell = el('span', 'mon-cell mon-num');
      const upCell = el('span', 'mon-cell mon-num');
      const acts = el('span', 'mon-cell mon-acts');
      const r = {
        row, dot, name, game, cpuVal, spark, memCell, upCell,
        reload: iconButton('reload', () => actions.reload(acc.id)),
        mute: iconButton('sound', () => actions.toggleMute(acc.id)),
        sleep: iconButton('moon', () => actions.toggleHibernate(acc.id)),
        cache: iconButton('broom', () => actions.clearCache(acc.id)),
        kill: iconButton('power', () => actions.restart(acc.id))
      };
      r.kill.classList.add('danger');
      acts.append(r.reload, r.mute, r.sleep, r.cache, r.kill);
      [who, cpuCell, memCell, upCell, acts].forEach((c) => c.setAttribute('role', 'cell'));
      row.append(who, cpuCell, memCell, upCell, acts);
      return r;
    }

    function syncRows(state) {
      tbody.querySelectorAll('.sk-row').forEach((r) => r.remove());
      table.removeAttribute('aria-busy');
      const ids = state.accounts.map((a) => a.id);
      for (const [id, r] of rows) if (!ids.includes(id)) { r.row.remove(); rows.delete(id); rowHist.delete(id); }
      for (const acc of state.accounts) {
        if (!rows.has(acc.id)) rows.set(acc.id, buildRow(acc));
        tbody.appendChild(rows.get(acc.id).row); // reordena sem recriar
      }
      accEmpty.hidden = state.accounts.length > 0;
      table.hidden = !state.accounts.length;
    }

    // Cartao de metrica carregando: o proprio cartao vira skeleton (numero, descricao e grafico).
    function setCardLoading(c, on) {
      c.box.classList.toggle('is-loading', on);
      c.box.setAttribute('aria-busy', String(on));
      if (on) { c.value.textContent = t('loading'); c.desc.textContent = '\u00a0'; }
    }

    // ---------- textos (idioma) ----------
    function renderTexts() {
      hMachine.title.textContent = t('machine');
      live.textContent = t('liveNote');
      card.cpu.label.textContent = t('cpu');
      card.mem.label.textContent = t('memory');
      card.gpu.label.textContent = t('gpu');
      card.disk.label.textContent = t('disk');
      card.net.label.textContent = t('network');
      hAccounts.title.textContent = t('appAccounts');
      cols.forEach((c) => { c.textContent = t(c.dataset.key); });
      accEmpty.textContent = t('noAccountsMonitor');
      hInternals.title.textContent = t('internals');
      hInternals.meta.replaceChildren(el('span', 'mon-meta-text', t('internalsText')));
      winproc.renderTexts();
      for (const [key, c] of Object.entries(card)) {
        const two = key !== 'disk';
        c.legend.replaceChildren(
          Object.assign(el('span', 'lg lg-main', key === 'net' ? t('legendDown') : t('legendMachine'))),
          ...(two ? [el('span', 'lg lg-second', key === 'net' ? t('legendUp') : 'IdleHub')] : [])
        );
      }
      for (const [, r] of rows) {
        r.reload.title = t('reload'); r.cache.title = t('clearCache'); r.kill.title = t('restartProcess');
      }
    }

    // ---------- atualizacao por amostra ----------
    function update(sample, record = true) {
      last = sample;
      const state = ctx.getState();
      const s = sample.system, a = sample.app;
      if (record) {
        hist.cpu.push(s.cpu); hist.appCpu.push(a.cpu);
        hist.mem.push((100 * s.memUsed) / s.memTotal); hist.appMem.push((100 * a.mem) / s.memTotal);
        hist.gpu.push(s.gpu); hist.appGpu.push(a.gpu);
        hist.disk.push(s.diskActive);
        hist.rx.push(s.netRx); hist.tx.push(s.netTx);
      }

      hMachine.meta.replaceChildren(chip(s.cpuModel), chip(t('threads', { n: s.cores })), chip(t('ramTotal', { ram: bytes(s.memTotal) })));

      setCardLoading(card.cpu, false);
      setCardLoading(card.mem, false);
      card.cpu.value.textContent = pct(s.cpu);
      card.cpu.desc.textContent = t('cpuDesc', { app: pct(a.cpu) });
      drawChart(card.cpu.chart, hist.cpu.values, hist.appCpu.values, 100);

      card.mem.value.textContent = pct((100 * s.memUsed) / s.memTotal);
      card.mem.desc.textContent = t('memDesc', { used: bytes(s.memUsed), total: bytes(s.memTotal), app: bytes(a.mem) });
      drawChart(card.mem.chart, hist.mem.values, hist.appMem.values, 100);

      // GPU, disco e rede: skeleton enquanto o coletor do Windows nao entrega a 1a leitura;
      // "Indisponivel" so quando o Windows nao fornece o contador.
      const counterCard = (c, v, valueText, descText) => {
        const loading = v == null && s.countersAvailable;
        setCardLoading(c, loading);
        if (loading) return;
        c.value.textContent = v == null ? t('unavailable') : valueText();
        c.desc.textContent = v == null ? t('unavailableDesc') : descText();
      };
      counterCard(card.gpu, s.gpu, () => pct(s.gpu), () => t('gpuDesc', { app: pct(a.gpu) }));
      drawChart(card.gpu.chart, hist.gpu.values, hist.appGpu.values, 100);

      counterCard(card.disk, s.diskActive, () => pct(s.diskActive), () => t('diskDesc', { rate: bytes(s.diskBps) }));
      drawChart(card.disk.chart, hist.disk.values, null, 100);

      const netMax = Math.max(64 * 1024, ...hist.rx.values.map((v) => v || 0), ...hist.tx.values.map((v) => v || 0)) * 1.15;
      counterCard(card.net, s.netRx, () => bytes(s.netRx + s.netTx) + '/s', () => t('netDesc', { rx: bytes(s.netRx), tx: bytes(s.netTx) }));
      drawChart(card.net.chart, hist.rx.values, hist.tx.values, netMax);

      // contas: soma dos processos de cada conta (painel + janela de login, se aberta)
      syncRows(state);
      const perAccount = new Map();
      for (const p of sample.processes) {
        if (!p.accountId) continue;
        const acc = perAccount.get(p.accountId) || { cpu: 0, mem: 0 };
        acc.cpu += p.cpu; acc.mem += p.mem;
        perAccount.set(p.accountId, acc);
      }
      let awake = 0;
      for (const acc of state.accounts) {
        const r = rows.get(acc.id);
        const g = state.games.find((x) => x.id === acc.gameId);
        const view = ctx.views.get(acc.id);
        const use = perAccount.get(acc.id);
        if (!acc.hibernated) awake++;
        r.name.textContent = acc.name;
        r.game.textContent = g ? g.name : '';
        r.dot.dataset.status = acc.hibernated ? 'sleep' : view?.status || 'loading';
        if (!rowHist.has(acc.id)) rowHist.set(acc.id, new Ring(ROW_HISTORY));
        const h = rowHist.get(acc.id);
        if (record) h.push(acc.hibernated ? 0 : use?.cpu ?? 0);
        r.cpuVal.textContent = acc.hibernated ? '—' : pct(use?.cpu ?? 0);
        drawChart(r.spark, h.values, null, Math.max(5, ...h.values) * 1.2, ROW_HISTORY);
        r.memCell.textContent = acc.hibernated ? t('hibernated') : bytes(use?.mem ?? 0);
        r.upCell.textContent = acc.hibernated || !view?.startedAt ? '—' : duration(Date.now() - view.startedAt);
        r.row.classList.toggle('asleep', acc.hibernated);
        r.reload.hidden = r.mute.hidden = r.cache.hidden = r.kill.hidden = acc.hibernated;
        r.sleep.replaceChildren(HubIcon(acc.hibernated ? 'sun' : 'moon'));
        r.sleep.title = acc.hibernated ? t('wake') : t('hibernate');
        r.mute.replaceChildren(HubIcon(acc.muted || state.prefs.muted ? 'mute' : 'sound'));
        r.mute.setAttribute('aria-pressed', String(acc.muted));
        r.mute.title = acc.muted ? t('accountMuted') : t('muteAccount');
      }
      hAccounts.meta.replaceChildren(chip(t('chipTotal', { n: state.accounts.length })), chip(t('chipAwake', { n: awake })), chip(t('chipAsleep', { n: state.accounts.length - awake })));

      // processos internos (tudo que nao e conta)
      const groups = new Map();
      for (const p of sample.processes) {
        if (p.accountId) continue;
        const gq = groups.get(p.kind) || { kind: p.kind, cpu: 0, mem: 0, count: 0, pids: [] };
        gq.cpu += p.cpu; gq.mem += p.mem; gq.count++; gq.pids.push(p.pid);
        groups.set(p.kind, gq);
      }
      const ORDER = ['main', 'ui', 'gpu', 'network', 'audio', 'other'];
      internals.removeAttribute('aria-busy');
      internals.replaceChildren(...[...groups.values()].sort((x, y) => ORDER.indexOf(x.kind) - ORDER.indexOf(y.kind)).map((gq) => {
        const item = el('div', 'mon-proc');
        const txt = el('div', 'mon-proc-text');
        const key = 'proc' + gq.kind[0].toUpperCase() + gq.kind.slice(1);
        txt.append(el('span', 'mon-name', t(key) + (gq.count > 1 ? ` (${gq.count})` : '')), el('span', 'mon-game', t(key + 'Desc')));
        item.append(txt, el('span', 'mon-num', pct(gq.cpu)), el('span', 'mon-num', bytes(gq.mem)), el('span', 'mon-pid', 'PID ' + gq.pids.join(', ')));
        return item;
      }));

      if (record) winproc.update(sample.windows);
      cost.textContent = t('monitorCost', { ms: nf(2).format(sample.costMs) });
    }

    renderTexts();
    // Antes da 1a amostra: todos os cartoes e a tabela de contas em skeleton.
    Object.values(card).forEach((c) => setCardLoading(c, true));
    table.setAttribute('aria-busy', 'true');
    accEmpty.hidden = true; // "nenhuma conta" so depois de saber, nunca durante o carregamento
    tbody.appendChild(HubSkeleton.tableRows(Math.max(2, Math.min(5, ctx.getState().accounts.length)), { columns: 4, actions: 5 }));
    return {
      update,
      reset: () => winproc.reset(),
      renderTexts() { renderTexts(); if (last) update(last, false); }
    };
  };
})();
