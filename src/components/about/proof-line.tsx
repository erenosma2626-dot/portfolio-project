"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { BACKGROUND_RULES } from "@/lib/scene/background-rules";
import { buildProofPath, checkpointPoints } from "@/lib/scene/proof-line";
import { polylineLength } from "@/lib/roadmap/trace";

interface ProofLineProps {
  items: { id: string }[];
}

/**
 * /about sayfası için "kanıt çizgisi" (proof line):
 * Sol kenar boşluğunda (künye sütununun solunda) ince tek bir sürekli eğri,
 * scroll ilerledikçe yukarıdan aşağı çizilir; her section başlığının
 * hizasında eğri üzerinde küçük boş bir halka (checkpoint) yer alır.
 * Mobilde (<768px) gizlidir.
 */
export function ProofLine({ items }: ProofLineProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const rootRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<{
    pathD: string;
    totalLen: number;
    checkpoints: number[];
  }>({
    pathD: "",
    totalLen: 0,
    checkpoints: [],
  });

  const [scrollProgress, setScrollProgress] = useState(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const onScroll = () => {
      const el = rootRef.current?.closest("article");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const h = el.offsetHeight;
      const viewportH = window.innerHeight;
      // Başlangıç: sayfanın ilk bölümü görünürken başlar; sayfa sonuna doğru biter
      const progress = Math.max(0, Math.min(1, (viewportH * 0.65 - r.top) / (h * 0.85)));
      setScrollProgress(progress);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const el = root.closest("article") || document.querySelector("article");
    if (!el) return;

    const measure = () => {
      const containerRect = el.getBoundingClientRect();
      const containerTop = containerRect.top + window.scrollY;
      const totalH = el.offsetHeight;

      const yCoords = items
        .map((item) => {
          const sec = document.getElementById(item.id);
          if (!sec) return null;
          const r = sec.getBoundingClientRect();
          return r.top + window.scrollY - containerTop;
        })
        .filter((y): y is number => y !== null);

      if (yCoords.length === 0) return;

      const pts = checkpointPoints(yCoords, totalH, 12, 5);
      const pathD = buildProofPath(pts);
      const totalLen = polylineLength(pts);

      setData({
        pathD,
        totalLen,
        checkpoints: yCoords,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items]);

  const effectiveProgress = reducedMotion ? 1 : scrollProgress;
  const currentDrawY = data.totalLen * effectiveProgress;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-0 top-0 z-0 hidden w-6 -translate-x-8 md:block lg:-translate-x-12"
    >
      {data.totalLen > 0 && (
        <svg className="h-full w-full overflow-visible" fill="none">
          {/* Soluk kılavuz izi (≤ 0.03) */}
          <path
            d={data.pathD}
            stroke="currentColor"
            strokeOpacity={0.025}
            strokeWidth={BACKGROUND_RULES.lineWidthPx}
            vectorEffect="non-scaling-stroke"
          />

          {/* İlerledikçe çizilen kanıt çizgisi (gramer gereği ≤ 0.06) */}
          <path
            d={data.pathD}
            stroke="currentColor"
            strokeOpacity={BACKGROUND_RULES.maxOpacityLight}
            strokeWidth={BACKGROUND_RULES.lineWidthPx}
            strokeDasharray={data.totalLen}
            strokeDashoffset={data.totalLen * (1 - effectiveProgress)}
            vectorEffect="non-scaling-stroke"
          />

          {/* Her section başlığındaki checkpoint halkaları */}
          {data.checkpoints.map((y, i) => {
            const isPassed = y <= currentDrawY + 15;
            return (
              <g key={i}>
                <circle
                  cx={12}
                  cy={y}
                  r={3.5}
                  stroke="currentColor"
                  strokeWidth={1}
                  fill="none"
                  strokeOpacity={isPassed ? 0.06 : 0.025}
                  vectorEffect="non-scaling-stroke"
                />
                {isPassed && (
                  <circle
                    cx={12}
                    cy={y}
                    r={1.2}
                    fill="currentColor"
                    fillOpacity={0.06}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
