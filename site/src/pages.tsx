import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { I18nProvider, useI18n } from './i18n';
import { ThemeProvider } from './theme';
import { base, ISSUES, REPO } from './links';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Videos } from './components/Videos';
import { DownloadSection, Footer, PrivacySection } from './components/Closing';

function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><I18nProvider>{children}</I18nProvider></ThemeProvider>;
}

export function Home() {
  return (
    <Providers>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Videos />
        <PrivacySection />
        <DownloadSection />
      </main>
      <Footer />
    </Providers>
  );
}

function PolicyBody() {
  const { t } = useI18n();
  const H = ({ k }: { k: Parameters<typeof t>[0] }) => <h2 className="mt-10 text-xl font-semibold text-on-surface">{t(k)}</h2>;
  const P = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-on-surface-variant">{children}</p>;
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 leading-relaxed">
      <a href={base} className="group mb-8 inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />{t('ppBack')}</a>
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="display text-5xl font-semibold text-on-surface sm:text-6xl">{t('ppTitle')}</motion.h1>
      <p className="mt-4 font-mono text-xs text-on-surface-variant">{t('ppMeta')}</p>
      <div className="mt-8 rounded-xl border border-outline-variant/60 bg-s1 p-6 text-lg text-on-surface"><strong>{t('ppLead')}</strong> <span className="text-on-surface-variant">{t('ppLeadRest')}</span></div>
      <H k="ppLocalTitle" />
      <ul className="mt-3 list-disc space-y-2 pl-6 text-on-surface-variant"><li>{t('ppLocal1')}</li><li>{t('ppLocal2')}</li></ul>
      <P>{t('ppLocalEnd')}</P>
      <H k="ppNetTitle" />
      <ul className="mt-3 list-disc space-y-2 pl-6 text-on-surface-variant"><li>{t('ppNet1')}</li><li>{t('ppNet2')}</li><li>{t('ppNet3')}</li></ul>
      <H k="ppMonTitle" /><P>{t('ppMon')}</P>
      <H k="ppSiteTitle" /><P>{t('ppSite')}</P>
      <H k="ppKidsTitle" /><P>{t('ppKids')}</P>
      <H k="ppContactTitle" /><P>{t('ppContact')} <a className="text-primary underline" href={ISSUES}>{ISSUES.replace('https://', '')}</a> · <a className="text-primary underline" href={REPO}>{REPO.replace('https://', '')}</a></P>
    </main>
  );
}

export function PrivacyPage() {
  return (
    <Providers>
      <Nav home={false} />
      <PolicyBody />
      <Footer />
    </Providers>
  );
}
