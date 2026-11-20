import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { LANGS, useI18n } from '../i18n';
import { useTheme } from '../theme';
import { REPO, base } from '../links';
import { Github, Mark, replay } from './ui';

export function Nav({ home = true }: { home?: boolean }) {
  const { t, lang, setLang } = useI18n();
  const { mode, setMode } = useTheme();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));
  const link = (hash: string) => (home ? hash : `${base}${hash}`);
  const links = [['#recursos', t('navFeatures')], ['#videos', t('navScreens')], ['#privacidade', t('navPrivacy')]];

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.05, 0.7, 0.1, 1] }}
        className={`flex h-14 w-full max-w-6xl items-center gap-2 rounded-full border px-3 pl-4 transition-[background-color,border-color,box-shadow] duration-300 ${
          scrolled || open ? 'border-outline-variant/70 bg-s1/75 shadow-lg shadow-black/10 backdrop-blur-xl' : 'border-transparent bg-transparent'
        }`}
      >
        <a href={home ? '#top' : base} className="mr-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-on-surface">
          <Mark className="size-6" /> IdleHub
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {links.map(([h, label]) => (
            <a key={h} href={link(h)} onClick={() => home && replay(h.slice(1))} className="state rounded-full px-3 py-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface">{label}</a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <div role="radiogroup" aria-label={t('language')} className="hidden rounded-full border border-outline-variant/70 p-0.5 sm:flex">
            {LANGS.map((l) => (
              <button key={l.id} role="radio" aria-checked={lang === l.id} title={l.label} onClick={() => setLang(l.id)}
                className="state relative rounded-full px-2.5 py-1 font-mono text-xs text-on-surface">
                {lang === l.id && <motion.span layoutId="nav-lang" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
                {l.short}
              </button>
            ))}
          </div>
          <button aria-label={t('toggleMode')} title={t('toggleMode')}
            onClick={(e) => setMode(mode === 'dark' ? 'light' : 'dark', { x: e.clientX, y: e.clientY })}
            className="state grid size-10 place-items-center rounded-full text-on-surface-variant">
            <motion.span key={mode} initial={{ rotate: -90, scale: 0.5, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              {mode === 'dark' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </motion.span>
          </button>
          <a href={REPO} aria-label="GitHub" className="state hidden size-10 place-items-center rounded-full text-on-surface-variant sm:grid"><Github className="size-5" /></a>
          <a href={link('#baixar')} onClick={() => home && replay('baixar')} className="state ml-1 rounded-full bg-on-surface px-4 py-2 text-sm font-medium text-surface transition-transform active:scale-95">{t('navDownload')}</a>
          <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="state grid size-10 place-items-center rounded-full text-on-surface md:hidden">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.nav>
      {/* menu do celular */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-x-3 top-[4.5rem] rounded-xl border border-outline-variant/70 bg-s1/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:hidden">
            {links.map(([h, label]) => (
              <a key={h} href={link(h)} onClick={() => { setOpen(false); if (home) replay(h.slice(1)); }} className="state block rounded-2xl px-4 py-3 text-on-surface">{label}</a>
            ))}
            <a href={REPO} className="state flex items-center gap-2 rounded-2xl px-4 py-3 text-on-surface"><Github className="size-4" /> GitHub</a>
            <div className="mt-2 flex items-center justify-between border-t border-outline-variant/60 px-2 pt-3">
              <span className="text-sm text-on-surface-variant">{t('language')}</span>
              <div className="flex rounded-full border border-outline-variant/70 p-0.5">
                {LANGS.map((l) => (
                  <button key={l.id} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}
                    className={`rounded-full px-3 py-1.5 font-mono text-xs ${lang === l.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface'}`}>{l.short}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
