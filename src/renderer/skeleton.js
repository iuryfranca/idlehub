'use strict';
// Skeleton: o padrao de carregamento do IdleHub.
// Uma base visual unica (classe .sk em styles.css: cor, brilho animado, respeita "reduzir movimento") e
// UM FORMATO POR COMPONENTE, imitando a forma do que vai aparecer. Nada de spinner nem texto "Carregando".
// Os cartoes de metrica do Monitor nao precisam de builder: usam o estado .is-loading (so CSS).
// Todo skeleton e decorativo (aria-hidden); o container que carrega recebe aria-busy e um texto para leitor de tela.
(function () {
  const block = (cls, style) => {
    const e = document.createElement('div');
    e.className = cls;
    e.setAttribute('aria-hidden', 'true');
    if (style) Object.assign(e.style, style);
    return e;
  };
  const bar = (width, height) => block('sk sk-bar', { width, height });

  // Linha de tabela (contas e processos): a 1a coluna tem nome + subtitulo, as outras um valor curto,
  // a ultima uma fileira de botoes redondos. Larguras variam por linha para nao parecer um carimbo.
  function tableRows(count, { columns, actions = 0 }) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const row = block('mon-row sk-row');
      const first = block('mon-cell sk-stack');
      first.append(bar(`${62 - (i % 3) * 12}%`, '16px'), bar(`${34 + (i % 2) * 10}%`, '11px'));
      row.appendChild(first);
      for (let c = 1; c < columns; c++) {
        const cell = block('mon-cell');
        cell.appendChild(bar(`${48 + ((i + c) % 3) * 12}%`, '14px'));
        row.appendChild(cell);
      }
      const acts = block('mon-cell sk-acts');
      for (let a = 0; a < actions; a++) acts.appendChild(block('sk sk-dot'));
      row.appendChild(acts);
      frag.appendChild(row);
    }
    return frag;
  }

  // Card de processo interno do Monitor (nome, descricao, numeros a direita).
  function procCards(count) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const card = block('mon-proc sk-proc');
      const text = block('sk-stack');
      text.append(bar(`${50 + (i % 2) * 15}%`, '16px'), bar('80%', '11px'));
      const nums = block('sk-stack sk-end');
      nums.append(bar('72px', '14px'), bar('48px', '10px'));
      card.append(text, nums);
      frag.appendChild(card);
    }
    return frag;
  }

  // Painel de jogo: a forma generica de uma pagina de jogo idle (barra de recursos, o centro, cartoes embaixo).
  function panel() {
    const root = block('sk-panel');
    const top = block('sk-panel-top');
    top.append(bar('32%', '12px'), block('sk-panel-chips'));
    top.lastChild.append(bar('64px', '22px'), bar('48px', '22px'));
    const mid = block('sk-panel-mid');
    mid.append(block('sk sk-circle'), bar('36%', '18px'), bar('52%', '10px'));
    const bottom = block('sk-panel-bottom');
    bottom.append(block('sk sk-tile'), block('sk sk-tile'), block('sk sk-tile'));
    root.append(top, mid, bottom);
    return root;
  }

  window.HubSkeleton = { tableRows, procCards, panel };
})();
