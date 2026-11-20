# Créditos e avisos

O IdleHub é um projeto pessoal de estudo, escrito do zero. Não tem afiliação com nenhum dos jogos listados,
nem com o IdleBoard, nem com o PokeGrid.

- **Inspiração:** a ideia de várias contas de um jogo idle lado a lado, cada uma numa sessão isolada, veio do
  [PokeGrid-source](https://github.com/soufoka/PokeGrid-source) (MIT, © 2026 soufoka). Nenhum código dele foi
  copiado: a comparação automática (trechos de 12+ tokens iguais) só encontra chamadas padrão da API do Electron.
- **Electron** (MIT) e Chromium: licenças distribuídas junto com o binário do Electron.
- **Roboto Flex** (SIL Open Font License 1.1, © The Roboto Flex Project Authors): fonte empacotada em
  `src/renderer/m3/fonts/`, com a licença em `OFL.txt`.
- **Material Design 3** (Google): o visual segue a especificação pública do M3. As paletas são geradas, durante o
  desenvolvimento, com `@material/material-color-utilities` (Apache 2.0); a biblioteca não vai junto com o app.
- **material-3-skill** (MIT, Ivan Morgillo): usada como referência da especificação e para a auditoria.

A interface (layout, ícones, temas, textos) é própria. Os nomes e links dos jogos no catálogo de sugestões
pertencem aos respectivos donos, e cada jogo tem as próprias regras sobre o uso de várias contas.

## Logos dos jogos

Os logos em `src/renderer/assets/games/` são **marcas registradas ou obras dos respectivos jogos** e **não estão
cobertos pela licença MIT** deste repositório. Eles estão ali só para identificar cada jogo no hub, como num
launcher, sem sugerir afiliação ou endosso. Foram reduzidos (WebP, até 480×270) e não foram alterados de outra forma.
Se você é dono de um desses jogos e prefere que o logo seja removido, abra uma issue.
