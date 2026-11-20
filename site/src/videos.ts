import type { Key } from './i18n';

// Videos curtos de cada recurso (secao "Veja funcionando").
// Para colocar um video: salve o arquivo em site/public/videos/ (ex.: hub.mp4, de preferencia MP4 H.264
// ou WebM, 16:9, mudo, 5 a 15 s, ate ~4 MB) e preencha `src` com o nome do arquivo. Opcional: `poster`
// com uma imagem do primeiro quadro (site/public/videos/hub.jpg). Enquanto `src` for null, aparece o placeholder.
export type Video = { id: string; title: Key; text: Key; src: string | null; poster?: string };

export const VIDEOS: Video[] = [
  { id: 'hub', title: 'scrHub', text: 'scrHubText', src: null },
  { id: 'grid', title: 'scrGrid', text: 'scrGridText', src: null },
  { id: 'spotlight', title: 'scrSpot', text: 'scrSpotText', src: null },
  { id: 'mix', title: 'scrMix', text: 'scrMixText', src: null },
  { id: 'monitor', title: 'scrMon', text: 'scrMonText', src: null },
  { id: 'hibernate', title: 'scrSleep', text: 'scrSleepText', src: null }
];
