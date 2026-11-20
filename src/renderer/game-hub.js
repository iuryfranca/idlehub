'use strict';
/* global HubIcon, HubI18n */
// Hub de jogos: o dialogo "Adicionar jogo".
// Uma barra de endereco no topo, como num navegador: digitar filtra o catalogo; um link vira na hora
// um card de "jogo personalizado". Abaixo, a grade do catalogo com o logo de cada jogo.
(function () {
  const t = (k, v) => HubI18n.t(k, v);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
  const originOf = (url) => { try { return new URL(url).origin; } catch { return ''; } };

  // Texto digitado -> link de jogo. Aceita "jogo.com", "jogo.com/play" e "https://...".
  // Devolve { url } valido, { insecure: true } para http:// ou null quando nao parece um link.
  function parseLink(raw) {
    const q = String(raw).trim();
    if (!q || /\s/.test(q)) return null;
    if (/^http:\/\//i.test(q)) return { insecure: true };
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(q) ? q : 'https://' + q;
    let u;
    try { u = new URL(withScheme); } catch { return null; }
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    // precisa de um dominio de verdade (com ponto e sufixo de letras) ou localhost
    if (u.hostname !== 'localhost' && !/\.[a-z]{2,}$/i.test(u.hostname)) return null;
    u.hash = '';
    return { url: u.href };
  }

  // Nome sugerido a partir do endereco: "play.meu-jogo.com.br" -> "Meu Jogo".
  function nameFromUrl(url) {
    const parts = hostOf(url).split('.').filter((p) => !/^(play|app|game|jogar|www|m)$/i.test(p));
    const main = parts.length > 2 && parts[parts.length - 2].length <= 3 ? parts[parts.length - 3] : parts[parts.length - 2] || parts[0] || '';
    return main.split(/[-_]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ').slice(0, 40);
  }

  function monogram(name) {
    const words = String(name).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] || '?') + (words[1]?.[0] || words[0]?.[1] || '')).toUpperCase();
  }

  /**
   * Abre o hub.
   * @param {{ catalog: Array<{name:string,url:string,logo:string,fit:string}>, games: Array<{id:string,name:string,url:string}>,
   *           onAdd(game: {name:string,url:string}): void, onOpen(gameId: string): void }} opts
   */
  function open({ catalog, games, onAdd, onOpen }) {
    const dlg = document.getElementById('hubDialog');
    const input = document.getElementById('hubInput');
    const grid = document.getElementById('hubGrid');
    const custom = document.getElementById('hubCustom');
    const empty = document.getElementById('hubEmpty');
    const count = document.getElementById('hubCount');
    const added = new Map(games.map((g) => [originOf(g.url), g]));
    let link = null;          // resultado de parseLink do texto atual
    let visible = [];         // jogos do catalogo na grade agora

    const finish = (fn) => { dlg.close(); fn(); };
    const pick = (c) => {
      const have = added.get(originOf(c.url));
      finish(() => (have ? onOpen(have.id) : onAdd({ name: c.name, url: c.url })));
    };

    function card(c) {
      const have = added.get(originOf(c.url));
      const b = el('button', 'hub-card state'); b.type = 'button';
      b.title = have ? t('hubOpenAdded') : t('hubAddThis', { name: c.name });
      const art = el('span', 'hub-art' + (c.fit === 'cover' ? ' cover' : ''));
      const img = el('img'); img.src = 'assets/games/' + c.logo; img.alt = ''; img.draggable = false; img.loading = 'lazy';
      art.appendChild(img);
      const meta = el('span', 'hub-meta');
      meta.append(el('span', 'hub-name', c.name), el('span', 'hub-host', hostOf(c.url)));
      b.append(art, meta);
      if (have) { b.classList.add('is-added'); const badge = el('span', 'hub-badge'); badge.append(HubIcon('check'), el('span', null, t('hubAdded'))); b.appendChild(badge); }
      b.addEventListener('click', () => pick(c));
      return b;
    }

    // Card "jogo personalizado" no fim da grade: leva o foco para a barra de endereco.
    function customTile() {
      const b = el('button', 'hub-card hub-new state'); b.type = 'button';
      const art = el('span', 'hub-art hub-new-art'); art.appendChild(HubIcon('globe'));
      const meta = el('span', 'hub-meta');
      meta.append(el('span', 'hub-name', t('hubCustomTitle')), el('span', 'hub-host', t('hubCustomText')));
      b.append(art, meta);
      b.addEventListener('click', () => { input.focus(); input.select(); dlg.querySelector('.hub-address').classList.add('nudge'); setTimeout(() => dlg.querySelector('.hub-address').classList.remove('nudge'), 700); });
      return b;
    }

    // Preview do jogo personalizado: icone provisorio, nome editavel, endereco e botao adicionar.
    function renderCustom() {
      custom.replaceChildren();
      const catalogHit = link?.url && catalog.find((c) => originOf(c.url) === originOf(link.url));
      custom.hidden = !link || !!catalogHit;
      if (custom.hidden) return;
      if (link.insecure) {
        const msg = el('p', 'hub-warn'); msg.append(HubIcon('lock'), el('span', null, t('hubCustomHttp')));
        custom.appendChild(msg);
        return;
      }
      const have = added.get(originOf(link.url));
      const name = have ? have.name : nameFromUrl(link.url);
      const tile = el('span', 'hub-favicon', monogram(name));
      const fields = el('div', 'hub-custom-fields');
      const label = el('span', 'hub-custom-kicker', t('hubCustomTitle'));
      const nameInput = el('input', 'hub-name-input'); nameInput.id = 'hubName';
      nameInput.value = name; nameInput.maxLength = 40; nameInput.spellcheck = false; nameInput.setAttribute('aria-label', t('gameName'));
      nameInput.addEventListener('input', () => { tile.textContent = monogram(nameInput.value || name); });
      nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      fields.append(label, nameInput, el('span', 'hub-host', link.url));
      const go = el('button', 'btn filled state'); go.type = 'button';
      go.append(HubIcon(have ? 'expand' : 'plus'), el('span', null, have ? t('hubOpen') : t('add')));
      go.addEventListener('click', submit);
      custom.append(tile, fields, go);
      custom.appendChild(el('p', 'hub-custom-note', have ? t('hubOpenAdded') : t('hubCustomIcon')));
      nameInput.disabled = !!have;
    }

    function renderGrid() {
      const q = fold(input.value.trim());
      const byOrigin = link?.url ? originOf(link.url) : null;
      visible = catalog.filter((c) => (byOrigin ? originOf(c.url) === byOrigin : !q || fold(c.name).includes(q) || fold(hostOf(c.url)).includes(q)));
      grid.replaceChildren(...visible.map(card));
      if (!link && !q) grid.prepend(customTile()); // primeiro card: qualquer jogo pelo link
      count.textContent = q ? t('hubResults', { count: visible.length }) : t('hubCatalogCount', { count: catalog.length });
      document.querySelector('#hubDialog .hub-section').hidden = !!link && !visible.length;
      empty.hidden = !!link || visible.length > 0;
      if (!empty.hidden) empty.textContent = t('hubNoResults', { q: input.value.trim() });
    }

    function update() { link = parseLink(input.value); renderCustom(); renderGrid(); }

    function submit() {
      if (link?.url) {
        const have = added.get(originOf(link.url));
        const hit = catalog.find((c) => originOf(c.url) === originOf(link.url));
        if (hit) return pick(hit);
        if (have) return finish(() => onOpen(have.id));
        const name = (document.getElementById('hubName')?.value || '').trim() || nameFromUrl(link.url) || hostOf(link.url);
        return finish(() => onAdd({ name: name.slice(0, 40), url: link.url }));
      }
      if (visible.length === 1) pick(visible[0]);
    }

    input.value = '';
    input.oninput = update;
    dlg.querySelector('.hub-address').onsubmit = (e) => { e.preventDefault(); submit(); };
    update();
    dlg.showModal();
    input.focus();
  }

  const api = { open, parseLink, nameFromUrl };
  if (typeof module === 'object' && module.exports) module.exports = api; // testes (node)
  else window.HubGames = api;
})();
