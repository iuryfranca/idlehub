'use strict';
// Catalogo do hub de jogos. Sao so atalhos: o usuario pode adicionar qualquer jogo de navegador pelo link HTTPS.
// Links diretos para a pagina de jogar, sem parametros de indicacao.
// logo: arquivo em src/renderer/assets/games/ (marca do respectivo jogo, ver NOTICE.md).
// fit: 'contain' para marcas com fundo transparente, 'cover' para artes que ocupam o quadro inteiro.
module.exports = Object.freeze([
  { name: 'Poke Idle World', url: 'https://poke.idleworld.online/', logo: 'poke-idle-world.webp' },
  { name: 'PokeIdle.io', url: 'https://pokeidle.io/app', logo: 'pokeidle-io.webp', fit: 'cover' },
  { name: 'Poke Legacy', url: 'https://pokelegacyonline.com.br/jogar', logo: 'poke-legacy.webp' },
  { name: 'Idle Pokemoon', url: 'https://idlepokemoon.com.br/', logo: 'idle-pokemoon.webp' },
  { name: 'Sigma Pokémon', url: 'https://poke.sigmaproject.online/play', logo: 'sigma-pokemon.webp' },
  { name: 'PokeTrue', url: 'https://poketrue.net/play', logo: 'poketrue.webp' },
  { name: 'Tibidle', url: 'https://play.tibidle.com/', logo: 'tibidle.webp' },
  { name: 'RagnaIdle', url: 'https://www.ragnaidle.com.br/play', logo: 'ragnaidle.webp' },
  { name: 'Farm Ricochet', url: 'https://farmricochet.com/', logo: 'farm-ricochet.webp' },
  { name: 'Huntera', url: 'https://huntera.com.br/', logo: 'huntera.webp' },
  { name: 'Mu Lorvath', url: 'https://lorvath.com/', logo: 'mu-lorvath.webp' },
  { name: 'Bloodbound IDLE', url: 'https://play.bloodboundonline.com/', logo: 'bloodbound-idle.webp' }
].map((g) => Object.freeze({ fit: 'contain', ...g })));
