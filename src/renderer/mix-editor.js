'use strict';
/* global HubIcon, HubI18n, HubLayout */
// Editor de espaco misto: nome + contas de jogos diferentes.
// A ordem dos cliques e a ordem das telas (o numero no selo de cada conta e a posicao na grade).
// Uma previa ao vivo mostra como as telas vao ficar.
(function () {
  const t = (k, v) => HubI18n.t(k, v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const MAX = 9;

  function monogram(name) {
    const words = String(name).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] || '?') + (words[1]?.[0] || words[0]?.[1] || '')).toUpperCase();
  }
  function gameTile(g, cls = 'tile') {
    const tile = el('span', cls + (g.icon ? ' has-icon' : ''), g.icon ? null : monogram(g.name));
    if (g.icon) { const img = el('img'); img.src = g.icon; img.alt = ''; img.draggable = false; tile.appendChild(img); }
    return tile;
  }

  /**
   * @param {{ state: object, mix: object|null, onSave(v: {name: string, accounts: string[]}): void, onDelete(): void }} opts
   */
  function open({ state, mix, onSave, onDelete }) {
    const dlg = document.getElementById('mixDialog');
    const nameInput = document.getElementById('mixName');
    const body = document.getElementById('mixBody');
    const err = document.getElementById('mixError');
    const preview = document.getElementById('mixPreview');
    const count = document.getElementById('mixCount');
    const okBtn = document.getElementById('mixOk');
    const delBtn = document.getElementById('mixDelete');
    const gameOf = new Map(state.accounts.map((a) => [a.id, state.games.find((g) => g.id === a.gameId)]));

    document.getElementById('mixTitle').textContent = mix ? t('editMix') : t('newMix');
    okBtn.textContent = mix ? t('save') : t('mixCreate');
    delBtn.hidden = !mix;
    nameInput.value = mix ? mix.name : t('mixDefaultName', { n: state.mixes.length + 1 });
    err.textContent = '';
    let picked = mix ? [...mix.accounts] : [];
    const buttons = new Map(); // accountId -> botao

    // Lista agrupada por jogo, cada conta um botao de alternar.
    body.replaceChildren();
    if (!state.accounts.length) body.appendChild(el('p', 'hub-empty', t('mixNoGames')));
    for (const g of state.games) {
      const accs = state.accounts.filter((a) => a.gameId === g.id);
      if (!accs.length) continue;
      const group = el('section', 'mix-group');
      const head = el('div', 'mix-group-head');
      head.append(gameTile(g), el('span', 'mix-group-name', g.name), el('span', 'mix-group-host', new URL(g.url).host));
      const list = el('div', 'mix-accs');
      for (const a of accs) {
        const b = el('button', 'mix-acc state'); b.type = 'button';
        const badge = el('span', 'mix-order');
        const label = el('span', 'mix-acc-name', a.name);
        b.append(badge, label);
        if (a.hibernated) { const z = el('span', 'mix-acc-flag'); z.title = t('hibernated'); z.appendChild(HubIcon('moon')); b.appendChild(z); }
        b.addEventListener('click', () => {
          const i = picked.indexOf(a.id);
          if (i >= 0) picked.splice(i, 1); else if (picked.length < MAX) picked.push(a.id);
          err.textContent = '';
          update();
        });
        buttons.set(a.id, { b, badge });
        list.appendChild(b);
      }
      group.append(head, list);
      body.appendChild(group);
    }

    // Previa: as telas na grade, numeradas, com o icone do jogo de cada uma.
    function renderPreview() {
      const W = 176, H = 99, gap = 4;
      const out = HubLayout.compute({ ids: picked, mode: mix?.layout || 'grade', featuredId: mix?.featured, split: mix?.split ?? 0.68, width: W, height: H, gap });
      preview.replaceChildren();
      if (!picked.length) { preview.appendChild(el('span', 'mix-preview-empty', t('mixPreviewEmpty'))); return; }
      picked.forEach((id, i) => {
        const r = out.rects[id]; if (!r) return;
        const cell = el('span', 'mix-cell');
        Object.assign(cell.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
        const g = gameOf.get(id);
        if (g) cell.appendChild(gameTile(g, 'mix-cell-icon'));
        cell.appendChild(el('span', 'mix-cell-n', String(i + 1)));
        preview.appendChild(cell);
      });
    }

    function update() {
      for (const [id, { b, badge }] of buttons) {
        const i = picked.indexOf(id);
        b.setAttribute('aria-pressed', String(i >= 0));
        badge.replaceChildren(i >= 0 ? document.createTextNode(String(i + 1)) : HubIcon('plus'));
        b.disabled = i < 0 && picked.length >= MAX;
      }
      count.textContent = t('mixSelected', { count: picked.length, max: MAX });
      renderPreview();
    }

    const form = document.getElementById('mixForm');
    const close = () => { form.onsubmit = null; delBtn.onclick = null; if (dlg.open) dlg.close(); };
    form.onsubmit = (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) { err.textContent = t('errMixName'); nameInput.focus(); return; }
      if (!picked.length) { err.textContent = t('errMixEmpty'); return; }
      close();
      onSave({ name: name.slice(0, 40), accounts: picked });
    };
    delBtn.onclick = () => { close(); onDelete(); };
    document.getElementById('mixCancel').onclick = close;
    document.getElementById('mixClose').onclick = close;

    update();
    dlg.showModal();
    nameInput.focus(); nameInput.select();
  }

  window.HubMixEditor = { open };
})();
