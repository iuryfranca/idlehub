# Publicar o IdleHub na Microsoft Store

O pacote MSIX já sai pronto com `npm run dist:store` (arquivo `dist/IdleHub-<versão>-store.appx`). A Store assina o
pacote; quem instala por lá não vê o aviso do SmartScreen. O instalador `.exe` do GitHub continua existindo.

## 1. Conta e nome (uma vez)

1. Crie a conta de desenvolvedor **individual** em https://developer.microsoft.com/store/register com uma conta
   Microsoft pessoal. Para pessoa física, o registro é grátis.
2. Na Partner Center: **Apps e jogos → Novo produto → App MSIX ou PWA** → reserve o nome **IdleHub**.
3. Abra **Gerenciamento de produto → Identidade do produto**. Os valores já estão em `package.json` (`build.appx`):

   | Partner Center | `package.json` (`build.appx`) | Valor |
   | --- | --- | --- |
   | Package/Identity/Name | `identityName` | `IuryFrana.IdleHub` |
   | Package/Identity/Publisher | `publisher` | `CN=5D3BA8D1-2789-494E-B190-602AEA306B85` |
   | Package/Properties/PublisherDisplayName | `publisherDisplayName` | `Iury França` |

   Package Family Name: `IuryFrana.IdleHub_w5g7m8kvp66nc` · Store ID: `9PLXW446BSRK` ·
   link: https://apps.microsoft.com/detail/9PLXW446BSRK (funciona depois da aprovação).

## 2. Gerar o pacote

```powershell
npm run dist:store     # -> dist\IdleHub-0.1.0-store.appx (x64)
```

- A versão vem de `package.json` (`0.1.0` vira `0.1.0.0`). Cada envio novo precisa de uma versão maior.
- As imagens dos blocos e da barra de tarefas ficam em `build/appx/` e são geradas por `npm run icon` a partir de
  `build/icon.svg`.
- O pacote pede Windows 10 1809 (10.0.17763) ou mais novo, o mínimo do Electron 43.

## 3. Envio (Partner Center → Envio 1)

| Seção | O que preencher |
| --- | --- |
| Preços e disponibilidade | Grátis; todos os mercados |
| Propriedades | Categoria **Utilitários e ferramentas**. Política de privacidade: `https://iuryfranca.github.io/idlehub/privacidade.html`. Site: `https://iuryfranca.github.io/idlehub/`. Suporte: `https://github.com/iuryfranca/idlehub/issues` |
| Classificação etária | Questionário IARC: o app não tem conteúdo próprio, chat, compras nem coleta de dados; ele abre sites que o usuário escolhe (marque "acesso irrestrito à internet / navegador") |
| Pacotes | Envie `dist\IdleHub-<versão>-store.appx` |
| Listagens da Store | Português (Brasil), inglês e espanhol: textos abaixo. Capturas: `webpage/assets/screens/` (1600×856, acima do mínimo de 1366×768) |
| Opções de envio → Notas para certificação | Texto abaixo |

### Notas para a certificação (em inglês)

> IdleHub is an open-source (MIT) desktop app that shows several accounts of browser-based idle games side by side,
> each in an isolated session (Electron webviews with separate partitions). It has no backend, account, telemetry or
> ads. To test: click "Add game", pick any catalog entry or paste any HTTPS game URL, then use "New account" to open a
> second isolated session. The "Monitor" screen reads CPU/memory/GPU/disk/network counters from Windows (PDH, via a
> local PowerShell process) only while open; the optional "Windows processes" section can end a process after a
> confirmation dialog. Source code: https://github.com/iuryfranca/idlehub

## 4. Textos da listagem

### Português (Brasil)

**Descrição curta:** Várias contas de jogos idle de navegador numa janela só, cada uma com sessão isolada.

**Descrição:**
O IdleHub junta, numa janela só, várias contas de jogos idle de navegador. Cada conta abre com sessão própria: login e cookies não se misturam.

Escolha um jogo no hub (com o logo de cada um) ou cole o link de qualquer jogo de navegador. Veja as contas em grade ou em destaque, junte contas de jogos diferentes num espaço misto e acompanhe o uso da máquina e de cada conta na tela Monitor. Hiberne uma conta para liberar processador e memória sem perder o login.

Grátis e de código aberto (licença MIT). Sem conta, sem servidor, sem anúncios e sem telemetria: tudo fica no seu computador. Projeto pessoal de estudo, feito com IA. Sem afiliação com nenhum dos jogos.

**Recursos (um por linha):**
- Várias contas por jogo, cada uma com sessão isolada
- Hub de jogos com catálogo e jogos personalizados pelo link
- Layouts Grade e Destaque, foco em uma conta, zoom e proporção por jogo
- Espaço misto: contas de jogos diferentes nas mesmas telas
- Monitor de CPU, memória, GPU, disco e rede em tempo real
- Hibernar conta: libera recursos sem perder o login
- 5 temas, claro ou escuro, em português, inglês e espanhol
- Sem conta, sem anúncios e sem telemetria

**Palavras-chave (até 7):** jogos idle, multi conta, várias contas, navegador, idle game, sessões, monitor

### English

**Short description:** Several accounts of browser idle games in one window, each in its own isolated session.

**Description:**
IdleHub puts several accounts of browser-based idle games in a single window. Each account opens in its own session, so logins and cookies never mix.

Pick a game from the hub (with each game's logo) or paste the link to any browser game. View accounts in a grid or with one featured, combine accounts from different games in a mixed space, and track your machine and each account on the Monitor screen. Hibernate an account to free CPU and memory without losing the login.

Free and open source (MIT license). No account, no server, no ads and no telemetry: everything stays on your computer. A personal study project built with AI. Not affiliated with any of the games.

**Features:**
- Several accounts per game, each in an isolated session
- Game hub with a catalog and custom games by link
- Grid and Spotlight layouts, focus on one account, zoom and aspect ratio per game
- Mixed space: accounts from different games on the same screen
- Real-time CPU, memory, GPU, disk and network monitor
- Hibernate an account: frees resources and keeps the login
- 5 themes, light or dark, in Portuguese, English and Spanish
- No account, no ads, no telemetry

**Keywords:** idle games, multi account, multiple accounts, browser, idle game, sessions, monitor

### Español

**Descripción corta:** Varias cuentas de juegos idle de navegador en una sola ventana, cada una con sesión aislada.

**Descripción:**
IdleHub reúne en una sola ventana varias cuentas de juegos idle de navegador. Cada cuenta abre con su propia sesión: los inicios de sesión y las cookies no se mezclan.

Elige un juego en el hub (con el logo de cada uno) o pega el enlace de cualquier juego de navegador. Mira las cuentas en cuadrícula o con una destacada, junta cuentas de juegos distintos en un espacio mixto y sigue el uso del equipo y de cada cuenta en la pantalla Monitor. Hiberna una cuenta para liberar procesador y memoria sin perder el inicio de sesión.

Gratis y de código abierto (licencia MIT). Sin cuenta, sin servidor, sin anuncios y sin telemetría: todo queda en tu computadora. Proyecto personal de estudio, hecho con IA. Sin afiliación con ninguno de los juegos.

**Características:**
- Varias cuentas por juego, cada una con sesión aislada
- Hub de juegos con catálogo y juegos personalizados por enlace
- Diseños Cuadrícula y Destacado, enfoque en una cuenta, zoom y proporción por juego
- Espacio mixto: cuentas de juegos distintos en la misma pantalla
- Monitor de CPU, memoria, GPU, disco y red en tiempo real
- Hibernar cuenta: libera recursos sin perder el inicio de sesión
- 5 temas, claro u oscuro, en portugués, inglés y español
- Sin cuenta, sin anuncios y sin telemetría

**Palabras clave:** juegos idle, multicuenta, varias cuentas, navegador, idle game, sesiones, monitor

## 5. Riscos na certificação

- **Logos de terceiros:** o catálogo traz os logos dos jogos (marcas dos donos, ver `NOTICE.md`). A Store pode
  pedir comprovação de autorização para usar marcas de terceiros. Se recusar por isso, a saída é gerar a versão da
  Store sem os logos (os cards mostram só nome e endereço).
- **Várias contas:** alguns jogos proíbem várias contas nos próprios termos. O app não incentiva quebrar regras, e a
  descrição avisa que não há afiliação com os jogos, mas a revisão pode perguntar sobre isso.
- **Encerrar processos do Windows:** fica desligado por padrão e sempre pede confirmação; está explicado nas notas.
