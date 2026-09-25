"use client";

import { useMemo } from "react";
import { monteCarloPaths, ribbonArrays } from "@/lib/scene/geometry";
import { RibbonFigure } from "../ribbon-figure";

const COUNT = 42;
const STEPS = 90;
const DRIFT = 0.12;
const VOL = 0.55;

/** Yol y'si → plaka koordinatı: içerikten 0.15 daha yavaş scroll paralaksı. */
const project = /* glsl */ `
  vec3 project(vec3 pos) {
    vec2 uv = vec2(0.06 + pos.x * 0.88, 0.5 - pos.y * 0.30);
    vec2 p = plateToPx(uv);
    p.y += (uScroll - uRect.y) * 0.15 * uPx;
    return vec3(p, 0.0);
  }
`;

// Çizim ilerlemesi: 900ms ease-out, sonra kalır (0 fps).
const drawGlsl = /* glsl */ `
  float drawn() {
    float progress = clamp(uAge / 0.9, 0.0, 1.0);
    progress = 1.0 - pow(1.0 - progress, 3.0);
    return 1.0 - smoothstep(progress - 0.01, progress, vT);
  }
  float targetAlpha() {
    float isMobile = step(uRes.x / uPx, 1024.0);
    return mix(mix(0.35, 0.60, uHover), 0.25, isMobile);
  }
`;

const pathShade = /* glsl */ `
  ${drawGlsl}
  float shade() { return 0.14 * (targetAlpha() / 0.35) * drawn(); }
`;

// vLine 0: ortalama (düz), 1–2: ±σ√t zarfı (kesikli).
const guideShade = /* glsl */ `
  ${drawGlsl}
  float shade() {
    float dashed = vLine < 0.5 ? 1.0 : step(0.45, fract(vT * 24.0));
    float base = vLine < 0.5 ? 0.95 : 0.60;
    return base * targetAlpha() * dashed * drawn();
  }
`;

/**
 * Finsim portresi — "Monte Carlo yelpazesi": tek kökten çıkan 42 rastgele
 * yol (yoğunluk üst üste binen düşük alpha'dan), üzerinde beklenen değer ve
 * ±σ√t zarfı. Görünür olunca soldan sağa çizilir, sonra durur (0 fps).
 */
export function MonteCarloFigure() {
  const { paths, guides } = useMemo(() => {
    const raw = monteCarloPaths({ seed: 11, count: COUNT, steps: STEPS, drift: DRIFT, volatility: VOL });
    const mean = new Float32Array((STEPS + 1) * 2);
    const upper = new Float32Array((STEPS + 1) * 2);
    const lower = new Float32Array((STEPS + 1) * 2);
    for (let i = 0; i <= STEPS; i++) {
      const x = i / STEPS;
      mean.set([x, DRIFT * x], i * 2);
      upper.set([x, DRIFT * x + VOL * Math.sqrt(x)], i * 2);
      lower.set([x, DRIFT * x - VOL * Math.sqrt(x)], i * 2);
    }
    return { paths: ribbonArrays(raw, 2), guides: ribbonArrays([mean, upper, lower], 2) };
  }, []);

  return (
    <>
      <RibbonFigure id="montecarlo" arrays={paths} dims={2} project={project} shade={pathShade} />
      <RibbonFigure
        id="montecarlo"
        arrays={guides}
        dims={2}
        project={project}
        shade={guideShade}
        width={1}
        renderOrder={3}
      />
    </>
  );
}
