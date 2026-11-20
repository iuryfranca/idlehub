'use strict';
// Traducoes da interface. Cada idioma precisa ter exatamente as mesmas chaves (ver test/i18n.test.js).
// Variaveis entre chaves: t('accountsOf', { game: 'X' }).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HubI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const LANGUAGES = [
    { id: 'pt-BR', label: 'Português (Brasil)' },
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' }
  ];

  const STRINGS = {
    'pt-BR': {
      games: 'Jogos', addGame: 'Adicionar jogo', accounts: 'Contas', accountsOf: 'Contas · {game}', newAccount: 'Nova conta',
      theme: 'Tema', language: 'Idioma', sidebarAria: 'Jogos e contas',
      toggleDrawer: 'Mostrar/ocultar lateral (Ctrl+B)', noGame: 'Nenhum jogo', layout: 'Layout',
      grid: 'Grade', gridHint: 'Grade: todas as contas do mesmo tamanho',
      featured: 'Destaque', featuredHint: 'Destaque: uma conta grande e as outras ao lado',
      zoom: 'Zoom do jogo', zoomOut: 'Diminuir zoom (Ctrl -)', zoomIn: 'Aumentar zoom (Ctrl +)', zoomReset: 'Voltar para 100% (Ctrl 0)',
      aspect: 'Proporção dos painéis', aspectFree: 'Livre', editGame: 'Editar jogo',
      muteAll: 'Som geral (Ctrl+M)', fullscreen: 'Tela cheia (F11)',
      cancel: 'Cancelar', ok: 'OK', save: 'Salvar', add: 'Adicionar', create: 'Criar', remove: 'Remover',
      pinFeatured: 'Colocar em destaque', accountMuted: 'Conta sem som (clique para ligar)', muteAccount: 'Silenciar esta conta',
      reload: 'Recarregar', expand: 'Expandir (Esc volta)', dragToResize: 'Arraste para ajustar',
      expandAccount: 'Expandir esta conta', rename: 'Renomear', removeAccount: 'Remover conta', muted: 'Sem som',
      saveFailed: 'Não foi possível salvar.',
      emptyCreateFirst: 'Criar a primeira conta', emptyAddGame: 'Adicionar um jogo',
      emptyNoAccounts: 'Nenhuma conta em {game}', emptyNoAccountsText: 'Cada conta abre com sessão própria: cookies e login não se misturam.',
      emptyHero: 'Seus jogos idle, lado a lado', emptyHeroText: 'Adicione um jogo de navegador e abra várias contas dele na mesma janela.',
      gameName: 'Nome', gameNamePlaceholder: 'Ex.: Meu jogo idle', gameUrl: 'Link do jogo (HTTPS)', suggestions: 'Sugestões', alreadyAdded: 'Já adicionado',
      errGameName: 'Dê um nome ao jogo.', errGameUrl: 'Use um link completo começando com https://',
      removeGameButton: 'Remover este jogo e suas contas', removeTitle: 'Remover {name}?',
      removeGameText: 'As {count} conta(s) deste jogo serão apagadas, inclusive o login salvo nelas.',
      maxAccounts: 'Máximo de 9 contas por jogo.', newAccountIn: 'Nova conta em {game}', accountNickname: 'Apelido da conta',
      defaultAccountName: 'Conta {n}', errNickname: 'Dê um apelido à conta.', renameAccount: 'Renomear conta', nickname: 'Apelido',
      errNicknameEmpty: 'O apelido não pode ficar vazio.',
      removeAccountText: 'A sessão desta conta (login, cookies e dados salvos pelo jogo) será apagada deste computador.',
      themeGrafite: 'Grafite', themeAurora: 'Aurora', themeOceano: 'Oceano', themeAreia: 'Areia', themePapel: 'Papel',
      languageChanged: 'Idioma alterado. Os jogos usam o novo idioma ao recarregar.'
    },
    en: {
      games: 'Games', addGame: 'Add game', accounts: 'Accounts', accountsOf: 'Accounts · {game}', newAccount: 'New account',
      theme: 'Theme', language: 'Language', sidebarAria: 'Games and accounts',
      toggleDrawer: 'Show/hide sidebar (Ctrl+B)', noGame: 'No game', layout: 'Layout',
      grid: 'Grid', gridHint: 'Grid: every account the same size',
      featured: 'Spotlight', featuredHint: 'Spotlight: one large account, the others beside it',
      zoom: 'Game zoom', zoomOut: 'Zoom out (Ctrl -)', zoomIn: 'Zoom in (Ctrl +)', zoomReset: 'Reset to 100% (Ctrl 0)',
      aspect: 'Panel aspect ratio', aspectFree: 'Free', editGame: 'Edit game',
      muteAll: 'All sound (Ctrl+M)', fullscreen: 'Full screen (F11)',
      cancel: 'Cancel', ok: 'OK', save: 'Save', add: 'Add', create: 'Create', remove: 'Remove',
      pinFeatured: 'Put in spotlight', accountMuted: 'Account muted (click to unmute)', muteAccount: 'Mute this account',
      reload: 'Reload', expand: 'Expand (Esc to go back)', dragToResize: 'Drag to resize',
      expandAccount: 'Expand this account', rename: 'Rename', removeAccount: 'Remove account', muted: 'Muted',
      saveFailed: 'Could not save.',
      emptyCreateFirst: 'Create the first account', emptyAddGame: 'Add a game',
      emptyNoAccounts: 'No accounts in {game}', emptyNoAccountsText: 'Each account opens in its own session: cookies and logins never mix.',
      emptyHero: 'Your idle games, side by side', emptyHeroText: 'Add a browser game and open several of its accounts in the same window.',
      gameName: 'Name', gameNamePlaceholder: 'e.g. My idle game', gameUrl: 'Game link (HTTPS)', suggestions: 'Suggestions', alreadyAdded: 'Already added',
      errGameName: 'Give the game a name.', errGameUrl: 'Use a full link starting with https://',
      removeGameButton: 'Remove this game and its accounts', removeTitle: 'Remove {name}?',
      removeGameText: 'The {count} account(s) of this game will be deleted, including the login saved in them.',
      maxAccounts: 'Up to 9 accounts per game.', newAccountIn: 'New account in {game}', accountNickname: 'Account nickname',
      defaultAccountName: 'Account {n}', errNickname: 'Give the account a nickname.', renameAccount: 'Rename account', nickname: 'Nickname',
      errNicknameEmpty: 'The nickname cannot be empty.',
      removeAccountText: 'This account\'s session (login, cookies and data saved by the game) will be deleted from this computer.',
      themeGrafite: 'Graphite', themeAurora: 'Aurora', themeOceano: 'Ocean', themeAreia: 'Sand', themePapel: 'Paper',
      languageChanged: 'Language changed. Games use the new language when reloaded.'
    },
    es: {
      games: 'Juegos', addGame: 'Añadir juego', accounts: 'Cuentas', accountsOf: 'Cuentas · {game}', newAccount: 'Nueva cuenta',
      theme: 'Tema', language: 'Idioma', sidebarAria: 'Juegos y cuentas',
      toggleDrawer: 'Mostrar/ocultar barra lateral (Ctrl+B)', noGame: 'Ningún juego', layout: 'Diseño',
      grid: 'Cuadrícula', gridHint: 'Cuadrícula: todas las cuentas del mismo tamaño',
      featured: 'Destacado', featuredHint: 'Destacado: una cuenta grande y las demás al lado',
      zoom: 'Zoom del juego', zoomOut: 'Reducir zoom (Ctrl -)', zoomIn: 'Aumentar zoom (Ctrl +)', zoomReset: 'Volver a 100% (Ctrl 0)',
      aspect: 'Proporción de los paneles', aspectFree: 'Libre', editGame: 'Editar juego',
      muteAll: 'Sonido general (Ctrl+M)', fullscreen: 'Pantalla completa (F11)',
      cancel: 'Cancelar', ok: 'OK', save: 'Guardar', add: 'Añadir', create: 'Crear', remove: 'Eliminar',
      pinFeatured: 'Poner en destacado', accountMuted: 'Cuenta sin sonido (clic para activar)', muteAccount: 'Silenciar esta cuenta',
      reload: 'Recargar', expand: 'Expandir (Esc para volver)', dragToResize: 'Arrastra para ajustar',
      expandAccount: 'Expandir esta cuenta', rename: 'Renombrar', removeAccount: 'Eliminar cuenta', muted: 'Sin sonido',
      saveFailed: 'No se pudo guardar.',
      emptyCreateFirst: 'Crear la primera cuenta', emptyAddGame: 'Añadir un juego',
      emptyNoAccounts: 'Ninguna cuenta en {game}', emptyNoAccountsText: 'Cada cuenta se abre con su propia sesión: cookies e inicios de sesión no se mezclan.',
      emptyHero: 'Tus juegos idle, uno al lado del otro', emptyHeroText: 'Añade un juego de navegador y abre varias cuentas en la misma ventana.',
      gameName: 'Nombre', gameNamePlaceholder: 'Ej.: Mi juego idle', gameUrl: 'Enlace del juego (HTTPS)', suggestions: 'Sugerencias', alreadyAdded: 'Ya añadido',
      errGameName: 'Ponle un nombre al juego.', errGameUrl: 'Usa un enlace completo que empiece por https://',
      removeGameButton: 'Eliminar este juego y sus cuentas', removeTitle: '¿Eliminar {name}?',
      removeGameText: 'Se borrarán las {count} cuenta(s) de este juego, incluido el inicio de sesión guardado en ellas.',
      maxAccounts: 'Máximo de 9 cuentas por juego.', newAccountIn: 'Nueva cuenta en {game}', accountNickname: 'Apodo de la cuenta',
      defaultAccountName: 'Cuenta {n}', errNickname: 'Ponle un apodo a la cuenta.', renameAccount: 'Renombrar cuenta', nickname: 'Apodo',
      errNicknameEmpty: 'El apodo no puede quedar vacío.',
      removeAccountText: 'La sesión de esta cuenta (inicio de sesión, cookies y datos guardados por el juego) se borrará de este equipo.',
      themeGrafite: 'Grafito', themeAurora: 'Aurora', themeOceano: 'Océano', themeAreia: 'Arena', themePapel: 'Papel',
      languageChanged: 'Idioma cambiado. Los juegos usan el nuevo idioma al recargar.'
    }
  };

  let current = 'pt-BR';
  const setLanguage = (id) => { current = STRINGS[id] ? id : 'pt-BR'; return current; };
  const t = (key, vars) => {
    const text = STRINGS[current][key] ?? STRINGS['pt-BR'][key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text;
  };

  return { LANGUAGES, STRINGS, setLanguage, t, get language() { return current; } };
});
