'use strict';
/* global HubIcon, HubSkeleton */
// Secao "Processos do Windows" da tela Monitor.
// Comeca desligada: a lista so e coletada depois que a pessoa liga o switch.
(function () {
  const PAGE = 100; // linhas mostradas antes de "Mostrar todos"
  const COLS = [
    { key: 'name', label: 'colProcess', dir: 1 },
    { key: 'pid', label: 'colPid', dir: 1 },
    { key: 'cpu', label: 'colCpu', dir: -1 },
    { key: 'mem', label: 'colMemory', dir: -1 },
    { key: null, label: 'colActions' }
  ];

  window.HubWinProc = function createWinProcSection(ctx) {
    const { t, el, fmt, actions, sectionHeader } = ctx;
    const state = { on: false, query: '', sort: 'cpu', dir: -1, hideProtected: false, showAll: false, data: null };

    // ---------- estrutura ----------
    const header = sectionHeader('windows');
    const sw = el('button', 'switch state'); sw.type = 'button'; sw.setAttribute('role', 'switch');
    const swThumb = el('span', 'switch-thumb');
    sw.appendChild(swThumb);
    const swLabel = el('span', 'switch-label');
    const swWrap = el('label', 'switch-wrap');
    swWrap.append(swLabel, sw);
    const countChip = el('span', 'mon-chip');
    header.meta.append(countChip, swWrap);

    const offCard = el('div', 'wp-off');
    const offText = el('p');
    const offBtn = el('button', 'tonal-btn state'); offBtn.type = 'button';
    offBtn.append(HubIcon('windows'), el('span'));
    offCard.append(HubIcon('info'), offText, offBtn);

    const body = el('div', 'wp-body');
    const toolbar = el('div', 'wp-toolbar');
    const search = el('label', 'search');
    const searchInput = el('input'); searchInput.type = 'search'; searchInput.spellcheck = false;
    search.append(HubIcon('search'), searchInput);
    const filter = el('button', 'filter-chip state'); filter.type = 'button';
    const filterLabel = el('span');
    filter.append(el('span', 'filter-check'), filterLabel);
    const showing = el('span', 'wp-showing');
    toolbar.append(search, filter, showing);

    const table = el('div', 'mon-table wp-table'); table.setAttribute('role', 'table');
    const head = el('div', 'mon-row mon-row-head'); head.setAttribute('role', 'row');
    const headCells = COLS.map((c) => {
      const cell = el(c.key ? 'button' : 'span', 'mon-cell' + (c.key ? ' sort state' : ''));
      cell.setAttribute('role', 'columnheader');
      if (c.key) {
        cell.type = 'button';
        cell.addEventListener('click', () => {
          state.dir = state.sort === c.key ? -state.dir : c.dir;
          state.sort = c.key;
          render();
        });
      }
      head.appendChild(cell);
      return cell;
    });
    const tbody = el('div', 'mon-tbody');
    table.append(head, tbody);
    const empty = el('p', 'mon-empty');
    const more = el('button', 'btn text state wp-more'); more.type = 'button';
    body.append(toolbar, table, empty, more);

    const box = el('section', 'wp');
    box.append(header.box, offCard, body);

    // ---------- interacoes ----------
    const toggle = async () => {
      state.on = !state.on;
      if (!state.on) state.data = null;
      render();
      await actions.setWindowsProcesses(state.on);
    };
    sw.addEventListener('click', toggle);
    offBtn.addEventListener('click', toggle);
    searchInput.addEventListener('input', () => { state.query = searchInput.value.trim().toLowerCase(); render(); });
    filter.addEventListener('click', () => { state.hideProtected = !state.hideProtected; render(); });
    more.addEventListener('click', () => { state.showAll = !state.showAll; render(); });

    // ---------- linhas (reaproveitadas por PID para nao piscar) ----------
    const rows = new Map();
    function buildRow(proc) {
      const row = el('div', 'mon-row'); row.setAttribute('role', 'row');
      const who = el('span', 'mon-cell mon-names');
      const name = el('span', 'mon-name');
      const desc = el('span', 'mon-game');
      who.append(name, desc);
      const pid = el('span', 'mon-cell mon-num mono');
      const cpu = el('span', 'mon-cell mon-num');
      const mem = el('span', 'mon-cell mon-num');
      const act = el('span', 'mon-cell mon-acts');
      const kill = el('button', 'pbtn state danger'); kill.type = 'button';
      kill.appendChild(HubIcon('power'));
      kill.addEventListener('click', () => actions.killProcess({ ...row.proc, memText: fmt.bytes(row.proc.mem) }));
      const lock = el('span', 'wp-lock');
      lock.appendChild(HubIcon('lock'));
      act.append(kill, lock);
      [who, pid, cpu, mem, act].forEach((c) => c.setAttribute('role', 'cell'));
      row.append(who, pid, cpu, mem, act);
      return { row, name, desc, pid, cpu, mem, kill, lock };
    }

    function visibleList() {
      const list = (state.data?.list || []).filter((p) => {
        if (state.hideProtected && p.protected) return false;
        if (!state.query) return true;
        return p.name.toLowerCase().includes(state.query) || p.desc.toLowerCase().includes(state.query) || String(p.pid) === state.query;
      });
      const k = state.sort;
      list.sort((a, b) => {
        const va = a[k], vb = b[k];
        const c = typeof va === 'string' ? va.localeCompare(vb, undefined, { sensitivity: 'base' }) : va - vb;
        return c * state.dir || a.pid - b.pid;
      });
      return list;
    }

    function render() {
      sw.setAttribute('aria-checked', String(state.on));
      offCard.hidden = state.on;
      body.hidden = !state.on;
      countChip.hidden = !state.on || !state.data?.ready;
      if (!state.on) return;

      filter.setAttribute('aria-pressed', String(state.hideProtected));
      filter.querySelector('.filter-check').replaceChildren(...(state.hideProtected ? [HubIcon('check')] : []));
      COLS.forEach((c, i) => {
        if (!c.key) return;
        const active = state.sort === c.key;
        headCells[i].setAttribute('aria-sort', active ? (state.dir > 0 ? 'ascending' : 'descending') : 'none');
        headCells[i].replaceChildren(el('span', null, t(c.label)), ...(active ? [HubIcon(state.dir > 0 ? 'up' : 'down')] : []));
      });

      if (!state.data?.ready) {
        // skeleton no formato da propria tabela; o texto fica so para leitor de tela
        more.hidden = true; showing.textContent = '';
        table.hidden = false; table.setAttribute('aria-busy', 'true');
        if (!tbody.querySelector('.sk-row')) {
          for (const [pid, r] of rows) { r.row.remove(); rows.delete(pid); }
          tbody.appendChild(HubSkeleton.tableRows(8, { columns: 4, actions: 1 }));
        }
        empty.hidden = false; empty.classList.add('sr-only'); empty.textContent = t('winProcsLoading');
        return;
      }
      tbody.querySelectorAll('.sk-row').forEach((r) => r.remove());
      table.removeAttribute('aria-busy');
      empty.classList.remove('sr-only');
      const all = visibleList();
      const list = state.showAll ? all : all.slice(0, PAGE);
      countChip.textContent = t('chipProcs', { n: state.data.list.length });
      showing.textContent = t('showingN', { shown: list.length, total: all.length });
      table.hidden = !list.length;
      empty.hidden = !!list.length;
      empty.textContent = t('noMatches');
      more.hidden = all.length <= PAGE;
      more.textContent = state.showAll ? t('showLess') : t('showAll', { n: all.length });

      const keep = new Set(list.map((p) => p.pid));
      for (const [pid, r] of rows) if (!keep.has(pid)) { r.row.remove(); rows.delete(pid); }
      for (const p of list) {
        let r = rows.get(p.pid);
        if (!r) { r = buildRow(p); rows.set(p.pid, r); }
        r.row.proc = p;
        r.name.textContent = p.name;
        r.desc.textContent = p.desc || p.path || '—';
        r.row.title = p.path;
        r.pid.textContent = String(p.pid);
        r.cpu.textContent = fmt.pct(p.cpu);
        r.mem.textContent = fmt.bytes(p.mem);
        r.kill.hidden = !!p.protected;
        r.lock.hidden = !p.protected;
        r.kill.title = t('endProcess');
        r.lock.title = p.protected === 'app' ? t('protectedApp') : t('protectedSystem');
        r.row.classList.toggle('is-protected', !!p.protected);
        tbody.appendChild(r.row); // reordena sem recriar
      }
    }

    function renderTexts() {
      header.title.textContent = t('winProcs');
      swLabel.textContent = t('winProcsShow');
      offText.textContent = t('winProcsOffText');
      offBtn.querySelector('span').textContent = t('winProcsShow');
      searchInput.placeholder = t('searchProcs');
      searchInput.setAttribute('aria-label', t('searchProcs'));
      filterLabel.textContent = t('hideProtected');
      COLS.forEach((c, i) => { if (!c.key) headCells[i].textContent = t(c.label); }); // colunas sem ordenacao
      render();
    }

    renderTexts();
    return {
      box,
      renderTexts,
      update(windows) { if (state.on && windows) { state.data = windows; render(); } },
      // Ao sair da tela Monitor a coleta para; ao voltar, a secao comeca desligada de novo.
      reset() { state.on = false; state.data = null; render(); }
    };
  };
})();
