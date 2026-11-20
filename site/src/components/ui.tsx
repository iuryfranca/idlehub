import { motion, useAnimationControls, useInView, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react';

// ---------- "Replay": refaz as animacoes de uma secao ----------
// Os links do menu disparam replay('privacidade') etc.; a secao (ReplayScope) incrementa um contador e
// tudo dentro dela que anima (Reveal, contadores, checklist) roda de novo, sem desmontar as demonstracoes.
const REPLAY_EVENT = 'idlehub:replay';
export const replay = (id: string) => window.dispatchEvent(new CustomEvent(REPLAY_EVENT, { detail: id }));
const ReplayCtx = createContext(0);
export const useReplayTick = () => useContext(ReplayCtx);

export function ReplayScope({ id, children }: { id: string; children: ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === id) setTick((n) => n + 1); };
    window.addEventListener(REPLAY_EVENT, on);
    return () => window.removeEventListener(REPLAY_EVENT, on);
  }, [id]);
  return <ReplayCtx.Provider value={tick}>{children}</ReplayCtx.Provider>;
}

// Surge ao entrar na tela (toda vez que entra, nao so na primeira): sobe um pouco e sai do desfoque.
// Num replay da secao, volta ao estado escondido e anima de novo quando estiver visivel.
export function Reveal({ children, delay = 0, y = 24, className, ...rest }: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-80px' });
  const controls = useAnimationControls();
  const tick = useReplayTick();
  const hidden = { opacity: 0, y, filter: 'blur(10px)' };
  const shown = { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, delay, ease: [0.05, 0.7, 0.1, 1] as const } };
  useEffect(() => {
    if (reduce) { controls.set(shown); return; }
    if (inView) controls.start(shown); else controls.set(hidden);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);
  useEffect(() => {
    if (!tick || reduce) return;
    controls.set(hidden);
    // o menu rola suavemente ate a secao: se ja estiver visivel, anima logo; senao, o efeito acima anima ao chegar
    if (inView) requestAnimationFrame(() => controls.start(shown));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  return (
    <motion.div ref={ref} className={className} initial={reduce ? false : hidden} animate={controls} {...rest}>
      {children}
    </motion.div>
  );
}

// Cartao do mosaico: M3 (cantos de 28 px, superficie em camadas) com um brilho que segue o mouse.
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={move}
      className={`group relative overflow-hidden rounded-xl border border-outline-variant/60 bg-s1 p-6 transition-colors duration-300 hover:border-outline-variant ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'radial-gradient(420px circle at var(--mx) var(--my), color-mix(in srgb, var(--md-primary) 12%, transparent), transparent 60%)' }}
      />
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-s1/70 px-3 py-1 font-mono text-xs uppercase tracking-[0.14em] text-primary backdrop-blur">
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

export function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <Reveal className="mx-auto mb-14 max-w-3xl text-center">
      <Kicker>{kicker}</Kicker>
      <h2 className="display mt-5 text-balance text-4xl font-semibold sm:text-5xl md:text-6xl">{title}</h2>
      {sub && <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-on-surface-variant">{sub}</p>}
    </Reveal>
  );
}

// Marca do IdleHub (a mesma do icone do app): 4 paineis, diagonais na cor do tema.
export function Mark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="2" width="12" height="12" rx="3.5" fill="var(--md-primary)" />
      <rect x="18" y="2" width="12" height="12" rx="3.5" fill="var(--md-outline-variant)" />
      <rect x="2" y="18" width="12" height="12" rx="3.5" fill="var(--md-outline-variant)" />
      <rect x="18" y="18" width="12" height="12" rx="3.5" fill="var(--md-tertiary)" />
    </svg>
  );
}

// Marca do Windows desenhada (sem logos de terceiros como arquivo).
export function WindowsGlyph({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
      <rect x="1" y="1" width="6.5" height="6.5" rx="0.6" /><rect x="8.5" y="1" width="6.5" height="6.5" rx="0.6" />
      <rect x="1" y="8.5" width="6.5" height="6.5" rx="0.6" /><rect x="8.5" y="8.5" width="6.5" height="6.5" rx="0.6" />
    </svg>
  );
}

// Marca do GitHub (Octicons "mark-github", MIT), para os links do repositorio.
export function Github({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
