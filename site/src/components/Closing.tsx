import { animate, motion, useInView } from 'motion/react';
import { ArrowRight, Check, Copy, Download, ShieldCheck, Store, Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { CLONE, DOWNLOAD, ISSUES, RELEASES, REPO, STORE, STORE_LIVE, base } from '../links';
import { Card, Github, Mark, Reveal, SectionHead, WindowsGlyph } from './ui';

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    // conta de cima para baixo nos zeros (100 -> 0) e de baixo para cima no resto: o zero "chega" com movimento
    const from = to === 0 ? 100 : 0;
    const c = animate(from, to, { duration: 1.4, ease: [0.2, 0, 0, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; } });
    return () => c.stop();
  }, [inView, to, suffix]);
  return <span ref={ref}>{to}{suffix}</span>;
}

export function PrivacySection() {
  const { t } = useI18n();
  const items = [t('privItem1'), t('privItem2'), t('privItem3'), t('privItem4')];
  return (
    <section id="privacidade" className="relative scroll-mt-24 overflow-hidden py-24">
      <div aria-hidden className="dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4">
        <SectionHead kicker={t('privKicker')} title={t('privTitle')} sub={t('privText')} />
        <div className="grid gap-4 md:grid-cols-4">
          {[[0, '', t('privServers')], [0, '', t('privTrackers')], [0, '', t('privAds')], [100, '%', t('privOpen')]].map(([n, s, label], i) => (
            <Reveal key={label as string} delay={i * 0.06}>
              <div className="rounded-xl border border-outline-variant/60 bg-s1 p-6 text-center">
                <div className="display text-6xl font-semibold text-primary tabular-nums"><CountUp to={n as number} suffix={s as string} /></div>
                <div className="mt-2 text-on-surface-variant">{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-10 max-w-2xl">
          <ul className="flex flex-col gap-3">
            {items.map((it, i) => (
              <motion.li key={it} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.12 }}
                className="flex items-center gap-3 rounded-2xl bg-s1 px-4 py-3 text-on-surface">
                <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.35 + i * 0.12, type: 'spring', stiffness: 500, damping: 18 }}
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-[#76daa1] text-[#003920]"><Check className="size-4" strokeWidth={3} /></motion.span>
                {it}
              </motion.li>
            ))}
          </ul>
          <a href={`${base}privacidade.html`} className="group mx-auto mt-8 flex w-fit items-center gap-2 text-primary">
            <ShieldCheck className="size-4" />{t('privLink')}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function CopyBlock() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(CLONE); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* sem permissao */ }
  };
  return (
    <div className="relative mt-auto rounded-2xl bg-s0 p-4 pt-12 font-mono text-[12.5px] leading-6 text-on-surface">
      <div className="no-scrollbar overflow-x-auto whitespace-pre">{CLONE.split('\n').map((l) => <div key={l}><span className="select-none text-on-surface-variant">$ </span>{l}</div>)}</div>
      <button onClick={copy} className="state absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 font-sans text-xs text-on-surface">
        {done ? <Check className="size-3.5 text-[#76daa1]" /> : <Copy className="size-3.5" />}{done ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

export function DownloadSection() {
  const { t } = useI18n();
  return (
    <section id="baixar" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
      <SectionHead kicker={t('dlKicker')} title={t('dlTitle')} />
      <div className="grid gap-4 md:grid-cols-5">
        <Reveal className="md:col-span-3 md:row-span-2">
          <div className="relative h-full overflow-hidden rounded-xl bg-primary-container p-8 text-on-primary-container">
            <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-primary/25 blur-3xl" />
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary"><WindowsGlyph className="size-5" /></span>
            <h3 className="mt-6 text-3xl font-semibold tracking-tight">{t('dlWinTitle')}</h3>
            <p className="mt-2 max-w-md opacity-85">{t('dlWinText')}</p>
            <a href={DOWNLOAD} className="state group mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-primary px-7 font-medium text-on-primary shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 active:scale-[.98]">
              <Download className="size-5 transition-transform group-hover:translate-y-0.5" />{t('dlWinBtn')}
            </a>
            <p className="mt-6 max-w-md text-sm opacity-75">{t('dlWinNote')}</p>
            <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs">
              {['v0.1.0', 'Windows x64', '~109 MB', 'MIT', 'SHA-256 ✓'].map((c) => <span key={c} className="rounded-full border border-on-primary-container/25 px-3 py-1">{c}</span>)}
            </div>
          </div>
        </Reveal>
        <Reveal className="md:col-span-2" delay={0.06}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-2xl bg-secondary-container text-on-secondary-container"><Store className="size-5" /></span>
              {!STORE_LIVE && <span className="rounded-full bg-tertiary-container px-3 py-1 text-xs font-medium text-on-tertiary-container">{t('dlStoreBadge')}</span>}
            </div>
            <h3 className="mt-4 text-xl font-semibold text-on-surface">{t('dlStoreTitle')}</h3>
            <p className="mt-1 text-on-surface-variant">{t('dlStoreText')}</p>
            {STORE_LIVE && <a href={STORE} className="mt-4 inline-flex items-center gap-2 text-primary">apps.microsoft.com <ArrowRight className="size-4" /></a>}
          </Card>
        </Reveal>
        <Reveal className="md:col-span-2" delay={0.12}>
          <Card className="h-full">
            <span className="grid size-10 place-items-center rounded-2xl bg-secondary-container text-on-secondary-container"><Terminal className="size-5" /></span>
            <h3 className="mt-4 text-xl font-semibold text-on-surface">{t('dlSrcTitle')}</h3>
            <p className="mb-4 mt-1 text-on-surface-variant">{t('dlSrcText')}</p>
            <CopyBlock />
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-outline-variant/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Mark className="size-8" />
          <div><div className="font-semibold text-on-surface">IdleHub</div><div className="text-sm text-on-surface-variant">{t('footMade')}</div></div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-surface-variant">
          <a className="hover:text-on-surface" href={base}>{t('footHome')}</a>
          <a className="hover:text-on-surface" href={`${base}privacidade.html`}>{t('footPrivacy')}</a>
          <a className="hover:text-on-surface" href={RELEASES}>{t('footReleases')}</a>
          <a className="flex items-center gap-1.5 hover:text-on-surface" href={REPO}><Github className="size-4" />GitHub</a>
          <a className="hover:text-on-surface" href={ISSUES}>Issues</a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-10 text-xs text-on-surface-variant">{t('footNote')}</p>
    </footer>
  );
}
