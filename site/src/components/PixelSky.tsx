import { useEffect, useRef } from 'react';
import { useTheme, themeColors } from '../theme';

// Ceu em pixel art: uma aurora em ondas, com pontilhado (dithering de Bayer) e estrelas piscando.
// Desenhado num canvas pequeno (160x90) ampliado sem suavizar: barato e com cara de pixel.
const W = 160, H = 90;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

export function PixelSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme, mode } = useTheme();

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const c = themeColors(theme, mode);
    const top = rgb(c['surface-container-lowest']), bottom = rgb(c['surface']);
    const auroraA = rgb(mode === 'dark' ? c['primary'] : c['primary-container']);
    const auroraB = rgb(mode === 'dark' ? c['tertiary'] : c['tertiary-container']);
    const star = rgb(c['on-surface']);
    // estrelas fixas no alto do ceu
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const stars = Array.from({ length: 38 }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * H * 0.62), p: rnd() * 6.28, s: 0.6 + rnd() * 1.6 }));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0, last = 0, visible = true, t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const d = img.data;
      for (let y = 0; y < H; y++) {
        const base = mix(top, bottom, y / H);
        for (let x = 0; x < W; x++) {
          // duas cortinas de aurora que ondulam em ritmos diferentes
          const c1 = H * 0.42 + Math.sin(x * 0.045 + t * 0.35) * 9 + Math.sin(x * 0.011 - t * 0.2) * 12;
          const c2 = H * 0.58 + Math.sin(x * 0.03 - t * 0.27 + 2) * 7 + Math.sin(x * 0.017 + t * 0.15) * 9;
          const flick = 0.65 + 0.35 * Math.sin(x * 0.09 + t * 0.9);
          const i1 = Math.exp(-(((y - c1) / 9) ** 2)) * flick;
          const i2 = Math.exp(-(((y - c2) / 13) ** 2)) * (0.55 + 0.45 * Math.sin(x * 0.05 - t * 0.6));
          let k = Math.min(1, i1 * 0.9 + i2 * 0.6) * (mode === 'dark' ? 0.5 : 0.42);
          // pontilhado so nas bordas da aurora: quantiza em 8 niveis com a matriz de Bayer (transicao suave, sem chuvisco)
          const th = BAYER[(y & 3) * 4 + (x & 3)];
          k = Math.floor(k * 8 + th) / 8;
          const tint = mix(auroraA, auroraB, (Math.sin(x * 0.02 + t * 0.1) + 1) / 2);
          const col = mix(base, tint, k);
          const o = (y * W + x) * 4;
          d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
        }
      }
      for (const s of stars) {
        const a = (Math.sin(t * s.s + s.p) + 1) / 2;
        if (a < 0.35) continue;
        const o = (s.y * W + s.x) * 4;
        const col = mix([d[o], d[o + 1], d[o + 2]], star, a * (mode === 'dark' ? 0.6 : 0.25));
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2];
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 66) return; // ~15 quadros/s bastam para a aurora
      last = now;
      draw(now);
    };
    draw(performance.now());
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [theme, mode]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
