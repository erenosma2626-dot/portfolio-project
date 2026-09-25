"use client";

import { useReducedMotion, useScroll, useMotionValueEvent } from "framer-motion";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ROUTE_ALLOWED_FIGURES, ROUTE_FIGURES, parseFigure, resolveFigures, type FigureId } from "@/lib/scene/figures";
import { clipRect, figureRect, screenBands, type ScreenRect, type SectionBand } from "@/lib/scene/sections";
import { sceneStore } from "@/lib/scene/store";
import { cutNonRouteFigures } from "./live";

const SceneCanvas = dynamic(() => import("./scene-canvas"), { ssr: false });

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

/** three r163+ yalnız WebGL2. Canvas oluşturulamazsa (sürücü, context limiti) sessizce hiçbir şey çizme. */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    delete document.documentElement.dataset.scene;
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Bölümleri ölçer; scroll'da görünür bölüm bantlarını ve figürleri sahne
 * store'una yazar.
 * Ölçüm: [data-scene-section] elemanları (data-tone, data-figure).
 */
function SceneSync() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  const bandsRef = useRef<SectionBand[]>([]);
  const platesRef = useRef<HTMLElement[]>([]);
  const { scrollY } = useScroll();

  const update = () => {
    const { introActive } = sceneStore.get();
    // Intro sırasında landing gizli; zemin düz beyaz, bölüm bantları yok.
    const { innerWidth: width, innerHeight: height } = window;
    const bands = introActive ? [] : screenBands(bandsRef.current, window.scrollY, height);

    // Plakalar: sayfa içi figür kutuları (ör. proje portreleri). Koordinat için
    // kırpılmamış dikdörtgen saklanır; görünürlük kırpılmış hâlden.
    const plateRects: Partial<Record<FigureId, ScreenRect>> = {};
    for (const el of platesRef.current) {
      const r = el.getBoundingClientRect();
      const rect = { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
      if (clipRect(rect, width, height)) plateRects[parseFigure(el.dataset.figure)] = rect;
    }

    const figures = resolveFigures({
      pathname,
      introActive,
      visible: [...bands.map((b) => b.figure), ...(Object.keys(plateRects) as FigureId[])],
    });
    const rects: Partial<Record<FigureId, ScreenRect>> = {};
    for (const figure of figures) {
      const rect = plateRects[figure] ?? figureRect(bands, figure, width);
      if (rect) rects[figure] = rect;
    }
    sceneStore.set({ pathname, bands, figures, rects, scrollY: window.scrollY });
  };
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  });

  useEffect(() => {
    sceneStore.set({ reducedMotion });
  }, [reducedMotion]);

  useEffect(() => {
    // Rota değiştiğinde: önceki sayfanın eski bant/plaka kayıtlarını ve figür ağırlıklarını ANINDA temizle
    bandsRef.current = [];
    platesRef.current = [];
    const allowed = ROUTE_ALLOWED_FIGURES[pathname] ?? [];
    cutNonRouteFigures(allowed);
    const initialFigures = ROUTE_FIGURES[pathname] ?? [];
    sceneStore.set({
      pathname,
      bands: [],
      figures: initialFigures,
      rects: {},
    });

    const measure = () => {
      const scrollTop = window.scrollY;
      bandsRef.current = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scene-section]"),
      ).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top + scrollTop,
          bottom: rect.bottom + scrollTop,
          tone: el.dataset.tone === "dark" ? "dark" : "light",
          figure: parseFigure(el.dataset.figure),
        };
      });
      platesRef.current = Array.from(document.querySelectorAll<HTMLElement>("[data-scene-plate]"));
      updateRef.current();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-project-id]");
      const fig = parseFigure(target?.dataset.figure);
      sceneStore.set({ hoveredFigure: fig !== "none" ? fig : null });
    };
    const handleMouseOut = (e: MouseEvent) => {
      const related = (e.relatedTarget as HTMLElement | null)?.closest<HTMLElement>("[data-project-id]");
      if (!related) sceneStore.set({ hoveredFigure: null });
    };
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });

    // intro bayrağı değişince (intro → landing) figürler yeniden çözülür.
    let lastIntro = sceneStore.get().introActive;
    const unsubscribe = sceneStore.subscribe(() => {
      const { introActive } = sceneStore.get();
      if (introActive === lastIntro) return;
      lastIntro = introActive;
      updateRef.current();
    });
    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      observer.disconnect();
      unsubscribe();
    };
  }, [pathname]);

  useMotionValueEvent(scrollY, "change", () => updateRef.current());

  return null;
}

export function SceneBackground() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // three.js parçası sayfa etkileşime hazır olduktan sonra yüklensin: arka
    // plan dekoratif, ilk boyamayı ve ana thread'i (TBT) beklettirmemeli.
    const start = () => setSupported(hasWebGL());
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(start, 300);
    return () => window.clearTimeout(id);
  }, []);

  if (!supported) return null;

  return (
    <>
      <SceneSync />
      <SilentBoundary>
        <SceneCanvas />
      </SilentBoundary>
    </>
  );
}
