# site: página de apresentação do IdleHub

Aplicação React (Vite + TypeScript + Tailwind + Motion), publicada em https://iuryfranca.github.io/idlehub/ pelo
fluxo `.github/workflows/pages.yml` a cada push na `main` que mexe nesta pasta.

```powershell
cd site
npm install
npm run dev       # http://localhost:5173/idlehub/
npm run build     # gera dist/ (o que vai para o GitHub Pages)
```

## Como está organizado

- **Cores:** as mesmas paletas Material 3 do app, geradas por `scripts/themes.mjs` (`src/themes.json`, refeito a cada
  `dev`/`build`) a partir das mesmas cores base. O tema e o modo claro/escuro trocam com uma revelação circular
  (View Transitions).
- **Textos:** `src/i18n.tsx`, em pt-BR, en e es (o idioma do navegador é o padrão).
- **Destaque:** `src/components/AppMock.tsx` é uma réplica viva do app em React, com jogos fictícios. Não é uma captura.
- **Recursos:** `src/components/Features.tsx`, um mosaico de demonstrações interativas (espaço misto, monitor,
  hibernar, temas, idiomas, hub e atalhos).
- **Vídeos:** `src/videos.ts`. Para colocar um vídeo, salve o arquivo em `public/videos/` (MP4 H.264 ou WebM, 16:9,
  mudo, de 5 a 15 s, até ~4 MB) e preencha `src` com o nome dele. Enquanto `src` for `null`, aparece o placeholder.
- **Política de privacidade:** `privacidade.html` + `src/pages.tsx` (a mesma política exigida pela Microsoft Store).
- **Store:** quando o app for aprovado, troque `STORE_LIVE` para `true` em `src/links.ts`.

## Privacidade do site

Nenhum recurso de terceiros: fontes locais (Roboto Flex e Roboto Mono via Fontsource), sem analytics, sem cookies.
A escolha de idioma e de tema fica só no `localStorage` do navegador. A política de segurança (CSP) de cada página
bloqueia qualquer conteúdo de fora.
