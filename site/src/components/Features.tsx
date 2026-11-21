import { AnimatePresence, LayoutGroup, animate, motion, useInView, useReducedMotion } from 'motion/react';
import { Activity, Check, Cookie, Keyboard, Languages, Layers, Lock, Moon, Palette, Plus, Search, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGS, useI18n } from '../i18n';
import { THEME_NAMES, themeColors, useTheme } from '../theme';
import { GAMES } from './AppMock';
import { Card, ReplayScope, Reveal, SectionHead } from './ui';

function CardHead({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mb-5">
      <span className="mb-4 grid size-10 place-items-center rounded-2xl bg-secondary-container text-on-secondary-container">{icon}</span>
      <h3 className="text-xl font-semibold tracking-tight text-on-surface">{title}</h3>
      <p className="mt-1.5 text-pretty text-on-surface-variant">{text}</p>
    </div>
  );
}

/* ---------- Espaco misto: clique nas contas e a previa se monta ---------- */
const MIX_ACCOUNTS = [
  { id: 'r1', name: 'Principal', game: 'reino' }, { id: 'r2', name: 'Farm 01', game: 'reino' }, { id: 'r3', name: 'Farm 02', game: 'reino' },
  { id: 'm1', name: 'Conta 1', game: 'minas' }, { id: 'm2', name: 'Conta 2', game: 'minas' },
  { id: 'f1', name: 'Main', game: 'forja' }, { id: 'f2', name: 'Ferreiro', game: 'forja' }
] as const;
const GAME_DOT: Record<string, string> = { reino: 'bg-[#8bc34a]', minas: 'bg-[#4fc3f7]', forja: 'bg-[#ff8a50]' };

function MixDemo() {
  const { t } = useI18n();
  const [picked, setPicked] = useState<string[]>(['r1', 'm1', 'f1']);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 6 ? p : [...p, id]));
  const cols = picked.length <= 1 ? 1 : picked.length <= 4 ? 2 : 3;
  return (
    <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-3">
        {(Object.keys(GAMES) as (keyof typeof GAMES)[]).map((g) => (
          <div key={g}>
            <div className="mb-1.5 flex items-center gap-2 text-xs text-on-surface-variant"><span className={`size-2 rounded-full ${GAME_DOT[g]}`} />{GAMES[g].name}</div>
            <div className="flex flex-wrap gap-1.5">
              {MIX_ACCOUNTS.filter((a) => a.game === g).map((a) => {
                const i = picked.indexOf(a.id);
                return (
                  <motion.button key={a.id} whileTap={{ scale: 0.94 }} onClick={() => toggle(a.id)} aria-pressed={i >= 0}
                    className={`state flex h-9 items-center gap-2 rounded-lg border pl-1.5 pr-3 text-sm transition-colors ${i >= 0 ? 'border-transparent bg-secondary-container text-on-secondary-container' : 'border-outline-variant text-on-surface-variant'}`}>
                    <span className={`grid size-6 place-items-center rounded-full text-xs ${i >= 0 ? 'bg-primary text-on-primary' : 'bg-s3'}`}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{i >= 0 ? i + 1 : <Plus className="size-3.5" />}</motion.span>
                      </AnimatePresence>
                    </span>
                    {a.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-on-surface tabular-nums">{picked.length} {t('mixPanels')}</span>
          <button onClick={() => setPicked([])} className="state rounded-full px-3 py-1 text-primary">{t('mixClear')}</button>
        </div>
        <div className="dots relative min-h-64 flex-1 rounded-2xl border border-outline-variant/60 bg-s0 p-2">
          <LayoutGroup>
            <div className="grid h-full gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: '1fr' }}>
              <AnimatePresence mode="popLayout">
                {picked.map((id, i) => {
                  const a = MIX_ACCOUNTS.find((x) => x.id === id)!;
                  return (
                    <motion.div key={id} layout initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      className={`relative flex flex-col justify-end overflow-hidden rounded-xl bg-gradient-to-b ${GAMES[a.game].hue} p-2 text-[#f3e9d2]`}>
                      <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-[10px] text-on-primary">{i + 1}</span>
                      <span className="text-xs font-semibold">{a.name}</span>
                      <span className="text-[10px] opacity-75">{GAMES[a.game].name}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

/* ---------- Sessoes isoladas: cada conta com o proprio "pote" de cookies ---------- */
function SessionsDemo() {
  const names = ['Principal', 'Farm 01', 'Alt'];
  return (
    <div className="mt-auto flex h-40 items-end justify-center gap-2">
      {names.map((n, i) => (
        <motion.div key={n}
          className="w-[30%] max-w-32 rounded-2xl border border-outline-variant/70 bg-s3 p-3 shadow-xl shadow-black/20"
          style={{ rotate: (i - 1) * 5, y: i === 1 ? -10 : 0 }}
          whileHover={{ y: -8 }}>
          <div className="flex items-center justify-between text-xs text-on-surface-variant"><span>{n}</span><Lock className="size-3.5 text-primary" /></div>
          <div className="mt-3 flex gap-1">{[0, 1, 2].map((k) => <Cookie key={k} className="size-4 text-tertiary" />)}</div>
          <div className="mt-2 font-mono text-[10px] text-on-surface-variant">acc-{['a1f', '7c2', 'e90'][i]}</div>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Monitor: grafico ao vivo ---------- */
function MonitorDemo() {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [a, setA] = useState(() => Array.from({ length: 32 }, (_, i) => 38 + Math.sin(i / 3) * 10));
  const [b, setB] = useState(() => Array.from({ length: 32 }, (_, i) => 14 + Math.cos(i / 4) * 4));
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setA((p) => [...p.slice(1), Math.max(10, Math.min(90, p[p.length - 1] + (Math.random() - 0.5) * 14))]);
      setB((p) => [...p.slice(1), Math.max(4, Math.min(40, p[p.length - 1] + (Math.random() - 0.5) * 6))]);
    }, 800);
    return () => clearInterval(id);
  }, [inView]);
  const path = (v: number[]) => v.map((y, i) => `${(i / (v.length - 1)) * 300},${100 - y}`).join(' ');
  return (
    <div ref={ref}>
      <div className="mb-3 flex gap-6">
        <div><div className="text-3xl font-semibold tabular-nums text-on-surface">{Math.round(a[a.length - 1])}<span className="text-base text-on-surface-variant">%</span></div><div className="flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="h-0.5 w-3 rounded bg-primary" />{t('monMachine')}</div></div>
        <div><div className="text-3xl font-semibold tabular-nums text-on-surface">{Math.round(b[b.length - 1])}<span className="text-base text-on-surface-variant">%</span></div><div className="flex items-center gap-1.5 text-xs text-on-surface-variant"><span className="h-0.5 w-3 rounded bg-tertiary" />{t('monApp')}</div></div>
      </div>
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="h-28 w-full overflow-visible">
        {[25, 50, 75].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="var(--md-outline-variant)" strokeOpacity=".5" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />)}
        <polygon points={`0,100 ${path(a)} 300,100`} fill="color-mix(in srgb, var(--md-primary) 18%, transparent)" />
        <polyline points={path(a)} fill="none" stroke="var(--md-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        <polyline points={path(b)} fill="none" stroke="var(--md-tertiary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ---------- Hibernar: interruptores que mudam o uso de CPU ---------- */
function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 0.6, ease: [0.2, 0, 0, 1], onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(0); } });
    prev.current = value;
    return () => c.stop();
  }, [value]);
  return <span ref={ref}>{value}</span>;
}

function SleepDemo() {
  const { t } = useI18n();
  const [sleeping, setSleeping] = useState<boolean[]>([false, true, false]);
  const cpu = 6 + sleeping.reduce((s, z, i) => s + (z ? 0 : [11, 9, 7][i]), 0);
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums text-on-surface"><Counter value={cpu} />%</span><span className="text-sm text-on-surface-variant">CPU</span></div>
      <div className="flex flex-col gap-2">
        {['Principal', 'Farm 01', 'Alt'].map((n, i) => (
          <div key={n} className="flex items-center gap-3 rounded-xl bg-s2 px-3 py-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={String(sleeping[i])} initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.2 }}>
                {sleeping[i] ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-tertiary" />}
              </motion.span>
            </AnimatePresence>
            <span className="flex-1 text-sm text-on-surface">{n}<span className="ml-2 text-xs text-on-surface-variant">{sleeping[i] ? t('sleepAsleep') : t('sleepAwake')}</span></span>
            <button role="switch" aria-checked={!sleeping[i]} aria-label={`${t('sleepToggle')}: ${n}`}
              onClick={() => setSleeping((s) => s.map((z, k) => (k === i ? !z : z)))}
              className={`relative h-7 w-12 rounded-full border-2 transition-colors ${sleeping[i] ? 'border-outline bg-s4' : 'border-primary bg-primary'}`}>
              <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                className={`absolute top-1/2 -translate-y-1/2 rounded-full ${sleeping[i] ? 'left-1 size-3.5 bg-outline' : 'right-1 size-5 bg-on-primary'}`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Temas: recolorem o site ---------- */
function ThemeDemo() {
  const { theme, mode, setTheme, setMode } = useTheme();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2.5">
        {THEME_NAMES.map((name) => {
          const c = themeColors(name, 'light');
          return (
            <motion.button key={name} whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }} aria-label={name} aria-pressed={theme === name}
              onClick={(e) => setTheme(name, { x: e.clientX, y: e.clientY })}
              className={`size-11 rounded-full border border-outline-variant ${theme === name ? 'ring-[3px] ring-primary ring-offset-2 ring-offset-s1' : ''}`}
              style={{ background: `conic-gradient(${c['primary']} 0 50%, ${c['primary-container']} 0 100%)` }} />
          );
        })}
      </div>
      <div className="flex w-fit rounded-full border border-outline-variant p-0.5">
        {(['light', 'dark'] as const).map((m) => (
          <button key={m} onClick={(e) => setMode(m, { x: e.clientX, y: e.clientY })} aria-pressed={mode === m}
            className="state relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm text-on-surface">
            {mode === m && <motion.span layoutId="theme-mode" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" />}
            {m === 'light' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Idiomas ---------- */
function LangDemo() {
  const { lang, setLang } = useI18n();
  const hello = { pt: 'Olá!', en: 'Hello!', es: '¡Hola!' }[lang];
  return (
    <div className="flex items-center justify-between gap-4">
      <AnimatePresence mode="wait">
        <motion.span key={lang} initial={{ y: 20, opacity: 0, filter: 'blur(6px)' }} animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }} exit={{ y: -20, opacity: 0, filter: 'blur(6px)' }}
          className="display text-4xl font-semibold text-primary">{hello}</motion.span>
      </AnimatePresence>
      <div className="flex rounded-full border border-outline-variant p-0.5">
        {LANGS.map((l) => (
          <button key={l.id} onClick={() => setLang(l.id)} aria-pressed={lang === l.id} className="state relative rounded-full px-3 py-1.5 font-mono text-xs text-on-surface">
            {lang === l.id && <motion.span layoutId="lang-demo" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" />}
            {l.short}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Hub: digita um link sozinho e vira um jogo ---------- */
function HubDemo() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const target = 'meujogo.com/play';
  const [typed, setTyped] = useState(reduce ? target : '');
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!inView || reduce) return;
    let i = 0, timer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (i <= target.length) { setTyped(target.slice(0, i++)); timer = setTimeout(step, 90); }
      else { timer = setTimeout(() => { setAdded(true); timer = setTimeout(() => { setAdded(false); i = 0; step(); }, 2200); }, 900); }
    };
    step();
    return () => clearTimeout(timer);
  }, [inView, reduce]);
  const show = typed.includes('.');
  return (
    <div ref={ref} className="flex flex-col gap-3">
      <div className="flex h-12 items-center gap-3 rounded-full bg-s3 px-4 text-on-surface">
        <Search className="size-4 text-on-surface-variant" />
        <span className="font-mono text-sm">{typed}<motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="ml-px inline-block h-4 w-0.5 translate-y-0.5 bg-primary" /></span>
      </div>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 overflow-hidden rounded-2xl bg-secondary-container p-3 text-on-secondary-container">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-on-primary">MJ</span>
            <div className="min-w-0 flex-1"><div className="text-xs opacity-80">{t('hubCustom')}</div><div className="truncate font-semibold">Meujogo</div></div>
            <motion.span layout className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium ${added ? 'bg-[#76daa1] text-[#003920]' : 'bg-primary text-on-primary'}`}>
              {added ? <Check className="size-4" /> : <Plus className="size-4" />}{t('hubAdd')}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Atalhos: acendem ao apertar ---------- */
const KEYS = [
  { combo: ['Ctrl', 'B'], test: (e: KeyboardEvent) => e.ctrlKey && e.key.toLowerCase() === 'b', label: 'keyDrawer' },
  { combo: ['Ctrl', 'M'], test: (e: KeyboardEvent) => e.ctrlKey && e.key.toLowerCase() === 'm', label: 'keyMute' },
  { combo: ['F11'], test: (e: KeyboardEvent) => e.key === 'F11', label: 'keyFull' },
  { combo: ['Ctrl', '1…9'], test: (e: KeyboardEvent) => e.ctrlKey && /^[1-9]$/.test(e.key), label: 'keyFocus' }
] as const;

function KeysDemo() {
  const { t } = useI18n();
  const [lit, setLit] = useState<number | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const on = (e: KeyboardEvent) => {
      const i = KEYS.findIndex((k) => k.test(e));
      if (i < 0) return;
      if (i !== 2) e.preventDefault(); // F11 continua funcionando no navegador
      setLit(i); clearTimeout(timer); timer = setTimeout(() => setLit(null), 700);
    };
    window.addEventListener('keydown', on);
    return () => { window.removeEventListener('keydown', on); clearTimeout(timer); };
  }, []);
  return (
    <div className="grid grid-cols-2 gap-2">
      {KEYS.map((k, i) => (
        <motion.button key={i} onClick={() => { setLit(i); setTimeout(() => setLit(null), 600); }}
          animate={lit === i ? { scale: [1, 0.94, 1.03, 1] } : {}}
          className={`flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors ${lit === i ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant/70 bg-s2 text-on-surface'}`}>
          <span className="flex gap-1">
            {k.combo.map((c) => <kbd key={c} className={`rounded-md border-b-2 px-2 py-0.5 font-mono text-xs ${lit === i ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-s4'}`}>{c}</kbd>)}
          </span>
          <span className="text-xs opacity-80">{t(k.label)}</span>
        </motion.button>
      ))}
    </div>
  );
}

export function Features() {
  const { t } = useI18n();
  return (
    <ReplayScope id="recursos">
    <section id="recursos" className="relative mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
      <SectionHead kicker={t('featKicker')} title={t('featTitle')} sub={t('featSub')} />
      <div className="grid gap-4 md:grid-cols-6 [&>*]:min-w-0">
        <Reveal className="md:col-span-4 md:row-span-2"><Card className="h-full"><CardHead icon={<Layers className="size-5" />} title={t('mixTitle')} text={t('mixText')} /><MixDemo /></Card></Reveal>
        <Reveal className="md:col-span-2" delay={0.05}><Card className="h-full"><CardHead icon={<Lock className="size-5" />} title={t('sessTitle')} text={t('sessText')} /><SessionsDemo /></Card></Reveal>
        <Reveal className="md:col-span-2" delay={0.1}><Card className="h-full"><CardHead icon={<Activity className="size-5" />} title={t('monTitle')} text={t('monText')} /><MonitorDemo /></Card></Reveal>
        <Reveal className="md:col-span-2"><Card className="h-full"><CardHead icon={<Moon className="size-5" />} title={t('sleepTitle')} text={t('sleepText')} /><SleepDemo /></Card></Reveal>
        <Reveal className="md:col-span-2" delay={0.05}><Card className="h-full"><CardHead icon={<Palette className="size-5" />} title={t('themeTitle')} text={t('themeText')} /><ThemeDemo /></Card></Reveal>
        <Reveal className="md:col-span-2" delay={0.1}><Card className="h-full"><CardHead icon={<Languages className="size-5" />} title={t('langTitle')} text={t('langText')} /><LangDemo /></Card></Reveal>
        <Reveal className="md:col-span-3"><Card className="h-full"><CardHead icon={<Search className="size-5" />} title={t('hubTitle')} text={t('hubText')} /><HubDemo /></Card></Reveal>
        <Reveal className="md:col-span-3" delay={0.05}><Card className="h-full"><CardHead icon={<Keyboard className="size-5" />} title={t('keysTitle')} text={t('keysText')} /><KeysDemo /></Card></Reveal>
      </div>
    </section>
    </ReplayScope>
  );
}
