# IdleHub

Várias contas de jogos idle de navegador numa janela só. Cada conta tem a própria sessão
(cookies, login e armazenamento isolados). Projeto pessoal de estudo, sem servidor, sem conta e sem plano pago.

## Como abrir

```powershell
npm install            # baixa o Electron (uma vez)
npm start              # ou dois cliques em "Abrir IdleHub.bat"
```

## O que já faz

| Recurso | Como usar |
|---|---|
| Jogos e grupos | Lateral → **Adicionar jogo** (sugestões prontas ou qualquer link HTTPS) |
| Contas com sessão isolada | **Nova conta**; até 9 por jogo; remover apaga a sessão daquela conta |
| Layout **Grade** | Todas as contas do mesmo tamanho; colunas escolhidas automaticamente |
| Layout **Destaque** | Uma conta grande e as outras empilhadas; arraste a divisória; ★ escolhe a principal |
| Reorganizar | Arraste a faixa de título de um painel sobre outro |
| Foco | ⤢ no painel, duplo clique na faixa, ou Ctrl+1…9; Esc volta |
| Zoom por jogo | − / 100% / + na barra (Ctrl + / Ctrl − / Ctrl 0) |
| Proporção | Livre, 16:9, 4:3, 3:2, 9:16 (com faixas laterais) |
| Som | Mudo geral (Ctrl+M) e por conta |
| Tela cheia | F11 |
| Lateral recolhível | Ctrl+B |
| Temas | Grafite, Aurora, Oceano, Areia, Papel (salvos localmente) |
| Jogos continuam rodando | Trocar de jogo só esconde os painéis; nada é recarregado |

Os dados ficam em `%APPDATA%\idlehub\idlehub.json`. As sessões das contas ficam em `Partitions\acc-*` na mesma pasta.

## Estrutura

```
src/main/main.js      processo principal: janela, IPC, atalhos
src/main/panels.js    política dos painéis: criação, sessões, popups, navegação, recuperação de queda
src/main/user-agent.js  UA de Chrome comum (sem o token do Electron)
src/main/store.js     estado + validação (tudo que vem da interface passa por normalize())
src/main/catalog.js   sugestões de jogos
src/preload.js        ponte mínima (window.hub)
src/renderer/         interface: index.html, styles.css, app.js, layout.js (cálculo puro), icons.js
test/                 testes de store e layout (node --test)
```

## Testes

```powershell
npm test
```

Em desenvolvimento, `IDLEHUB_USERDATA` usa outra pasta de dados, e `IDLEHUB_SMOKE=arquivo.png` tira um print e fecha
(`IDLEHUB_SMOKE_JS` roda um script na interface antes do print). Nada disso funciona no app empacotado.
