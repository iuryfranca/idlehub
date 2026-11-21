'use strict';
// Roteiro de cada video curto do site (ate ~11 s). `d` e o diretor do runner.js.
// Seletores sao expressoes JS avaliadas na interface do app.
const P = (id) => `document.querySelector('.panel[data-id="${id}"]')`;
const BTN = (id, i) => `${P(id)}.querySelectorAll('.pbtn')[${i}]`; // 0 destaque, 1 som, 2 recarregar, 3 hibernar, 4 expandir
const $ = (id) => `document.getElementById('${id}')`;

module.exports = {
  // Hub de jogos: abre o catalogo, passa pelos logos e adiciona um jogo pelo link.
  hub: {
    // logos de terceiros no catalogo aparecem borrados no video (so na gravacao; o app nao muda)
    async setup(d) { await d.ui.insertCSS('.hub-art img{filter:blur(9px) saturate(1.1);transform:scale(1.08)}'); },
    async play(d) {
      await d.wait(500);
      await d.click($('addGame'), 800);
      await d.wait(700);
      await d.move(`document.querySelectorAll('.hub-card')[1]`, 650);
      await d.wait(250);
      await d.move(`document.querySelectorAll('.hub-card')[6]`, 600);
      await d.wait(250);
      await d.click($('hubInput'), 650, 0.3);
      await d.wait(150);
      await d.type('forja-estelar.example');
      await d.wait(500);
      await d.click(`document.querySelector('#hubCustom .btn.filled')`, 650);
      await d.wait(1500);
      await d.click(`document.querySelector('.panel:not(.parked)')`, 700, 0.5, 0.42);
      await d.wait(900);
    }
  },

  // Grade: golpe no jogo, conta nova entra na grade, expandir e voltar.
  grid: {
    accounts: ['a-1', 'a-2', 'a-3'],
    async play(d) {
      await d.wait(400);
      await d.click(P('a-1'), 700, 0.5, 0.42);
      await d.wait(220);
      await d.click(null);
      await d.wait(500);
      await d.click($('addAccount'), 800);
      await d.wait(450);
      await d.js(`document.querySelector('#dialogBody input').select()`);
      await d.type('Farm 03', 70);
      await d.wait(250);
      await d.click($('dialogOk'), 600);
      await d.wait(1500);
      await d.dblclick(`${P('a-2')}.querySelector('.pname')`, 750);
      await d.wait(1400);
      await d.click(BTN('a-2', 4), 600);
      await d.wait(900);
    }
  },

  // Destaque: troca o layout, escolhe outra conta para o destaque e ajusta a divisoria.
  spotlight: {
    async play(d) {
      await d.wait(400);
      await d.click(`document.querySelector('[data-layout="destaque"]')`, 800);
      await d.wait(1300);
      await d.move(`${P('a-3')}.querySelector('.panel-head')`, 650, 0.3);
      await d.wait(200);
      await d.click(BTN('a-3', 0), 500);
      await d.wait(1400);
      const s = await d.at(`document.querySelector('.splitter')`);
      await d.moveTo(s, 600);
      await d.wait(150);
      await d.drag(`document.querySelector('.splitter')`, { x: s.x + 170, y: s.y + 30 }, 900);
      await d.wait(700);
      await d.click(P('a-3'), 700, 0.5, 0.42);
      await d.wait(1200);
    }
  },

  // Espaco misto: monta um espaco com contas de 3 jogos e abre.
  mix: {
    async play(d) {
      await d.wait(400);
      await d.click($('newMix'), 800);
      await d.wait(500);
      await d.click($('mixName'), 550, 0.4);
      await d.js(`document.getElementById('mixName').select()`);
      await d.type('Farm da noite', 60);
      await d.wait(250);
      for (const name of ['Principal', 'Conta 1', 'Main', 'Farm 02']) {
        await d.click(`[...document.querySelectorAll('.mix-acc')].find((b) => b.textContent.trim().endsWith('${name}'))`, 480);
        await d.wait(220);
      }
      await d.wait(300);
      await d.click($('mixOk'), 650);
      await d.wait(2200);
    }
  },

  // Monitor: ja aberto ha um tempo (graficos cheios); passa pelos numeros e pelas contas.
  monitor: {
    settle: 90000,
    async setup(d) { await d.js(`document.getElementById('navMonitor').click()`); },
    async play(d) {
      await d.wait(400);
      await d.move(`document.querySelector('.mon-card, .monitor .card, #monitor section, #monitor > *')`, 800);
      await d.wait(900);
      await d.moveTo({ x: 1000, y: 330 }, 700);
      await d.wait(800);
      await d.scroll(420, 18);
      await d.wait(1400);
      await d.moveTo({ x: 900, y: 560 }, 700);
      await d.wait(1200);
      await d.moveTo({ x: 1180, y: 620 }, 700);
      await d.wait(1300);
    }
  },

  // Hibernar: duas contas dormem (sem processo) e uma acorda.
  hibernate: {
    async play(d) {
      await d.wait(400);
      await d.move(`${P('a-2')}.querySelector('.panel-head')`, 700, 0.35);
      await d.wait(200);
      await d.click(BTN('a-2', 3), 500);
      await d.wait(1400);
      await d.move(`${P('a-4')}.querySelector('.panel-head')`, 700, 0.35);
      await d.wait(200);
      await d.click(BTN('a-4', 3), 500);
      await d.wait(1500);
      await d.click(`${P('a-2')}.querySelector('.sleep-card .tonal-btn')`, 800);
      await d.wait(2600);
    }
  }
};
