# IdleHub

Várias contas de jogos idle de navegador numa janela só. Cada conta tem a própria sessão:
cookies, login e armazenamento ficam isolados.

> **Feito com IA, para estudo.** O IdleHub foi desenvolvido com auxílio de inteligência artificial
> ([Claude Code](https://claude.com/claude-code), da Anthropic) como um projeto pessoal de aprendizado:
> Electron, segurança de webviews, sessões isoladas e layout de interface. O resultado virou um
> **produto totalmente open source**, sob a [licença MIT](LICENSE): qualquer pessoa pode baixar, usar,
> estudar, modificar e redistribuir, de graça.

## Privacidade: nenhum dado pessoal sai do seu computador

O IdleHub **não coleta, não envia e não retém** nenhuma informação pessoal de quem o usa.

- **Sem servidor e sem conta.** O app não tem backend, cadastro, login próprio nem plano pago.
- **Sem telemetria.** Não há analytics, rastreamento, relatório de erros enviado pela internet nem atualização automática.
- **O app não faz requisições próprias.** As únicas conexões são as páginas dos jogos que *você* adiciona e abre.
  Links externos só abrem no seu navegador quando você clica.
- **Tudo fica no seu computador**, na pasta `%APPDATA%\idlehub`:
  - `idlehub.json`: jogos, apelidos das contas e preferências;
  - `Partitions\acc-*`: a sessão de cada conta (cookies e dados que o próprio jogo grava).
- **Você controla esses dados.** "Remover conta" apaga a sessão daquela conta. Para apagar tudo, feche o app e apague a pasta `%APPDATA%\idlehub`.
- **Os jogos são outra coisa.** Cada jogo é um site de terceiros, com a própria política de privacidade. O que você
  envia a um jogo (o login, por exemplo) vai para o servidor *dele*, como aconteceria no navegador. O IdleHub não vê,
  não copia e não repassa esses dados.

**Como isso foi verificado (versão 0.1.0, 20/11/2026):**
1. Revisão do código-fonte: não existe nenhuma chamada de rede no app (`fetch`, `net`, `XMLHttpRequest`, WebSocket, telemetria, `autoUpdater`, `crashReporter`).
2. Teste com o log de rede completo do Chromium (`--log-net-log`), que registra toda conexão do processo, inclusive as do próprio Electron:
   - com o app vazio, nenhuma conexão saiu para a internet;
   - com jogos abertos, só os domínios desses jogos foram contatados.

   Nos dois casos aparece só a consulta `wpad`, a detecção automática de proxy do Windows. Ela fica na rede local e não envia nenhum dado.

Como o código é aberto, qualquer pessoa pode repetir essa verificação.

## Baixar e abrir

Requisitos: Windows 10/11 e [Node.js](https://nodejs.org/) 24 ou mais recente.

```powershell
git clone <endereço deste repositório> idlehub   # ou "Download ZIP" na página do repositório
cd idlehub
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

## Segurança

- Cada painel de jogo roda isolado: sem Node.js, em sandbox, com `contextIsolation` ligado e sem preload.
- O processo principal só libera um painel para uma conta que existe, e só no endereço do jogo dela.
- Câmera, microfone, localização e notificações são negados aos jogos. Downloads só são aceitos para imagens geradas pela página.
- Tudo o que vem da interface é validado antes de ser salvo (`src/main/store.js`).

## Estrutura

```
src/main/main.js        processo principal: janela, IPC, atalhos
src/main/panels.js      política dos painéis: criação, sessões, popups, navegação, recuperação de queda
src/main/user-agent.js  User-Agent de Chrome comum (sem o token do Electron)
src/main/store.js       estado + validação (tudo que vem da interface passa por normalize())
src/main/catalog.js     sugestões de jogos
src/preload.js          ponte mínima (window.hub)
src/renderer/           interface: index.html, styles.css, app.js, layout.js (cálculo puro), icons.js
test/                   testes de store, layout e user-agent (node --test)
```

## Testes

```powershell
npm test
```

Em desenvolvimento, algumas variáveis ajudam nos testes. Nenhuma delas funciona no app empacotado:
- `IDLEHUB_USERDATA` usa outra pasta de dados;
- `IDLEHUB_SMOKE=arquivo.png` tira um print e fecha o app;
- `IDLEHUB_SMOKE_JS` roda um script na interface antes do print.

## Créditos e licença

- **Inspiração:** a ideia veio do [PokeGrid-source](https://github.com/soufoka/PokeGrid-source). Nenhum código dele foi copiado (detalhes em [NOTICE.md](NOTICE.md)).
- **Aviso:** o IdleHub não tem afiliação com nenhum dos jogos do catálogo, e cada jogo tem as próprias regras sobre o uso de várias contas.
- **Licença:** [MIT](LICENSE).
