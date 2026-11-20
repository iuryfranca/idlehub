# Manual de animação: inclusão da cena "Espaço misto"

Este arquivo complementa o **IdleHub: Manual de animação do vídeo de apresentação** (Claude Doc da conta
claude-iury: https://claude.ai/artifact/4Mn6UGU8GFkvPGvKrdR5YB). Ele traz as alterações prontas para colar no Doc.
O vídeo passa a ter **11 cenas e 67 s (2010 quadros)**. A cena nova, **C6 · Espaço misto (210 f)**, entra depois
de "Troca de jogo". As cenas seguintes só mudam de número e de início; o conteúdo de cada uma continua igual.
Os cortes continuam em múltiplos de 15 quadros (a batida da trilha a 120 BPM).

## 1. "Visão geral e roteiro": trocar a frase de abertura e a tabela

Frase de abertura:

> O vídeo mostra, em 11 cenas e 67 s, a ideia do app (várias contas numa janela só) e os 6 recursos principais:
> grade, destaque, troca de jogo sem recarregar, espaço misto, monitor e hibernação, fechando com privacidade e
> código aberto.

| Cena | Quadros | Segundos | Tela (captura) | Legenda na tela |
| --- | --- | --- | --- | --- |
| C1 Abertura | 0–90 | 0,0–3,0 | — | IdleHub |
| C2 Gancho | 90–210 | 3,0–7,0 | — | Várias contas. Uma janela. |
| C3 Grade | 210–450 | 7,0–15,0 | grid-dark.png | Cada conta com sessão própria. Login e cookies não se misturam. |
| C4 Destaque | 450–660 | 15,0–22,0 | spotlight-light.png | Uma conta grande, as outras ao lado. Arraste para ajustar. |
| C5 Troca de jogo | 660–840 | 22,0–28,0 | grid-dark.png → rail-dark.png | Troque de jogo: os outros continuam rodando. |
| **C6 Espaço misto** | **840–1050** | **28,0–35,0** | **mix-editor-dark.png → mix-dark.png** | **Junte contas de jogos diferentes nas mesmas telas.** |
| C7 Monitor | 1050–1350 | 35,0–45,0 | monitor-dark.png | CPU, memória, GPU, disco e rede em tempo real. |
| C8 Hibernar | 1350–1530 | 45,0–51,0 | hibernate-dark.png | Hiberne uma conta: zero CPU, login salvo. |
| C9 Do seu jeito | 1530–1710 | 51,0–57,0 | 5 temas (themes-*.png) | 5 temas, claro ou escuro, 3 idiomas. |
| C10 Privacidade | 1710–1890 | 57,0–63,0 | — | Sem servidor. Sem telemetria. Código aberto. |
| C11 Fim | 1890–2010 | 63,0–67,0 | — | Baixe grátis · {repoUrl} |

No texto de "Como usar este manual", trocar "60 s … (1800 quadros)" por "67 s … (2010 quadros)".

## 2. "C · Cenas": inserir esta ficha depois de C5 e renumerar as seguintes (C6→C7 … C10→C11)

### C6 · Espaço misto (210 f)

- **Peças:** E2 com `mix-editor-dark.png` (editor "Novo espaço misto" com 4 contas de 3 jogos escolhidas) e
  depois `mix-dark.png` (o espaço "Farm da noite" pronto: 4 telas de 3 jogos, com o nome do jogo em cada painel),
  mais E3.
- **O que a cena conta:** o usuário escolhe contas de jogos diferentes, na ordem que quiser, dá um nome, e o
  espaço vira um item próprio na lateral com as telas lado a lado.
- **Foco 1 (editor):** as contas escolhidas, com os números 1 a 4 (x 36, y 42, w 20, h 20). Câmera `push`.
- **Foco 2 (editor):** a prévia das telas e a contagem "4 de 9 telas" (x 35, y 62, w 13, h 9).
- **Foco 3 (espaço pronto):** o item "Farm da noite" na lateral, com o ícone em mosaico (x 0, y 33, w 11, h 5).
- **Foco 4 (espaço pronto):** as faixas de título dos 4 painéis, com o nome do jogo em cada um (x 12, y 5, w 88, h 4).
- **Legenda:** rótulo "Espaço misto" · frase "Junte contas de jogos diferentes nas mesmas telas.".
- **Quadros-chave:**
  - f0–18: o editor entra (T2).
  - f30: foco 1 e começo da aproximação.
  - f36, f48, f60, f72: um cursor desenhado (seta branca de 40 px) toca as contas na ordem 1, 2, 3, 4. Cada
    toque é um anel primary que cresce de 0 a 48 px e some em 10 f. A captura não muda; o cursor só indica o
    gesto, como em C4.
  - f84: o foco desliza para o foco 2 em 12 f.
  - f90: legenda (E3).
  - f114: cross-fade de 12 f para `mix-dark.png`, mantendo a moldura; o foco vai para o foco 3.
  - f150: o foco salta para o foco 4 em 12 f.
  - f192: sai com T3.
- **Evite:** animar os números aparecendo nos chips ou montar as telas peça por peça. As capturas são estáticas,
  e o cursor e o foco é que contam a ordem.

## 3. "Composição completa" (bloco `ts` no fim de C · Cenas)

```ts
type IdleHubPromoProps = {
  format: '16:9' | '9:16';
  lang: 'pt-BR' | 'en' | 'es';
  repoUrl: string;
  screens: { grid: string; spotlight: string; rail: string; mixEditor: string; mix: string; monitor: string; hibernate: string; themes: string[] };
};
// fps 30 · durationInFrames 2010 · 1920×1080 (16:9) ou 1080×1920 (9:16)
```

## 4. "Recursos": linhas novas e cenas renumeradas

| Arquivo | O que mostra | Cenas |
| --- | --- | --- |
| grid-dark.png | 4 contas em grade, tema Aurora escuro, lateral aberta | C3, C5 |
| spotlight-light.png | modo Destaque, tema Oceano claro | C4 |
| rail-dark.png | lateral recolhida (rail) com a lista de jogos | C5 |
| mix-editor-dark.png | editor "Novo espaço misto": 4 contas de 3 jogos escolhidas, prévia das telas | C6 |
| mix-dark.png | espaço misto "Farm da noite": 4 telas de 3 jogos, item próprio na lateral | C6 |
| monitor-dark.png | tela Monitor: cartões da máquina e tabela de contas | C7 |
| hibernate-dark.png | grade com uma conta hibernada (cartão com a lua) | C8 |
| themes-grafite.png · themes-aurora.png · themes-oceano.png · themes-areia.png · themes-papel.png | a mesma grade nos 5 temas | C9 |
| hub-dark.png | hub de jogos (Adicionar jogo) com os logos do catálogo; reserva, nenhuma cena usa ainda | — |

No checklist de entrega, trocar "1800 quadros" por "2010 quadros".

As capturas são geradas por `npm run screens` e ficam em `webpage/assets/screens/`. Os três jogos das capturas
("Reino Ocioso", "Minas de Cristal", "Forja Estelar") são fictícios.
