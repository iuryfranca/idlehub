import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Download, Layers, Moon, Cpu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { DOWNLOAD, RELEASES, REPO } from '../links';
import { AppMock } from './AppMock';
import { PixelSky } from './PixelSky';
import { Github, WindowsGlyph } from './ui';

const EASE = [0.05, 0.7, 0.1, 1] as const;

function Words({ text, delay, className = '' }: { text: string; delay: number; className?: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <motion.span key={w + i} className={`inline-block pb-[0.08em] ${className}`}
          initial={{ opacity: 0, y: '0.5em', filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: delay + i * 0.08, ease: EASE }}>
          {w}&nbsp;
        </motion.span>
      ))}
    </>
  );
}

// Grafico pequeno do "Processador", vivo.
function CpuSpark() {
  const [pts, setPts] = useState(() => Array.from({ length: 24 }, (_, i) => 14 + Math.sin(i / 2) * 5));
  useEffect(() => {
    const id = setInterval(() => setPts((p) => [...p.slice(1), Math.max(4, Math.min(30, p[p.length - 1] + (Math.random() - 0.5) * 7))]), 900);
    return () => clearInterval(id);
  }, []);
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * 100},${36 - v}`).join(' ');
  return (
    <div>
      <div className="flex items-baseline gap-1"><span className="text-2xl font-semibold tabular-nums">{Math.round(pts[pts.length - 1])}</span><span className="text-sm text-on-surface-variant">%</span></div>
      <svg viewBox="0 0 100 36" className="mt-1 h-9 w-full" preserveAspectRatio="none">
        <polyline points={`0,36 ${d} 100,36`} fill="color-mix(in srgb, var(--md-primary) 22%, transparent)" stroke="none" />
        <polyline points={d} fill="none" stroke="var(--md-primary)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function Float({ className, delay, children, y }: { className: string; delay: number; children: React.ReactNode; y: ReturnType<typeof useTransform<number, number>> }) {
  const reduce = useReducedMotion();
  return (
    <motion.div style={{ y }} className={`absolute z-20 hidden lg:block ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={reduce ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
        transition={{ opacity: { delay, duration: 0.5 }, scale: { delay, type: 'spring', stiffness: 260, damping: 20 }, y: { delay: delay + 0.5, duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
        className="rounded-2xl border border-outline-variant/70 bg-s2/85 p-3.5 text-on-surface shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const tilt = useSpring(useTransform(scrollYProgress, [0, 0.35], [14, 0]), { stiffness: 120, damping: 24 });
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.35], [0.94, 1]), { stiffness: 120, damping: 24 });
  const floatA = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const floatB = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section id="top" ref={ref} className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
      <div className="absolute inset-x-0 top-0 h-[980px]">
        <PixelSky />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
      </div>

      <div aria-hidden className="absolute left-1/2 top-24 h-[560px] w-[900px] max-w-full -translate-x-1/2 rounded-full bg-surface/70 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <motion.a href={RELEASES} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}
          className="state group inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-s1/70 py-1 pl-1.5 pr-3 text-sm text-on-surface-variant backdrop-blur">
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-on-primary">MIT</span>
          {t('heroChip')}
          <span className="flex items-center gap-1 text-on-surface">{t('heroChipLink')} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
        </motion.a>

        <h1 className="display mx-auto mt-7 max-w-4xl text-balance text-[clamp(2.75rem,8vw,6.25rem)] font-semibold text-on-surface">
          <Words text={t('heroTitleA')} delay={0.1} />
          <br className="hidden sm:block" />
          {/* o degrade vai em cada palavra: a animacao cria uma camada por palavra e o recorte do pai nao chega nela */}
          <Words text={t('heroTitleB')} delay={0.35} className="bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent" />
        </h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-on-surface-variant sm:text-xl">
          {t('heroSub')}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href={DOWNLOAD} className="state group inline-flex h-14 items-center gap-3 rounded-full bg-primary px-7 text-base font-medium text-on-primary shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 active:scale-[.98]">
            <WindowsGlyph className="size-4" /> {t('ctaDownload')} <Download className="size-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <a href={REPO} className="state inline-flex h-14 items-center gap-3 rounded-full border border-outline-variant bg-s1/60 px-7 text-base font-medium text-on-surface backdrop-blur transition-transform hover:-translate-y-0.5 active:scale-[.98]">
            <Github className="size-4" /> {t('ctaCode')}
          </a>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-5 font-mono text-xs tracking-wide text-on-surface-variant">{t('heroMeta')}</motion.p>
      </div>

      <div className="relative mx-auto mt-16 max-w-[1360px] px-4 [perspective:1800px] lg:px-10">
        <Float className="-left-6 top-10 w-52" delay={1.4} y={floatA}>
          <div className="mb-1 flex items-center gap-2 text-xs text-on-surface-variant"><Cpu className="size-3.5" /> {t('floatCpu')} <span className="ml-auto">{t('floatNow')}</span></div>
          <CpuSpark />
        </Float>
        <Float className="-right-8 top-36 w-60" delay={1.7} y={floatB}>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-tertiary-container text-on-tertiary-container"><Layers className="size-4" /></span>
            <div><div className="text-sm font-medium">{t('floatMix')}</div><div className="text-xs text-on-surface-variant">{t('floatMixText')}</div></div>
          </div>
        </Float>
        <Float className="-left-10 bottom-12 w-64" delay={2} y={floatB}>
          <div className="flex items-center gap-3 text-sm">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-container text-on-primary-container"><Moon className="size-4" /></span>
            {t('floatToast')}
          </div>
        </Float>

        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9, ease: EASE }}
          style={{ rotateX: tilt, scale, transformOrigin: 'center top' }}>
          <AppMock />
        </motion.div>
        <p className="mt-4 text-center font-mono text-xs text-on-surface-variant">↑ {t('mockTry')}</p>
      </div>
    </section>
  );
}
