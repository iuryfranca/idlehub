import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { Expand, LayoutGrid, Minus, Moon, PanelLeft, RotateCw, Square, Star, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { Mark } from './ui';

// Replica viva do IdleHub (nao e captura): jogos ficticios "rodando" em cada painel.
type Acc = { id: string; name: string; game: string; sleep?: boolean };
type Space = { id: string; name: string; kind: 'game' | 'mix'; accounts: Acc[] };

export const GAMES = {
  reino: { name: 'Reino Ocioso', hue: 'from-[#2c3a1c] to-[#121a0b]', foe: ['Slime Ancestral', 'Lobo de Névoa', 'Golem de Âmbar', 'Wyrm Gélido'], blob: 'from-[#c6f07a] to-[#3f7a1f]' },
  minas: { name: 'Minas de Cristal', hue: 'from-[#1c2a3e] to-[#0b111c]', foe: ['Verme de Cristal', 'Morcego Prisma'], blob: 'from-[#9be7ff] to-[#2a6f9e]' },
  forja: { name: 'Forja Estelar', hue: 'from-[#3e2418] to-[#1a0e08]', foe: ['Brasa Errante', 'Autômato', 'Fênix Jovem'], blob: 'from-[#ffc58a] to-[#b2491f]' }
} as const;
type GameId = keyof typeof GAMES;

const SPACES: Space[] = [
  { id: 'reino', name: 'Reino Ocioso', kind: 'game', accounts: [
    { id: 'r1', name: 'Principal', game: 'reino' }, { id: 'r2', name: 'Farm 01', game: 'reino' },
    { id: 'r3', name: 'Farm 02', game: 'reino' }, { id: 'r4', name: 'Alt', game: 'reino', sleep: true }] },
  { id: 'minas', name: 'Minas de Cristal', kind: 'game', accounts: [
    { id: 'm1', name: 'Conta 1', game: 'minas' }, { id: 'm2', name: 'Conta 2', game: 'minas' }] },
  { id: 'forja', name: 'Forja Estelar', kind: 'game', accounts: [
    { id: 'f1', name: 'Main', game: 'forja' }, { id: 'f2', name: 'Ferreiro', game: 'forja' }, { id: 'f3', name: 'Mineiro', game: 'forja' }] },
  { id: 'mix', name: 'Farm da noite', kind: 'mix', accounts: [
    { id: 'r1', name: 'Principal', game: 'reino' }, { id: 'm1', name: 'Conta 1', game: 'minas' },
    { id: 'f1', name: 'Main', game: 'forja' }, { id: 'r2', name: 'Farm 01', game: 'reino' }] }
];

const mono = (s: string) => s.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const seedOf = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);

function GamePanel({ acc, tick, index, featured, mixed }: { acc: Acc; tick: number; index: number; featured: boolean; mixed: boolean }) {
  const { t } = useI18n();
  const g = GAMES[acc.game as GameId];
  const s = seedOf(acc.id);
  const cycle = 14 + (s % 6);
  const phase = (tick + s) % cycle;
  const hp = Math.max(0, 100 - (phase / (cycle - 1)) * 100);
  const foe = g.foe[Math.floor((tick + s) / cycle) % g.foe.length];
  const gold = (((s * 37) % 900) + tick * (3 + (s % 5))) / 10;
  const level = 8 + (s % 30) + Math.floor(tick / 40);
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-md border ${featured ? 'border-primary' : 'border-outline-variant/70'} bg-s1`}>
      <div className="flex h-7 shrink-0 items-center gap-1.5 px-2 text-[10px] text-on-surface">
        <span className={`grid size-4 place-items-center rounded-full text-[8px] ${featured ? 'bg-primary text-on-primary' : 'bg-s4 text-on-surface-variant'}`}>{index + 1}</span>
        <span className={`size-1.5 rounded-full ${acc.sleep ? 'bg-outline' : 'bg-[#76daa1]'}`} />
        <span className="truncate font-medium">{acc.name}</span>
        {mixed && <span className="truncate rounded-sm bg-tertiary-container px-1 text-[9px] text-on-tertiary-container">{g.name}</span>}
        <span className="ml-auto hidden items-center gap-1.5 text-on-surface-variant sm:flex">
          <Star className="size-2.5" /><Volume2 className="size-2.5" /><RotateCw className="size-2.5" /><Expand className="size-2.5" />
        </span>
      </div>
      {acc.sleep ? (
        <div className="m-1 mt-0 flex flex-1 flex-col items-center justify-center gap-1 rounded-sm bg-s2 text-on-surface-variant">
          <Moon className="size-5 text-primary" />
          <span className="text-[10px] font-medium text-on-surface">{t('mockHibernated')}</span>
        </div>
      ) : (
        <div className={`relative m-1 mt-0 flex flex-1 flex-col justify-between overflow-hidden rounded-sm bg-gradient-to-b ${g.hue} p-2 font-serif text-[#f3e9d2]`}>
          <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.14em] text-[#c9b98a]">
            <span className="truncate">{g.name}</span>
            <span className="rounded-full border border-[#6b5a33] bg-black/40 px-1.5 py-px font-sans font-bold normal-case tracking-normal text-[#ffd77a] tabular-nums">● {gold.toFixed(1)} K</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <motion.div
              key={foe}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
              transition={{ scale: { type: 'spring', stiffness: 380, damping: 18 }, y: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }}
              className={`h-7 w-9 rounded-[50%_50%_44%_44%] bg-gradient-to-br ${g.blob} shadow-[0_8px_14px_rgba(0,0,0,.5)]`}
            />
            <span className="truncate text-[10px] font-bold">{foe}</span>
            <div className="h-1.5 w-3/4 overflow-hidden rounded-full border border-[#6b5a33] bg-black/50">
              <div className="h-full bg-gradient-to-r from-[#d94b3b] to-[#f08a4b] transition-[width] duration-500 ease-linear" style={{ width: `${hp}%` }} />
            </div>
          </div>
          <div className="flex gap-1 font-sans text-[8px]">
            <div className="flex-1 rounded-sm border border-[#6b5a33] bg-black/40 px-1 py-0.5">{t('mockLevel')} <b className="block text-[10px] text-[#ffd77a]">{level}</b></div>
            <div className="flex-1 rounded-sm border border-[#6b5a33] bg-black/40 px-1 py-0.5">DPS <b className="block text-[10px] text-[#ffd77a]">{level * 113}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Posicao de cada painel na grade (Grade) ou com um grande a esquerda (Destaque).
function gridStyle(n: number, featured: boolean) {
  if (featured && n > 1) return { gridTemplateColumns: '2fr 1fr', gridTemplateRows: `repeat(${n - 1}, minmax(0, 1fr))` };
  const cols = n <= 1 ? 1 : n <= 4 ? 2 : 3;
  return { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(n / cols)}, minmax(0, 1fr))` };
}

export function AppMock() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [spaceId, setSpaceId] = useState('reino');
  const [featured, setFeatured] = useState(false);
  const [tick, setTick] = useState(0);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);
  const space = SPACES.find((s) => s.id === spaceId)!;

  // relogio dos jogos (pausa fora da tela)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; });
    io.observe(root.current!);
    const id = setInterval(() => { if (visible.current && !reduce) setTick((n) => n + 1); }, 650);
    return () => { clearInterval(id); io.disconnect(); };
  }, [reduce]);

  // demonstracao automatica ate a pessoa interagir
  useEffect(() => {
    if (!auto || reduce) return;
    const steps: [string, boolean][] = [['reino', false], ['reino', true], ['mix', false], ['forja', false], ['forja', true], ['minas', false]];
    let i = 0;
    const id = setInterval(() => {
      if (!visible.current) return;
      i = (i + 1) % steps.length;
      setSpaceId(steps[i][0]); setFeatured(steps[i][1]);
    }, 3600);
    return () => clearInterval(id);
  }, [auto, reduce]);

  const stopAuto = () => setAuto(false);
  const n = space.accounts.length;

  return (
    <div ref={root} onPointerDown={stopAuto} className="relative overflow-hidden rounded-[22px] border border-outline-variant/80 bg-surface shadow-[0_40px_120px_-30px_rgba(0,0,0,.65)]">
      {/* barra de titulo do Windows */}
      <div className="flex h-8 items-center gap-2 border-b border-outline-variant/50 bg-s0 px-3 text-[11px] text-on-surface-variant">
        <Mark className="size-3.5" /><span>IdleHub</span>
        <span className="ml-auto flex items-center gap-4"><Minus className="size-3" /><Square className="size-2.5" /><X className="size-3" /></span>
      </div>
      <div className="flex h-[340px] sm:h-[440px] lg:h-[520px]">
        {/* lateral */}
        <aside className="hidden w-48 shrink-0 flex-col gap-1 bg-s1 p-2.5 text-[11px] md:flex">
          <div className="mb-1 flex items-center gap-2 px-1.5 py-1 text-sm font-medium text-on-surface"><PanelLeft className="size-3.5 text-on-surface-variant" /> IdleHub</div>
          <div className="mb-2 flex h-9 w-fit items-center gap-2 rounded-lg bg-primary-container px-3 font-medium text-on-primary-container shadow-sm">+ <span>{t('mockAddGame')}</span></div>
          <div className="px-2 pb-1 pt-2 text-[10px] font-medium text-on-surface-variant">{t('mockGames')}</div>
          {SPACES.filter((s) => s.kind === 'game').map((s) => (
            <SideItem key={s.id} active={spaceId === s.id} onClick={() => { setSpaceId(s.id); stopAuto(); }} label={s.name} count={s.accounts.length}
              tile={<span className="grid size-5 place-items-center rounded-full bg-s4 text-[8px] font-semibold text-on-surface">{mono(s.name)}</span>} />
          ))}
          <div className="px-2 pb-1 pt-3 text-[10px] font-medium text-on-surface-variant">{t('mockMixes')}</div>
          {SPACES.filter((s) => s.kind === 'mix').map((s) => (
            <SideItem key={s.id} active={spaceId === s.id} onClick={() => { setSpaceId(s.id); stopAuto(); }} label={s.name} count={s.accounts.length}
              tile={<span className="grid size-5 grid-cols-2 gap-px rounded-[5px] bg-tertiary-container p-[3px]">{[0, 1, 2, 3].map((i) => <i key={i} className="rounded-[1px] bg-surface" />)}</span>} />
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* barra superior */}
          <div className="flex h-11 shrink-0 items-center gap-3 px-3">
            <div className="min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={space.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <div className="truncate text-sm text-on-surface">{space.name}</div>
                  <div className="truncate text-[10px] text-on-surface-variant">{n} {t('mockAccounts')}</div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div role="radiogroup" className="ml-auto flex rounded-full border border-outline-variant p-0.5 text-[11px]">
              {[false, true].map((f) => (
                <button key={String(f)} role="radio" aria-checked={featured === f} onClick={() => { setFeatured(f); stopAuto(); }}
                  className="state relative flex items-center gap-1 rounded-full px-3 py-1 text-on-surface">
                  {featured === f && <motion.span layoutId="mock-seg" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                  {f ? <Star className="size-3" /> : <LayoutGrid className="size-3" />}
                  <span className="hidden sm:inline">{f ? t('mockFeatured') : t('mockGrid')}</span>
                </button>
              ))}
            </div>
          </div>
          {/* paineis */}
          <LayoutGroup>
            <div className="grid min-h-0 flex-1 gap-1.5 p-1.5 pt-0" style={gridStyle(n, featured)}>
              <AnimatePresence mode="popLayout" initial={false}>
                {space.accounts.map((acc, i) => (
                  <motion.div
                    key={space.id + acc.id}
                    layout={!reduce}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    className="min-h-0"
                    style={featured && n > 1 && i === 0 ? { gridRow: `1 / span ${n - 1}` } : undefined}
                  >
                    <GamePanel acc={acc} tick={tick} index={i} featured={featured && i === 0 && n > 1} mixed={space.kind === 'mix'} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </div>
  );
}

function SideItem({ active, onClick, label, count, tile }: { active: boolean; onClick: () => void; label: string; count: number; tile: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`state relative flex h-9 items-center gap-2 rounded-full px-2 text-left ${active ? 'font-semibold text-on-secondary-container' : 'text-on-surface-variant'}`}>
      {active && <motion.span layoutId="mock-nav" className="absolute inset-0 -z-10 rounded-full bg-secondary-container" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
      {tile}
      <span className="flex-1 truncate">{label}</span>
      <span className="text-[10px]">{count}</span>
    </button>
  );
}
