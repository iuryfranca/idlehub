import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'pt' | 'en' | 'es';
export const LANGS: { id: Lang; label: string; short: string; html: string }[] = [
  { id: 'pt', label: 'Português', short: 'PT', html: 'pt-BR' },
  { id: 'en', label: 'English', short: 'EN', html: 'en' },
  { id: 'es', label: 'Español', short: 'ES', html: 'es' }
];

const pt = {
  navFeatures: 'Recursos', navScreens: 'Vídeos', navPrivacy: 'Privacidade', navDownload: 'Baixar',
  language: 'Idioma', themeLabel: 'Tema', modeDark: 'Escuro', modeLight: 'Claro', toggleMode: 'Alternar claro/escuro',
  heroChip: 'Open source · versão 0.1.0', heroChipLink: 'Novidades',
  heroTitleA: 'Seus jogos idle,', heroTitleB: 'lado a lado.',
  heroSub: 'Várias contas de jogos de navegador numa janela só, cada uma com sessão própria. Grátis, de código aberto e sem coletar nenhum dado.',
  ctaDownload: 'Baixar para Windows', ctaCode: 'Ver o código', heroMeta: 'Windows 10/11 · grátis · licença MIT',
  mockTry: 'É interativo: troque o jogo e o layout',
  mockAddGame: 'Adicionar jogo', mockGames: 'Jogos', mockMixes: 'Espaços mistos', mockGrid: 'Grade', mockFeatured: 'Destaque', mockAccounts: 'contas',
  mockLevel: 'Nível', mockGold: 'ouro', mockAuto: 'ataque automático', mockHibernated: 'Hibernada',
  floatCpu: 'Processador', floatNow: 'agora', floatToast: 'Farm 01 hibernada: CPU liberada', floatMix: 'Espaço misto', floatMixText: '4 telas de 3 jogos',
  featKicker: 'Recursos', featTitle: 'Tudo para jogar com várias contas, sem bagunça.',
  featSub: 'Cada peça do IdleHub foi feita para ficar rodando o dia inteiro: leve, organizada e sem misturar nada.',
  sessTitle: 'Sessões isoladas', sessText: 'Cada conta tem cookies e login próprios. Nada se mistura, nem entre contas do mesmo jogo.',
  mixTitle: 'Espaço misto', mixText: 'Junte contas de jogos diferentes nas mesmas telas. Clique nas contas para montar.', mixClear: 'Limpar', mixPanels: 'telas',
  monTitle: 'Monitor em tempo real', monText: 'CPU, memória, GPU, disco e rede, da máquina e de cada conta.', monMachine: 'Máquina', monApp: 'IdleHub',
  sleepTitle: 'Hibernar conta', sleepText: 'Pausa uma conta sem perder o login e devolve CPU e memória ao computador.',
  sleepAwake: 'Acordada', sleepAsleep: 'Hibernada', sleepToggle: 'Hibernar ou acordar',
  hubTitle: 'Hub de jogos', hubText: 'Escolha no catálogo ou cole o link de qualquer jogo de navegador. O ícone aparece sozinho.', hubAdd: 'Adicionar', hubCustom: 'Jogo personalizado',
  themeTitle: 'Do seu jeito', themeText: '5 temas Material 3, claro ou escuro. Experimente: o site muda junto.',
  langTitle: '3 idiomas', langText: 'Português, English e Español, no app e aqui.',
  keysTitle: 'Atalhos', keysText: 'Aperte no teclado e veja acender.', keyDrawer: 'lateral', keyMute: 'som', keyFull: 'tela cheia', keyFocus: 'foco na conta',
  scrKicker: 'Veja funcionando', scrTitle: 'Cada recurso em poucos segundos.', scrSub: 'Vídeos curtos do app de verdade, um para cada recurso.', vidSoon: 'Vídeo em breve', vidSoonText: 'Um vídeo curto mostrando este recurso entra aqui.',
  scrGrid: 'Grade', scrGridText: 'Todas as contas do mesmo tamanho, com colunas escolhidas sozinhas.',
  scrSpot: 'Destaque', scrSpotText: 'Uma conta grande e as outras ao lado. Arraste a divisória.',
  scrMix: 'Espaço misto', scrMixText: 'Contas de jogos diferentes, com o nome do jogo em cada tela.',
  scrMon: 'Monitor', scrMonText: 'A máquina e cada conta em tempo real, com a lista de processos do Windows.',
  scrHub: 'Hub de jogos', scrHubText: 'Catálogo com logos e uma barra de endereço para qualquer jogo.',
  scrSleep: 'Hibernar', scrSleepText: 'A conta dorme, o login fica. Um clique acorda.',
  privKicker: 'Privacidade', privTitle: 'Nada sai do seu computador.',
  privText: 'O IdleHub não tem servidor, conta nem telemetria. Seus jogos, contas e preferências ficam só na sua máquina. O código é aberto para qualquer pessoa conferir.',
  privServers: 'servidores', privTrackers: 'rastreadores', privAds: 'anúncios', privOpen: 'código aberto',
  privItem1: 'Sem cadastro e sem login no IdleHub', privItem2: 'Sem analytics, sem relatório de erros pela internet', privItem3: 'Sessão de cada conta guardada só no seu computador', privItem4: 'A única requisição própria é o ícone de cada jogo, pedido ao site dele',
  privLink: 'Ler a política de privacidade',
  dlKicker: 'Baixar', dlTitle: 'Pronto em um minuto.',
  dlWinTitle: 'Instalador para Windows', dlWinText: 'Windows 10/11, 64 bits. Instala só para o seu usuário, sem pedir administrador.', dlWinBtn: 'Baixar o instalador',
  dlWinNote: 'Ainda sem assinatura digital: se o Windows avisar, clique em Mais informações → Executar assim mesmo.',
  dlStoreTitle: 'Microsoft Store', dlStoreText: 'Instala sem avisos e se atualiza sozinho pela Store.', dlStoreBadge: 'Em análise',
  dlSrcTitle: 'Pelo código-fonte', dlSrcText: 'Precisa do Node.js 24 ou mais recente.', copy: 'Copiar', copied: 'Copiado',
  footMade: 'Feito com IA (Claude Code) para estudo · licença MIT', footNote: 'Inspirado no PokeGrid. Sem afiliação com nenhum dos jogos.',
  footPrivacy: 'Política de privacidade', footReleases: 'Versões', footHome: 'Início',
  ppTitle: 'Política de privacidade', ppMeta: 'IdleHub · vigente desde 20 de novembro de 2026 · responsável: Iury França',
  ppLead: 'O IdleHub não coleta, não envia e não guarda dados pessoais em nenhum servidor.',
  ppLeadRest: 'Não existe servidor do IdleHub, nem conta, cadastro, telemetria, análise de uso, anúncios ou atualização automática.',
  ppLocalTitle: 'O que fica no seu computador',
  ppLocal1: 'A lista de jogos (nome, link e ícone), os apelidos das contas, os espaços mistos e as preferências (tema, idioma, layout).',
  ppLocal2: 'A sessão de cada conta (cookies e dados que o próprio jogo grava), separada por conta.',
  ppLocalEnd: '"Remover conta" apaga a sessão daquela conta. Desinstalar a versão da Microsoft Store apaga tudo; na versão instalada pelo GitHub, apague também a pasta %APPDATA%\\idlehub.',
  ppNetTitle: 'Conexões com a internet',
  ppNet1: 'O app abre apenas os sites de jogos que você adiciona. O que você envia a um jogo (o login, por exemplo) vai para o servidor desse jogo, como num navegador, e segue a política de privacidade dele. O IdleHub não vê, não copia e não repassa esses dados.',
  ppNet2: 'A única requisição feita pelo próprio app é o ícone (favicon) de cada jogo, pedido ao site do próprio jogo, só por HTTPS. O ícone é guardado no seu computador.',
  ppNet3: 'Links externos só abrem no seu navegador quando você clica.',
  ppMonTitle: 'Monitor de recursos', ppMon: 'A tela Monitor lê o uso de processador, memória, placa de vídeo, disco e rede do Windows enquanto está aberta. Nada disso é gravado nem enviado.',
  ppSiteTitle: 'Este site', ppSite: 'O site não usa cookies, analytics nem recursos de terceiros. A escolha de idioma e de tema fica só no seu navegador.',
  ppKidsTitle: 'Crianças', ppKids: 'O IdleHub não coleta dados de ninguém, inclusive de crianças.',
  ppContactTitle: 'Contato e código-fonte', ppContact: 'O código é aberto (licença MIT). Dúvidas sobre privacidade: abra uma issue no GitHub.',
  ppBack: 'Voltar ao início'
};

type Dict = typeof pt;

const en: Dict = {
  navFeatures: 'Features', navScreens: 'Videos', navPrivacy: 'Privacy', navDownload: 'Download',
  language: 'Language', themeLabel: 'Theme', modeDark: 'Dark', modeLight: 'Light', toggleMode: 'Toggle light/dark',
  heroChip: 'Open source · version 0.1.0', heroChipLink: "What's new",
  heroTitleA: 'Your idle games,', heroTitleB: 'side by side.',
  heroSub: 'Several accounts of browser games in one window, each in its own session. Free, open source and collecting no data at all.',
  ctaDownload: 'Download for Windows', ctaCode: 'View the code', heroMeta: 'Windows 10/11 · free · MIT license',
  mockTry: "It's interactive: switch the game and the layout",
  mockAddGame: 'Add game', mockGames: 'Games', mockMixes: 'Mixed spaces', mockGrid: 'Grid', mockFeatured: 'Spotlight', mockAccounts: 'accounts',
  mockLevel: 'Level', mockGold: 'gold', mockAuto: 'auto attack', mockHibernated: 'Hibernated',
  floatCpu: 'Processor', floatNow: 'now', floatToast: 'Farm 01 hibernated: CPU freed', floatMix: 'Mixed space', floatMixText: '4 panels from 3 games',
  featKicker: 'Features', featTitle: 'Everything to play with many accounts, without the mess.',
  featSub: 'Every part of IdleHub is built to run all day: light, organized and never mixing anything.',
  sessTitle: 'Isolated sessions', sessText: 'Each account has its own cookies and login. Nothing mixes, not even between accounts of the same game.',
  mixTitle: 'Mixed space', mixText: 'Put accounts from different games on the same screen. Click the accounts to build one.', mixClear: 'Clear', mixPanels: 'panels',
  monTitle: 'Real-time monitor', monText: 'CPU, memory, GPU, disk and network, for the machine and each account.', monMachine: 'Machine', monApp: 'IdleHub',
  sleepTitle: 'Hibernate an account', sleepText: 'Pauses an account without losing the login and gives CPU and memory back to your computer.',
  sleepAwake: 'Awake', sleepAsleep: 'Hibernated', sleepToggle: 'Hibernate or wake',
  hubTitle: 'Game hub', hubText: 'Pick from the catalog or paste the link to any browser game. The icon shows up on its own.', hubAdd: 'Add', hubCustom: 'Custom game',
  themeTitle: 'Your way', themeText: '5 Material 3 themes, light or dark. Try it: this site changes too.',
  langTitle: '3 languages', langText: 'Português, English and Español, in the app and here.',
  keysTitle: 'Shortcuts', keysText: 'Press them on your keyboard and watch them light up.', keyDrawer: 'sidebar', keyMute: 'sound', keyFull: 'full screen', keyFocus: 'focus account',
  scrKicker: 'See it working', scrTitle: 'Every feature in a few seconds.', scrSub: 'Short videos of the real app, one for each feature.', vidSoon: 'Video coming soon', vidSoonText: 'A short video showing this feature goes here.',
  scrGrid: 'Grid', scrGridText: 'Every account the same size, with columns picked for you.',
  scrSpot: 'Spotlight', scrSpotText: 'One large account and the others beside it. Drag the divider.',
  scrMix: 'Mixed space', scrMixText: "Accounts from different games, each panel showing its game's name.",
  scrMon: 'Monitor', scrMonText: 'The machine and every account in real time, with the Windows process list.',
  scrHub: 'Game hub', scrHubText: 'A catalog with logos and an address bar for any game.',
  scrSleep: 'Hibernate', scrSleepText: 'The account sleeps, the login stays. One click wakes it.',
  privKicker: 'Privacy', privTitle: 'Nothing leaves your computer.',
  privText: 'IdleHub has no server, account or telemetry. Your games, accounts and preferences stay on your machine. The code is open for anyone to check.',
  privServers: 'servers', privTrackers: 'trackers', privAds: 'ads', privOpen: 'open source',
  privItem1: 'No sign-up and no IdleHub login', privItem2: 'No analytics, no error reports over the internet', privItem3: "Each account's session stored only on your computer", privItem4: "The only request of its own is each game's icon, fetched from that game's site",
  privLink: 'Read the privacy policy',
  dlKicker: 'Download', dlTitle: 'Ready in a minute.',
  dlWinTitle: 'Windows installer', dlWinText: 'Windows 10/11, 64-bit. Installs for your user only, without asking for admin rights.', dlWinBtn: 'Download the installer',
  dlWinNote: 'Not digitally signed yet: if Windows warns you, click More info → Run anyway.',
  dlStoreTitle: 'Microsoft Store', dlStoreText: 'Installs without warnings and updates itself through the Store.', dlStoreBadge: 'In review',
  dlSrcTitle: 'From source', dlSrcText: 'Requires Node.js 24 or newer.', copy: 'Copy', copied: 'Copied',
  footMade: 'Built with AI (Claude Code) for study · MIT license', footNote: 'Inspired by PokeGrid. Not affiliated with any of the games.',
  footPrivacy: 'Privacy policy', footReleases: 'Releases', footHome: 'Home',
  ppTitle: 'Privacy policy', ppMeta: 'IdleHub · effective November 20, 2026 · controller: Iury França',
  ppLead: 'IdleHub does not collect, send or store personal data on any server.',
  ppLeadRest: 'There is no IdleHub server, account, sign-up, telemetry, usage analytics, ads or automatic update.',
  ppLocalTitle: 'What stays on your computer',
  ppLocal1: 'Your list of games (name, link and icon), account nicknames, mixed spaces and preferences (theme, language, layout).',
  ppLocal2: "Each account's session (cookies and data the game itself stores), kept separate per account.",
  ppLocalEnd: '"Remove account" deletes that account\'s session. Uninstalling the Microsoft Store version deletes everything; for the version installed from GitHub, also delete the %APPDATA%\\idlehub folder.',
  ppNetTitle: 'Internet connections',
  ppNet1: "The app only opens the game websites you add. Whatever you send to a game (your login, for example) goes to that game's server, as in a browser, under that game's privacy policy. IdleHub does not see, copy or share that data.",
  ppNet2: "The only request the app makes on its own is each game's icon (favicon), fetched from that game's own website over HTTPS. The icon is stored on your computer.",
  ppNet3: 'External links only open in your browser when you click them.',
  ppMonTitle: 'Resource monitor', ppMon: 'The Monitor screen reads processor, memory, graphics, disk and network usage from Windows while it is open. None of it is saved or sent.',
  ppSiteTitle: 'This website', ppSite: 'This site uses no cookies, analytics or third-party resources. Your language and theme choice stays in your browser only.',
  ppKidsTitle: 'Children', ppKids: 'IdleHub collects no data from anyone, including children.',
  ppContactTitle: 'Contact and source code', ppContact: 'The code is open source (MIT license). Privacy questions: open an issue on GitHub.',
  ppBack: 'Back to home'
};

const es: Dict = {
  navFeatures: 'Funciones', navScreens: 'Videos', navPrivacy: 'Privacidad', navDownload: 'Descargar',
  language: 'Idioma', themeLabel: 'Tema', modeDark: 'Oscuro', modeLight: 'Claro', toggleMode: 'Cambiar claro/oscuro',
  heroChip: 'Código abierto · versión 0.1.0', heroChipLink: 'Novedades',
  heroTitleA: 'Tus juegos idle,', heroTitleB: 'lado a lado.',
  heroSub: 'Varias cuentas de juegos de navegador en una sola ventana, cada una con su propia sesión. Gratis, de código abierto y sin recopilar ningún dato.',
  ctaDownload: 'Descargar para Windows', ctaCode: 'Ver el código', heroMeta: 'Windows 10/11 · gratis · licencia MIT',
  mockTry: 'Es interactivo: cambia el juego y el diseño',
  mockAddGame: 'Añadir juego', mockGames: 'Juegos', mockMixes: 'Espacios mixtos', mockGrid: 'Cuadrícula', mockFeatured: 'Destacado', mockAccounts: 'cuentas',
  mockLevel: 'Nivel', mockGold: 'oro', mockAuto: 'ataque automático', mockHibernated: 'Hibernada',
  floatCpu: 'Procesador', floatNow: 'ahora', floatToast: 'Farm 01 hibernada: CPU liberada', floatMix: 'Espacio mixto', floatMixText: '4 paneles de 3 juegos',
  featKicker: 'Funciones', featTitle: 'Todo para jugar con varias cuentas, sin desorden.',
  featSub: 'Cada parte de IdleHub está hecha para quedarse abierta todo el día: ligera, ordenada y sin mezclar nada.',
  sessTitle: 'Sesiones aisladas', sessText: 'Cada cuenta tiene sus propias cookies e inicio de sesión. Nada se mezcla, ni entre cuentas del mismo juego.',
  mixTitle: 'Espacio mixto', mixText: 'Junta cuentas de juegos distintos en la misma pantalla. Haz clic en las cuentas para armarlo.', mixClear: 'Limpiar', mixPanels: 'paneles',
  monTitle: 'Monitor en tiempo real', monText: 'CPU, memoria, GPU, disco y red, del equipo y de cada cuenta.', monMachine: 'Equipo', monApp: 'IdleHub',
  sleepTitle: 'Hibernar cuenta', sleepText: 'Pausa una cuenta sin perder el inicio de sesión y devuelve CPU y memoria al equipo.',
  sleepAwake: 'Despierta', sleepAsleep: 'Hibernada', sleepToggle: 'Hibernar o despertar',
  hubTitle: 'Hub de juegos', hubText: 'Elige del catálogo o pega el enlace de cualquier juego de navegador. El icono aparece solo.', hubAdd: 'Añadir', hubCustom: 'Juego personalizado',
  themeTitle: 'A tu manera', themeText: '5 temas Material 3, claro u oscuro. Pruébalo: este sitio también cambia.',
  langTitle: '3 idiomas', langText: 'Português, English y Español, en la app y aquí.',
  keysTitle: 'Atajos', keysText: 'Pulsa en tu teclado y míralos encenderse.', keyDrawer: 'barra lateral', keyMute: 'sonido', keyFull: 'pantalla completa', keyFocus: 'enfocar cuenta',
  scrKicker: 'Míralo funcionar', scrTitle: 'Cada función en pocos segundos.', scrSub: 'Videos cortos de la app real, uno por función.', vidSoon: 'Video próximamente', vidSoonText: 'Aquí va un video corto que muestra esta función.',
  scrGrid: 'Cuadrícula', scrGridText: 'Todas las cuentas del mismo tamaño, con columnas elegidas solas.',
  scrSpot: 'Destacado', scrSpotText: 'Una cuenta grande y las demás al lado. Arrastra el divisor.',
  scrMix: 'Espacio mixto', scrMixText: 'Cuentas de juegos distintos, con el nombre del juego en cada panel.',
  scrMon: 'Monitor', scrMonText: 'El equipo y cada cuenta en tiempo real, con la lista de procesos de Windows.',
  scrHub: 'Hub de juegos', scrHubText: 'Catálogo con logos y una barra de dirección para cualquier juego.',
  scrSleep: 'Hibernar', scrSleepText: 'La cuenta duerme, la sesión se queda. Un clic la despierta.',
  privKicker: 'Privacidad', privTitle: 'Nada sale de tu computadora.',
  privText: 'IdleHub no tiene servidor, cuenta ni telemetría. Tus juegos, cuentas y preferencias quedan solo en tu equipo. El código es abierto para que cualquiera lo revise.',
  privServers: 'servidores', privTrackers: 'rastreadores', privAds: 'anuncios', privOpen: 'código abierto',
  privItem1: 'Sin registro ni inicio de sesión en IdleHub', privItem2: 'Sin analytics ni informes de errores por internet', privItem3: 'La sesión de cada cuenta se guarda solo en tu equipo', privItem4: 'La única solicitud propia es el icono de cada juego, pedido a su sitio',
  privLink: 'Leer la política de privacidad',
  dlKicker: 'Descargar', dlTitle: 'Listo en un minuto.',
  dlWinTitle: 'Instalador para Windows', dlWinText: 'Windows 10/11, 64 bits. Se instala solo para tu usuario, sin pedir administrador.', dlWinBtn: 'Descargar el instalador',
  dlWinNote: 'Aún sin firma digital: si Windows avisa, haz clic en Más información → Ejecutar de todas formas.',
  dlStoreTitle: 'Microsoft Store', dlStoreText: 'Se instala sin avisos y se actualiza sola desde la Store.', dlStoreBadge: 'En revisión',
  dlSrcTitle: 'Desde el código fuente', dlSrcText: 'Requiere Node.js 24 o más reciente.', copy: 'Copiar', copied: 'Copiado',
  footMade: 'Hecho con IA (Claude Code) para estudiar · licencia MIT', footNote: 'Inspirado en PokeGrid. Sin afiliación con ninguno de los juegos.',
  footPrivacy: 'Política de privacidad', footReleases: 'Versiones', footHome: 'Inicio',
  ppTitle: 'Política de privacidad', ppMeta: 'IdleHub · vigente desde el 20 de noviembre de 2026 · responsable: Iury França',
  ppLead: 'IdleHub no recopila, no envía ni guarda datos personales en ningún servidor.',
  ppLeadRest: 'No hay servidor de IdleHub, ni cuenta, registro, telemetría, análisis de uso, anuncios ni actualización automática.',
  ppLocalTitle: 'Lo que queda en tu computadora',
  ppLocal1: 'La lista de juegos (nombre, enlace e icono), los apodos de las cuentas, los espacios mixtos y las preferencias (tema, idioma, diseño).',
  ppLocal2: 'La sesión de cada cuenta (cookies y datos que guarda el propio juego), separada por cuenta.',
  ppLocalEnd: '"Eliminar cuenta" borra la sesión de esa cuenta. Desinstalar la versión de Microsoft Store lo borra todo; en la versión instalada desde GitHub, borra también la carpeta %APPDATA%\\idlehub.',
  ppNetTitle: 'Conexiones a internet',
  ppNet1: 'La app solo abre los sitios de juegos que tú añades. Lo que envías a un juego (tu inicio de sesión, por ejemplo) va al servidor de ese juego, como en un navegador, y sigue su política de privacidad. IdleHub no ve, no copia ni comparte esos datos.',
  ppNet2: 'La única solicitud que hace la propia app es el icono (favicon) de cada juego, pedido al sitio del propio juego, solo por HTTPS. El icono se guarda en tu computadora.',
  ppNet3: 'Los enlaces externos solo se abren en tu navegador cuando haces clic.',
  ppMonTitle: 'Monitor de recursos', ppMon: 'La pantalla Monitor lee el uso de procesador, memoria, gráficos, disco y red de Windows mientras está abierta. Nada se guarda ni se envía.',
  ppSiteTitle: 'Este sitio', ppSite: 'Este sitio no usa cookies, analytics ni recursos de terceros. Tu elección de idioma y tema queda solo en tu navegador.',
  ppKidsTitle: 'Menores', ppKids: 'IdleHub no recopila datos de nadie, incluidos menores.',
  ppContactTitle: 'Contacto y código fuente', ppContact: 'El código es abierto (licencia MIT). Preguntas sobre privacidad: abre un issue en GitHub.',
  ppBack: 'Volver al inicio'
};

const DICTS: Record<Lang, Dict> = { pt, en, es };
export type Key = keyof Dict;

// Idioma inicial: o salvo (so neste navegador) ou o do navegador.
function initialLang(): Lang {
  try { const saved = localStorage.getItem('idlehub-site-lang'); if (saved === 'pt' || saved === 'en' || saved === 'es') return saved; } catch { /* sem armazenamento */ }
  const nav = (navigator.language || 'pt').toLowerCase();
  return nav.startsWith('pt') ? 'pt' : nav.startsWith('es') ? 'es' : 'en';
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string };
const I18n = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.id === lang)!.html;
    try { localStorage.setItem('idlehub-site-lang', lang); } catch { /* ok */ }
  }, [lang]);
  const value = useMemo<Ctx>(() => ({ lang, setLang: setLangState, t: (k) => DICTS[lang][k] }), [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18n);
  if (!ctx) throw new Error('I18nProvider ausente');
  return ctx;
}
