# webpage — página de apresentação do IdleHub

Site estático de uma página só (`index.html` + `styles.css`), feito para o GitHub Pages.

- **Visual:** noturno com faixa de luz (aurora) e grade de pontinhos, cards bem arredondados, cores do tema
  Aurora escuro do app (Material 3) e a fonte Roboto Flex.
- **Privacidade igual à do app:** nenhum script, nenhuma fonte, imagem ou serviço de terceiros (sem Google Fonts,
  sem analytics). A política de conteúdo no `<head>` bloqueia qualquer recurso externo.
- **Telas:** `assets/screens/` traz capturas reais do app com uma página de jogo de demonstração (fictícia).
  Para refazer depois de mudar a interface: `npm run screens` na raiz do repositório.

## Antes de publicar

1. Os links já apontam para `https://github.com/iuryfranca/idlehub` (3 em `index.html`).
2. O botão "Baixar para Windows" aponta para `.../releases/latest`: publique um Release com o instalador antes.
3. No GitHub: Settings → Pages → Source "GitHub Actions" (ou "Deploy from a branch" apontando para esta pasta).

## Abrir localmente

Abra `index.html` direto no navegador; não precisa de servidor.
