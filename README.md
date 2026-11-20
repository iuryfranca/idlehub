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
- **Nada é baixado da internet pelo app**: a fonte (Roboto Flex) e as cores vêm dentro dele, sem Google Fonts ou CDN.
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
| Visual Material 3 | Interface inspirada no [Material Design 3](https://m3.material.io/): navigation drawer que vira navigation rail, FAB, segmented buttons, chips, diálogos e snackbar; fonte Roboto Flex empacotada no app |
| Temas | Grafite, Aurora, Oceano, Areia, Papel: cada um é uma cor base, e o algoritmo oficial do M3 gera a paleta completa |
| Aparência | Seguir o sistema, Claro ou Escuro. Vale também para os jogos que têm modo claro/escuro |
| Idioma | Seletor na lateral: Português (Brasil), English, Español. Na primeira abertura, segue o idioma do Windows. Os jogos recebem o mesmo idioma (cabeçalho `Accept-Language`) e o usam ao recarregar, se tiverem tradução |
| Jogos continuam rodando | Trocar de jogo só esconde os painéis; nada é recarregado |
| **Monitor** | Tela dedicada (lateral → Monitor) com o uso da máquina e de cada conta em tempo real; ver abaixo |
| **Hibernar conta** | 🌙 no painel ou no Monitor: fecha o processo da conta e libera CPU e memória, sem perder o login. ☀ acorda |

## Monitor de recursos

Abra pela lateral (**Monitor**). Atualiza a cada segundo, com gráficos dos últimos minutos.

- **Máquina:** processador, memória, placa de vídeo (uso 3D), disco e rede. Cada cartão mostra o valor, uma
  descrição e quanto disso é do IdleHub. Os cartões ocupam a largura toda e viram grade em telas menores.
- **Contas do IdleHub:** CPU, memória e há quanto tempo cada conta está ligada, com ações:
  recarregar, silenciar, hibernar/acordar, limpar cache (mantém o login) e **encerrar processo** (com confirmação;
  use quando a conta travar: o painel recarrega sozinho e as outras contas não são afetadas).
- **Por dentro do IdleHub:** os processos que o próprio app usa (principal, interface, GPU, rede), explicados.
- **Processos do Windows** (desligado por padrão; ligue no switch da seção): todos os programas em execução, com
  descrição, PID, CPU e memória. Dá para buscar (nome, descrição ou PID), ordenar por qualquer coluna e ocultar os
  protegidos. **Encerrar** pede confirmação com nome, PID e memória e avisa que trabalho não salvo é perdido.
  - **Protegidos (cadeado, sem botão):** processos essenciais do Windows (`csrss`, `lsass`, `winlogon`, `svchost`,
    `dwm`, `explorer`, antivírus…), os do próprio IdleHub e o coletor do Monitor.
  - **Conferência na hora:** ao confirmar, o processo principal verifica de novo se aquele PID ainda é o mesmo programa
    (o Windows reaproveita PIDs) e se ele não é protegido; se algo mudou, nada é encerrado.
  - O app não pede permissão de administrador: processos de outros usuários ou do sistema o Windows simplesmente recusa.
  - Ao sair da tela Monitor, a lista para de ser coletada e volta desligada.

Como os números são obtidos:
- CPU e memória vêm do próprio Electron (`app.getAppMetrics()`) e do Node (`os`). Cada leitura custa cerca de 1 ms.
- GPU, disco, rede e a lista de processos vêm dos contadores de desempenho do Windows (API PDH), lidos por um pequeno processo PowerShell
  (`src/main/perf-sampler.ps1`). Ele usa os nomes em inglês dos contadores, que funcionam em qualquer idioma do Windows.
  Ele só roda com a tela Monitor aberta e fecha sozinho se o IdleHub fechar.
- A GPU aparece por app, não por conta: o Chromium desenha todos os painéis num único processo de GPU.
- O histórico dos gráficos fica só na memória. Nada é gravado em disco nem enviado (verificado com o log de rede,
  com o Monitor aberto).

## Diferenças em relação ao PokeGrid

O IdleHub foi **inspirado** no [PokeGrid](https://github.com/soufoka/PokeGrid-source), mas é outro projeto: foi escrito do
zero, com outro objetivo e outra interface. Nenhum código do PokeGrid foi copiado.

| | PokeGrid | IdleHub |
|---|---|---|
| **Objetivo** | Ferramenta completa para **um jogo**: o Poke Idle World | Organizador **genérico** de jogos idle de navegador |
| **Jogos** | Só o Poke Idle World | Qualquer jogo com link HTTPS, com várias sugestões prontas |
| **Contas** | De 1 a 4, em partições fixas (`conta1` a `conta4`) | Até 9 **por jogo**, quantos jogos você quiser, cada conta com partição própria |
| **Layout** | Quadrantes fixos (2×2) | Grade automática ou Destaque (uma grande e as outras ao lado), divisória arrastável, reordenar arrastando |
| **Troca entre jogos** | Não se aplica (um jogo só) | Painéis de outros jogos continuam rodando escondidos, sem recarregar |
| **Login** | Salva usuário e senha (cifrados no PC) e entra sozinho, inclusive quando a sessão cai | **Não guarda senhas** nem faz login automático: você entra uma vez em cada conta, e a sessão (cookies) fica salva |
| **Mexe no jogo?** | Sim: injeta scripts nos painéis (Modo Eco, esconder chat/menus, Modo Simples, venda protegida no Mercado, userscripts) | **Não**: o jogo roda exatamente como no navegador; o app só organiza as janelas |
| **Ferramentas do jogo** | Calculadora de IV, tier list, "onde caçar", incubadoras, histórico de shiny/capturas | Nenhuma por enquanto (o foco é a base genérica) |
| **Avisos** | Notificações do Windows e webhook do Discord (shiny, conta caiu, sem pokébola) | Nenhum: o app não envia nada para lugar nenhum |
| **Sistema** | Bandeja, iniciar com o Windows, manter o PC acordado, log de erros, backup | Monitor de recursos em tempo real (máquina, contas e processos internos) e hibernação de contas |
| **Interface** | Uma página única (≈5.800 linhas de HTML), visual próprio | Inspirada no Material Design 3: tokens de cor/tipografia/forma, paletas geradas pelo algoritmo do M3, claro e escuro, em módulos |
| **Idiomas** | Português, inglês e espanhol | Português, inglês e espanhol (dicionário com teste que garante as mesmas chaves nos três) |
| **Rede** | Só o jogo e, se você configurar, o webhook do Discord | Só os jogos que você abre (verificado com log de rede, ver Privacidade) |
| **Testes** | Testes de regressão por versão | Testes unitários de estado, layout, idioma e User-Agent, mais testes de interface automatizados |

Em resumo: o PokeGrid é um "canivete suíço" para o Poke Idle World. O IdleHub é uma base enxuta e genérica para
organizar contas de qualquer jogo idle, sem tocar no jogo.

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
src/main/monitor.js     coleta do Monitor (só com a tela aberta); monitor-core.js tem as contas puras e testadas
src/main/perf-sampler.ps1  leitor dos contadores do Windows (GPU, disco, rede, processos) via API PDH
src/main/catalog.js     sugestões de jogos
src/preload.js          ponte mínima (window.hub)
src/renderer/           interface: index.html, styles.css, app.js, layout.js (cálculo puro), icons.js, i18n.js (traduções),
                        monitor-ui.js (tela Monitor e gráficos), winproc-ui.js (processos do Windows)
src/renderer/m3/        tokens do Material 3 (tokens.css), cores geradas (colors.css) e a fonte Roboto Flex
scripts/build-theme.mjs gera colors.css a partir das cores base (npm run theme)
test/                   testes de store, layout, idioma, user-agent, contraste das cores e monitor (node --test)
```

## Testes

```powershell
npm test
```

Em desenvolvimento, algumas variáveis ajudam nos testes. Nenhuma delas funciona no app empacotado:
- `IDLEHUB_USERDATA` usa outra pasta de dados;
- `IDLEHUB_SMOKE=arquivo.png` tira um print e fecha o app;
- `IDLEHUB_SMOKE_JS` roda um script na interface antes do print.

## Material Design 3

O visual segue o [Material Design 3](https://m3.material.io/), implementado em CSS próprio (sem `@material/web`,
que o Google colocou em modo de manutenção):

- **Cores:** cada tema tem uma cor base. O script `scripts/build-theme.mjs` usa o algoritmo oficial
  ([`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities)) para gerar as
  funções de cor do M3 (`primary`, `surface-container`, `on-surface`…), em claro e escuro. O resultado é um CSS estático,
  então o app não carrega a biblioteca. Para mudar uma cor base, edite o script e rode `npm run theme`.
- **Tipografia, cantos, elevação e movimento:** tokens do M3 em `src/renderer/m3/tokens.css`.
- **Acessibilidade:** um teste confere o contraste WCAG de todos os pares de texto/ícone nos 10 esquemas
  (≥ 4,5:1 para texto e ≥ 3:1 para elementos gráficos).
- **Referência:** a especificação foi consultada pela skill
  [material-3-skill](https://github.com/hamen/material-3-skill) (MIT), usada também para a auditoria de conformidade.

## Créditos e licença

- **Inspiração:** a ideia veio do [PokeGrid-source](https://github.com/soufoka/PokeGrid-source). Nenhum código dele foi copiado (detalhes em [NOTICE.md](NOTICE.md)).
- **Aviso:** o IdleHub não tem afiliação com nenhum dos jogos do catálogo, e cada jogo tem as próprias regras sobre o uso de várias contas.
- **Fonte:** [Roboto Flex](https://github.com/googlefonts/roboto-flex), sob a SIL Open Font License 1.1 (`src/renderer/m3/fonts/OFL.txt`).
- **Licença:** [MIT](LICENSE).
