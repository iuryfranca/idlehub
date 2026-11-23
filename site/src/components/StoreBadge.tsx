import { useI18n } from '../i18n';
import { STORE, base } from '../links';

// Selo oficial da Microsoft Store (get.microsoft.com), sem alteracoes e hospedado aqui: o site nao carrega nada de terceiros.
// Selo branco no tema escuro, preto no claro.
export function StoreBadge({ className = '' }: { className?: string }) {
  const { lang, t } = useI18n();
  const hl = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }[lang];
  return (
    <a href={`${STORE}?hl=${hl}`} className={`inline-block rounded-md transition-transform hover:-translate-y-0.5 active:scale-[.98] ${className}`}>
      <img src={`${base}store/${lang}-white.svg`} alt={t('storeAlt')} width={205} height={56} className="h-14 w-auto [html[data-mode=light]_&]:hidden" />
      <img src={`${base}store/${lang}-black.svg`} alt={t('storeAlt')} width={205} height={56} className="hidden h-14 w-auto [html[data-mode=light]_&]:block" />
    </a>
  );
}
