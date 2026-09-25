"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { setConsoleFunction } from "three";
import { FIGURES, ROUTE_ALLOWED_FIGURES, figureAnimating, weightStep, type FigureId } from "@/lib/scene/figures";
import { isKnownThirdPartyWarning } from "@/lib/scene/console-filter";
import { initialGuard, stepGuard } from "@/lib/scene/fps-guard";
import { sceneStore } from "@/lib/scene/store";
import { AnomalyFigure } from "./figures/anomaly";
import { ContourFigure } from "./figures/contour";
import { FieldFigure } from "./figures/field";
import { GridFigure } from "./figures/grid";
import { ManifoldFigure } from "./figures/manifold";
import { MonteCarloFigure } from "./figures/montecarlo";
import { NetworkFigure } from "./figures/network";
import { PaperFigure } from "./figures/paper";
import { SignatureFigure } from "./figures/signature";
import { WavesFigure } from "./figures/waves";
import { cutNonRouteFigures, live } from "./live";

// R3F 9.8 store'u deprecated THREE.Clock kullanıyor; yalnız o uyarıyı sustur.
setConsoleFunction((type, message, ...params) => {
  if (isKnownThirdPartyWarning(type, message)) return;
  const log = type === "error" ? console.error : type === "warn" ? console.warn : console.log;
  log(message, ...params);
});

const FIGURE_IDS = Object.keys(FIGURES) as FigureId[];
/** İmzanın baştan sona çizilme süresi (s). */
const SIGNATURE_DRAW_SECONDS = 3.2;
/** Reduced-motion'da "çoktan çizilmiş" sayılacak yaş. */
const SETTLED_AGE = 1000;

/**
 * Sahne yönetmeni: store hedeflerine doğru figür ağırlıklarını yürütür,
 * figür yaşlarını sayar, FPS guard'ı besler ve yalnızca gerektiğinde bir
 * sonraki kareyi ister (frameloop="demand"). Hareketli figür yoksa ve her
 * şey oturmuşsa 0 fps. Sekme arkadayken rAF zaten durur.
 */
function Director() {
  const invalidate = useThree((s) => s.invalidate);
  const setDpr = useThree((s) => s.setDpr);
  const guardRef = useRef(initialGuard());
  const lastPathnameRef = useRef(sceneStore.get().pathname);

  useEffect(() => sceneStore.subscribe(() => invalidate()), [invalidate]);

  useFrame(({ size }, delta) => {
    const s = sceneStore.get();
    if (s.pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = s.pathname;
      const allowed = ROUTE_ALLOWED_FIGURES[s.pathname] ?? [];
      cutNonRouteFigures(allowed);
    }
    const dt = Math.min(delta, 1 / 20);
    const frozen = guardRef.current.level === "static";
    const instant = s.reducedMotion;
    let settled = true;
    let animating = false;

    for (const id of FIGURE_IDS) {
      const target = s.figures.includes(id) ? 1 : 0;
      const rect = s.rects[id];
      // Ekran kenarından giren/çıkan figür kenarla birlikte gelir, fade beklemez.
      const edgeAttached = !!rect && (rect.y0 > 0.5 || rect.y1 < size.height - 0.5);
      const before = live.weights[id];
      live.weights[id] = weightStep({
        current: before,
        target,
        dt,
        instant,
        cut: FIGURES[id].cutOnExit,
        edgeAttached,
      });
      if (live.weights[id] !== target) settled = false;

      if (live.weights[id] === 0) live.age[id] = 0;
      else live.age[id] = instant ? SETTLED_AGE : live.age[id] + dt;

      // Hover interpolasyonu: 250ms ease-out
      const hoverTarget = s.hoveredFigure === id ? 1 : 0;
      const prevHover = live.hover[id] ?? 0;
      live.hover[id] = instant
        ? hoverTarget
        : prevHover + (hoverTarget - prevHover) * (1 - Math.exp(-dt * 8.0));
      if (Math.abs(hoverTarget - live.hover[id]) < 0.005) {
        live.hover[id] = hoverTarget;
      } else {
        settled = false;
      }

      if (target === 1 && figureAnimating(id, live.age[id])) animating = true;
    }

    if (s.figures.includes("signature")) {
      live.signatureDraw = instant ? 1 : Math.min(1, live.signatureDraw + dt / SIGNATURE_DRAW_SECONDS);
    } else if (live.weights.signature === 0) {
      live.signatureDraw = 0;
    }

    animating = animating && !instant && !frozen;
    if (animating || !settled) live.time += dt;

    // Adaptif kalite: yalnız sürekli animasyon karelerinden örnek al.
    if (animating) {
      const next = stepGuard(guardRef.current, delta);
      if (next.level !== guardRef.current.level) {
        if (next.level === "low-dpr") setDpr(1);
        // Gözlemlenebilirlik (devtools / testler): html[data-scene-quality].
        document.documentElement.dataset.sceneQuality = next.level;
      }
      guardRef.current = next;
    }

    if (animating || !settled) invalidate();
  });

  return null;
}

export default function SceneCanvas() {
  useEffect(() => {
    const root = document.documentElement;
    return () => {
      delete root.dataset.scene;
    };
  }, []);

  return (
    <Canvas
      aria-hidden
      flat
      linear
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0xffffff);
        // İlk kare çizildikten sonra bölüm zeminlerini canvas'a devret.
        requestAnimationFrame(() => {
          document.documentElement.dataset.scene = "on";
        });
      }}
    >
      <Director />
      <PaperFigure />
      <GridFigure />
      <ContourFigure />
      <ManifoldFigure />
      <WavesFigure />
      <FieldFigure />
      <AnomalyFigure />
      <MonteCarloFigure />
      <NetworkFigure />
      <SignatureFigure />
    </Canvas>
  );
}
