import { AnimatePresence, motion, useInView } from 'motion/react';
import { Clapperboard, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { base } from '../links';
import { VIDEOS, type Video } from '../videos';
import { Mark, Reveal, SectionHead } from './ui';

// Quadro 16:9: o video quando existir; senao, um placeholder animado com o nome do recurso.
function Frame({ video }: { video: Video }) {
  const { t } = useI18n();
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  useEffect(() => {
    const v = ref.current; if (!v) return;
    if (inView) v.play().catch(() => {}); else v.pause();
  }, [inView, video.src]);

  if (video.src) {
    return (
      <video ref={ref} key={video.src} className="h-full w-full object-cover" src={`${base}videos/${video.src}`}
        poster={video.poster ? `${base}videos/${video.poster}` : undefined} muted loop playsInline preload="metadata" aria-label={t(video.title)} />
    );
  }
  return (
    <div className="dots relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-s0 text-center">
      <motion.div aria-hidden className="absolute inset-0"
        style={{ background: 'linear-gradient(110deg, transparent 30%, color-mix(in srgb, var(--md-primary) 10%, transparent) 50%, transparent 70%)' }}
        animate={{ x: ['-100%', '100%'] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }} />
      <div className="absolute left-5 top-5 flex items-center gap-2 font-mono text-xs text-on-surface-variant"><Mark className="size-4" /> IdleHub</div>
      <div className="absolute right-5 top-5 rounded-full border border-outline-variant/70 px-2.5 py-1 font-mono text-[11px] text-on-surface-variant">0:00 / 0:12</div>
      <motion.span className="relative grid size-20 place-items-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/30"
        animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <Play className="ml-1 size-8" fill="currentColor" />
      </motion.span>
      <div className="relative">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-on-surface"><Clapperboard className="size-5 text-primary" />{t('vidSoon')}</div>
        <p className="mt-1 max-w-sm px-4 text-sm text-on-surface-variant">{t('vidSoonText')}</p>
      </div>
      <div className="absolute inset-x-5 bottom-5 h-1 overflow-hidden rounded-full bg-s3">
        <motion.div className="h-full w-1/3 rounded-full bg-primary/60" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
      </div>
    </div>
  );
}

export function Videos() {
  const { t } = useI18n();
  const [active, setActive] = useState(VIDEOS[0].id);
  const video = VIDEOS.find((v) => v.id === active)!;
  return (
    <section id="videos" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
      <SectionHead kicker={t('scrKicker')} title={t('scrTitle')} sub={t('scrSub')} />
      <Reveal>
        <div role="tablist" aria-label={t('scrKicker')} className="no-scrollbar mx-auto mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-outline-variant/70 bg-s1 p-1">
          {VIDEOS.map((v) => (
            <button key={v.id} role="tab" aria-selected={active === v.id} onClick={() => setActive(v.id)}
              className={`state relative shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${active === v.id ? 'text-on-secondary-container' : 'text-on-surface-variant'}`}>
              {active === v.id && <motion.span layoutId="video-tab" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" transition={{ type: 'spring', stiffness: 450, damping: 36 }} />}
              {t(v.title)}
            </button>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/70 bg-s1 p-2 shadow-2xl shadow-black/20 sm:rounded-[32px] sm:p-3">
          <div className="relative aspect-video overflow-hidden rounded-xl sm:rounded-[24px]">
            <AnimatePresence mode="wait">
              <motion.div key={video.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}>
                <Frame video={video} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={video.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-5 text-center text-on-surface-variant">
            <span className="font-medium text-on-surface">{t(video.title)}.</span> {t(video.text)}
          </motion.p>
        </AnimatePresence>
      </Reveal>
    </section>
  );
}
