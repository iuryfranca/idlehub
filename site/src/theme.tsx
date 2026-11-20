import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import THEMES from './themes.json';

export type ThemeName = keyof typeof THEMES;
export type Mode = 'dark' | 'light';
export const THEME_NAMES = Object.keys(THEMES) as ThemeName[];
export const themeSeed = (name: ThemeName) => THEMES[name].seed;
export const themeColors = (name: ThemeName, mode: Mode) => THEMES[name][mode] as Record<string, string>;

function apply(name: ThemeName, mode: Mode) {
  const root = document.documentElement;
  for (const [role, hex] of Object.entries(themeColors(name, mode))) root.style.setProperty(`--md-${role}`, hex);
  root.dataset.mode = mode;
  root.style.colorScheme = mode;
}

function load<T extends string>(key: string, ok: readonly T[], fallback: T): T {
  try { const v = localStorage.getItem(key) as T | null; if (v && ok.includes(v)) return v; } catch { /* ok */ }
  return fallback;
}

type Ctx = { theme: ThemeName; mode: Mode; setTheme: (t: ThemeName, from?: { x: number; y: number }) => void; setMode: (m: Mode, from?: { x: number; y: number }) => void };
const ThemeCtx = createContext<Ctx | null>(null);

// Troca com "revelacao" circular a partir do ponto clicado (View Transitions), quando o navegador suporta.
function withReveal(from: { x: number; y: number } | undefined, update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce) { update(); return; }
  if (from) {
    document.documentElement.style.setProperty('--vt-x', `${from.x}px`);
    document.documentElement.style.setProperty('--vt-y', `${from.y}px`);
  }
  doc.startViewTransition(() => flushSync(update));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => load('idlehub-site-theme', THEME_NAMES, 'aurora'));
  const [mode, setModeState] = useState<Mode>(() => load('idlehub-site-mode', ['dark', 'light'] as const, 'dark'));
  useLayoutEffect(() => {
    apply(theme, mode);
    try { localStorage.setItem('idlehub-site-theme', theme); localStorage.setItem('idlehub-site-mode', mode); } catch { /* ok */ }
  }, [theme, mode]);
  const value = useMemo<Ctx>(() => ({
    theme, mode,
    setTheme: (t, from) => withReveal(from, () => setThemeState(t)),
    setMode: (m, from) => withReveal(from, () => setModeState(m))
  }), [theme, mode]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('ThemeProvider ausente');
  return ctx;
}
