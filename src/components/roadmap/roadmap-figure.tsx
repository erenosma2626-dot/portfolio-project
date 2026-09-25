"use client";

import { animate, useMotionValueEvent, useReducedMotion, useScroll, type AnimationPlaybackControls } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { content } from "@/content";
import { roadmapEvents, type RoadmapEvent } from "@/content/roadmap";
import {
  DEFAULT_CAMERA,
  prismCorners,
  projectPoint,
  visibleEdges,
  type Camera,
  type Prism,
  type Vec3,
} from "@/lib/roadmap/camera";
import { dayIndex, formatDay, todayIndex } from "@/lib/roadmap/dates";
import { cardPlacement, splitRoadAtArc } from "@/lib/roadmap/layout";
import { DEFAULT_ROAD, buildRoad, pointAtArc } from "@/lib/roadmap/road";
import { formatEventRange, roadSpanPoints, spanEnd } from "@/lib/roadmap/span";
import { ticks, viewFor, type RangeMode, type View } from "@/lib/roadmap/timescale";
import { pointAlong, polylineLength, type Pt } from "@/lib/roadmap/trace";
import { easeInOut, eventFrame } from "@/lib/roadmap/transition";

const { roadmap: copy } = content;

/** Dünya birimi → SVG birimi. */
const SCALE = 88;
const PRISM: Prism = { length: DEFAULT_ROAD.length + 0.6, depth: DEFAULT_ROAD.depth, height: 0.55 };
const ROAD_HALF = 0.13;
const RISE = 1.15;
const BALL_R = 0.2;
const CARD_W = 264;
/** Kart için diyagramın üstünde bırakılan boşluk (SVG birimi). */
const CARD_ROOM = 190;
/** Scroll paralaksı: bölüm boyunca en fazla ±bu kadar yaw (radyan). */
const PARALLAX_YAW = 0.045;
/** near↔far geçiş süresi (s). */
const RANGE_SECONDS = 0.55;

type XZ = { x: number; z: number };

/** Sabit viewBox: yaw=0 prizma izdüşümü + yükselen top/kart payı (paralaks yeniden ölçeklemez). */
const VIEWBOX = (() => {
  const pts = prismCorners(PRISM).map((c) => projectPoint(c, DEFAULT_CAMERA));
  const xs = pts.map((p) => p.x * SCALE);
  const ys = pts.map((p) => p.y * SCALE);
  const pad = 24;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - RISE * SCALE - CARD_ROOM;
  const maxY = Math.max(...ys) + pad;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
})();

function toSvg(p: Vec3, cam: Camera) {
  const s = projectPoint(p, cam);
  return { x: s.x * SCALE, y: s.y * SCALE, f: DEFAULT_CAMERA.distance / s.depth };
}

function pathOf(points: XZ[], offset: number, cam: Camera) {
  if (points.length < 2) return "";
  return points
    .map((p, i) => {
      const a = points[Math.max(i - 1, 0)];
      const b = points[Math.min(i + 1, points.length - 1)];
      const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const n = { x: -(b.z - a.z) / len, z: (b.x - a.x) / len };
      const s = toSvg({ x: p.x + n.x * offset, y: 0, z: p.z + n.z * offset }, cam);
      return `${i === 0 ? "M" : "L"}${s.x.toFixed(1)},${s.y.toFixed(1)}`;
    })
    .join("");
}

const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");

interface Placed {
  event: RoadmapEvent;
  number: string;
  day: number;
  world: XZ;
  opacity: number;
}

/** Açık kart ve süre çizelgesi değerleri (0..1). */
interface Open {
  progress: number; // 0..1 (top yükselişi, kart opaklığı & yukarı kayma)
  span: number; // 0..1 (süre çizgisi ve uç disk/etiket)
}
const CLOSED: Open = { progress: 0, span: 0 };

/** Açılışta geçici olarak oynayan hüzme durumu. */
interface Beam {
  opacity: number;
  scaleX: number;
}
const CLOSED_BEAM: Beam = { opacity: 0, scaleX: 0.6 };

/**
 * §4 Roadmap: üstten eğik bakılan tel-kafes prizma, üst yüzde kıvrımlı yol,
 * yol üstünde gün çözünürlüğünde noktalar. İki pozisyonlu aralık (Near/Far).
 * Odak modu: diğer öğeler soluklaşır, noktadan spanEnd'e süre çizgisi uzar,
 * açılışta kartın altına doğru yumuşak bir ışık yayılır.
 */
export function RoadmapFigure() {
  const reducedMotion = useReducedMotion() ?? false;
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [now] = useState(() => new Date());
  const today = todayIndex(now);

  // --- aralık (near/far) ve geçiş ---
  const [mode, setMode] = useState<RangeMode>("far");
  const [views, setViews] = useState<{ from: View; to: View }>(() => {
    const v = viewFor("far", now);
    return { from: v, to: v };
  });
  const [shift, setShift] = useState(1);
  const shiftAnim = useRef<AnimationPlaybackControls | null>(null);

  const [yaw, setYaw] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState<Open>(CLOSED);
  const openRef = useRef<Open>(CLOSED);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const [beam, setBeam] = useState<Beam>(CLOSED_BEAM);
  const beamRef = useRef<Beam>(CLOSED_BEAM);
  useEffect(() => {
    beamRef.current = beam;
  }, [beam]);

  const [size, setSize] = useState({ w: 1, cardH: 150 });
  const gen = useRef(0);
  const anims = useRef<AnimationPlaybackControls[]>([]);
  const leaveTimer = useRef<number | undefined>(undefined);
  const lastPointer = useRef<string>("mouse");

  const cam: Camera = useMemo(() => ({ ...DEFAULT_CAMERA, yaw }), [yaw]);
  const road = useMemo(() => buildRoad(DEFAULT_ROAD), []);
  const t = easeInOut(shift);
  const frameOf = (day: number) => eventFrame(day, views.from, views.to, t);

  // --- scroll paralaksı (reduced-motion'da yok) ---
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reducedMotion) setYaw((p - 0.5) * 2 * PARALLAX_YAW);
  });

  // --- boyut: SVG birimi → CSS px oranı ---
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize((s) => ({ ...s, w: el.clientWidth })));
    ro.observe(el);
    setSize((s) => ({ ...s, w: el.clientWidth }));
    return () => ro.disconnect();
  }, []);
  const ratio = size.w / VIEWBOX.w;
  const toCss = useCallback(
    (p: { x: number; y: number }) => ({ x: (p.x - VIEWBOX.x) * ratio, y: (p.y - VIEWBOX.y) * ratio }),
    [ratio],
  );

  // --- açılış / kapanış zaman çizelgesi ---
  const stopAll = () => {
    anims.current.forEach((a) => a.stop());
    anims.current = [];
  };

  const activate = useCallback(
    (id: string) => {
      window.clearTimeout(leaveTimer.current);
      if (active === id) return;
      ++gen.current;
      stopAll();
      setActive(id);

      if (reducedMotion) {
        setOpen({ progress: 1, span: 1 });
        setBeam({ opacity: 1, scaleX: 1 });
        return;
      }

      const cur = openRef.current;
      const curBeam = beamRef.current;

      // 1) Top yükselişi ve kart AYNI ANDA başlar: toplam 220ms ease-out
      const a1 = animate(cur.progress, 1, {
        duration: 0.22,
        ease: "easeOut",
        onUpdate: (v: number) => setOpen((o) => ({ ...o, progress: v })),
      });
      // 2) Süre çizgisi paralel olarak uzar: 350ms ease-out
      const a2 = animate(cur.span, 1, {
        duration: 0.35,
        ease: "easeOut",
        onUpdate: (v: number) => setOpen((o) => ({ ...o, span: v })),
      });

      // 3) Hüzme: 0→700ms'de ışık yayılır gibi belirsin (opacity 0→1, scaleX 0.6→1, ease-out) ve kalıcı kalsın
      const aBeamOpacity = animate(curBeam.opacity, 1, {
        duration: 0.7,
        ease: "easeOut",
        onUpdate: (v: number) => setBeam((b) => ({ ...b, opacity: v })),
      });
      const aBeamScale = animate(curBeam.scaleX, 1, {
        duration: 0.7,
        ease: "easeOut",
        onUpdate: (v: number) => setBeam((b) => ({ ...b, scaleX: v })),
      });

      anims.current.push(a1, a2, aBeamOpacity, aBeamScale);
    },
    [active, reducedMotion],
  );

  const deactivate = useCallback(() => {
    const my = ++gen.current;
    stopAll();

    if (reducedMotion) {
      setActive(null);
      setOpen(CLOSED);
      setBeam(CLOSED_BEAM);
      return;
    }

    const cur = openRef.current;
    const curBeam = beamRef.current;

    // 1) Kart, hüzme ve top kapanışı: 150ms
    const a1 = animate(cur.progress, 0, {
      duration: 0.15,
      ease: "easeIn",
      onUpdate: (v: number) => setOpen((o) => ({ ...o, progress: v })),
    });
    const aBeam = animate(curBeam.opacity, 0, {
      duration: 0.15,
      ease: "easeIn",
      onUpdate: (v: number) => setBeam((b) => ({ ...b, opacity: v })),
    });
    // 2) Süre çizgisi başlangıca geri toplanır: 180ms
    const a2 = animate(cur.span, 0, {
      duration: 0.18,
      ease: "easeIn",
      onUpdate: (v: number) => setOpen((o) => ({ ...o, span: v })),
    });
    anims.current.push(a1, aBeam, a2);

    // Çizgi geri toplandıktan (180ms) sonra diğer öğeler görünürlüğe döner (~150ms CSS transition)
    window.setTimeout(() => {
      if (gen.current === my) {
        setActive(null);
        setBeam(CLOSED_BEAM);
      }
    }, 180);
  }, [reducedMotion]);

  const scheduleLeave = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(deactivate, 120);
  };

  // Aralık değişimi: noktalar yol boyunca kayar.
  const changeMode = (next: RangeMode) => {
    if (next === mode) return;
    const target = viewFor(next, now);
    const current: View = {
      start: views.from.start + (views.to.start - views.from.start) * t,
      end: views.from.end + (views.to.end - views.from.end) * t,
    };
    setMode(next);
    deactivate();
    shiftAnim.current?.stop();
    setViews({ from: current, to: target });
    if (reducedMotion) {
      setShift(1);
      return;
    }
    setShift(0);
    shiftAnim.current = animate(0, 1, { duration: RANGE_SECONDS, ease: "linear", onUpdate: setShift });
  };

  // Boşluğa dokunuş / Esc kapatır.
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-roadmap-hit], [data-roadmap-card]")) deactivate();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && deactivate();
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, deactivate]);

  useEffect(
    () => () => {
      window.clearTimeout(leaveTimer.current);
      anims.current.forEach((a) => a.stop());
      shiftAnim.current?.stop();
    },
    [],
  );

  useLayoutEffect(() => {
    if (active && cardRef.current) {
      const h = cardRef.current.offsetHeight;
      setSize((s) => (s.cardH === h ? s : { ...s, cardH: h }));
    }
  }, [active]);

  // --- olaylar: geçiş karesi ---
  const placed: Placed[] = roadmapEvents
    .map((event, i) => {
      const day = dayIndex(event.date);
      const f = frameOf(day);
      const p = pointAtArc(road, f.arc);
      return { event, number: `4.${i + 1}`, day, world: { x: p.x, z: p.z }, opacity: f.opacity };
    })
    .filter((p) => p.opacity > 0.001);
  const interactive = placed.filter((p) => p.opacity > 0.5);
  const outside = roadmapEvents.filter((e) => !interactive.some((p) => p.event.id === e.id));

  // --- çizim verisi ---
  const corners = prismCorners(PRISM);
  const edges = visibleEdges(PRISM, cam);
  const gridLines: string[] = [];
  for (let x = -Math.floor(PRISM.length / 2); x <= PRISM.length / 2; x += 1) {
    const a = toSvg({ x, y: 0, z: -PRISM.depth / 2 }, cam);
    const b = toSvg({ x, y: 0, z: PRISM.depth / 2 }, cam);
    gridLines.push(`M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  }
  for (let z = -PRISM.depth / 2 + 0.5; z < PRISM.depth / 2; z += 0.5) {
    const a = toSvg({ x: -PRISM.length / 2, y: 0, z }, cam);
    const b = toSvg({ x: PRISM.length / 2, y: 0, z }, cam);
    gridLines.push(`M${a.x.toFixed(1)},${a.y.toFixed(1)}L${b.x.toFixed(1)},${b.y.toFixed(1)}`);
  }

  const todayArc = frameOf(today).arc;
  const split = splitRoadAtArc(road, todayArc);
  const todayPt = pointAtArc(road, todayArc);
  const todayBase = toSvg({ x: todayPt.x, y: 0, z: todayPt.z }, cam);
  const todayTop = toSvg({ x: todayPt.x, y: 0.42, z: todayPt.z }, cam);

  // Tick'ler: eski ve yeni kümeler kayarak çapraz geçer.
  const tickSets = [
    { key: "from", list: ticks(views.from, mode === "near" ? "far" : "near"), fade: 1 - t, show: t < 1 },
    { key: "to", list: ticks(views.to, mode), fade: t, show: true },
  ].filter((s) => s.show && (s.key === "to" || views.from !== views.to));

  // --- top + kart geometrisi ---
  const activePlaced = interactive.find((p) => p.event.id === active) ?? null;
  const ball = activePlaced
    ? (() => {
        const base = toSvg({ x: activePlaced.world.x, y: 0, z: activePlaced.world.z }, cam);
        const center = toSvg(
          { x: activePlaced.world.x, y: BALL_R + open.progress * RISE, z: activePlaced.world.z },
          cam,
        );
        const r = BALL_R * SCALE * center.f * (0.55 + 0.45 * Math.min(open.progress, 1));
        return { base, center, r };
      })()
    : null;

  const cardW = Math.min(CARD_W, size.w - 16);
  const card =
    ball && activePlaced
      ? (() => {
          const c = toCss(ball.center);
          const rCss = ball.r * ratio;
          const topAnchor = { x: c.x, y: c.y - rCss };
          const place = cardPlacement({
            anchorX: topAnchor.x,
            anchorY: topAnchor.y,
            cardW,
            cardH: size.cardH,
            containerW: size.w,
            gap: 22,
            margin: 8,
            minTop: size.w < 640 ? -150 : -48,
          });
          const top = place.placement === "below" ? c.y + rCss + 22 : place.top;
          const rect = { left: place.left, top, width: cardW, height: size.cardH };
          const start = place.placement === "above" ? topAnchor : { x: c.x, y: c.y + rCss };
          return { ...place, rect, top, start, center: c, rCss };
        })()
      : null;

  // --- hüzme geometrisi (CSS px) ---
  const beamGeometry =
    card && ball
      ? (() => {
          const cardMidX = card.rect.left + card.rect.width / 2;
          const topW = card.rect.width * 0.7;
          const cardX1 = cardMidX - topW / 2;
          const cardX2 = cardMidX + topW / 2;
          const ballX = card.center.x;
          const ballR = card.rCss;
          const ballX1 = ballX - ballR;
          const ballX2 = ballX + ballR;

          const isAbove = card.placement === "above";
          const cardY = isAbove ? card.rect.top + card.rect.height : card.rect.top;
          const ballY = isAbove ? card.center.y - ballR : card.center.y + ballR;

          // Ana hüzme: kart tarafında %70 genişlik, top tarafında top çapı
          const pathMain = isAbove
            ? `M ${cardX1} ${cardY} L ${cardX2} ${cardY} L ${ballX2} ${ballY} L ${ballX1} ${ballY} Z`
            : `M ${ballX1} ${ballY} L ${ballX2} ${ballY} L ${cardX2} ${cardY} L ${cardX1} ${cardY} Z`;

          // İçteki 2 ince daha açık hüzme (farklı açılarda, alpha 0.12)
          const innerW = topW * 0.36;
          const offsetCard = topW * 0.16;

          const leftCardX1 = cardMidX - offsetCard - innerW / 2;
          const leftCardX2 = cardMidX - offsetCard + innerW / 2;
          const leftBallX1 = ballX - ballR * 0.6;
          const leftBallX2 = ballX + ballR * 0.3;
          const pathInnerLeft = isAbove
            ? `M ${leftCardX1} ${cardY} L ${leftCardX2} ${cardY} L ${leftBallX2} ${ballY} L ${leftBallX1} ${ballY} Z`
            : `M ${leftBallX1} ${ballY} L ${leftBallX2} ${ballY} L ${leftCardX2} ${cardY} L ${leftCardX1} ${cardY} Z`;

          const rightCardX1 = cardMidX + offsetCard - innerW / 2;
          const rightCardX2 = cardMidX + offsetCard + innerW / 2;
          const rightBallX1 = ballX - ballR * 0.3;
          const rightBallX2 = ballX + ballR * 0.6;
          const pathInnerRight = isAbove
            ? `M ${rightCardX1} ${cardY} L ${rightCardX2} ${cardY} L ${rightBallX2} ${ballY} L ${rightBallX1} ${ballY} Z`
            : `M ${rightBallX1} ${ballY} L ${rightBallX2} ${ballY} L ${rightCardX2} ${cardY} L ${rightCardX1} ${cardY} Z`;

          return {
            ballY,
            cardY,
            ballX,
            cardMidX,
            pathMain,
            pathInnerLeft,
            pathInnerRight,
          };
        })()
      : null;

  // --- odak modu süre çizgisi (SVG birimi) ---
  const spanData = activePlaced
    ? (() => {
        const sEndDay = spanEnd(activePlaced.event, today);
        const aStart = frameOf(activePlaced.day).arc;
        const rawAEnd = frameOf(sEndDay).arc;
        // Bitiş pencere dışındaysa pencere kenarında kes
        const aEnd = Math.max(aStart, Math.min(1, rawAEnd));

        const pts = roadSpanPoints(road, aStart, aEnd);
        const svgPts = pts.map((p) => toSvg({ x: p.x, y: 0, z: p.z }, cam));
        const totalLen = polylineLength(svgPts);

        const endLabel = activePlaced.event.endDate
          ? formatDay(dayIndex(activePlaced.event.endDate))
          : "Ongoing";

        return {
          svgPts,
          totalLen,
          endLabel,
          hasSpan: sEndDay > activePlaced.day,
        };
      })()
    : null;

  const hitProps = (p: Placed) => {
    const c = toCss(toSvg({ x: p.world.x, y: 0, z: p.world.z }, cam));
    const kind = copy.kinds[p.event.kind];
    return {
      "data-roadmap-hit": "",
      "aria-label": `${formatDay(p.day)} — ${kind}: ${p.event.title}`,
      "aria-expanded": active === p.event.id,
      className:
        "absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-current/60",
      style: { left: c.x, top: c.y },
      onPointerDown: (e: React.PointerEvent) => {
        lastPointer.current = e.pointerType;
      },
      onPointerEnter: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") activate(p.event.id);
      },
      onPointerLeave: (e: React.PointerEvent) => {
        if (e.pointerType === "mouse") scheduleLeave();
      },
      onFocus: () => activate(p.event.id),
      onBlur: (e: React.FocusEvent) => {
        if (!(e.relatedTarget as HTMLElement | null)?.closest("[data-roadmap-card]")) scheduleLeave();
      },
      onClick: (e: React.MouseEvent) => {
        if (lastPointer.current !== "mouse" || !p.event.href) {
          e.preventDefault();
          activate(p.event.id);
        }
      },
    };
  };

  const isDimmed = active !== null;

  return (
    <div className="mt-6 w-full max-w-4xl">
      {/* Ölçek anahtarı: Near | Far */}
      <div className="flex items-baseline justify-center gap-3 text-sm">
        <span className="italic opacity-75">{copy.scale.label} —</span>
        <div
          role="radiogroup"
          aria-label={copy.scale.label}
          className="flex items-baseline gap-4"
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
              e.preventDefault();
              const next = mode === "near" ? "far" : "near";
              changeMode(next);
              (e.currentTarget.querySelector(`[data-mode="${next}"]`) as HTMLElement | null)?.focus();
            }
          }}
        >
          {(["near", "far"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              data-mode={m}
              aria-checked={mode === m}
              tabIndex={mode === m ? 0 : -1}
              onClick={() => changeMode(m)}
              className={`relative pb-1 transition-opacity focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current/60 ${
                mode === m ? "opacity-100" : "opacity-60 hover:opacity-90"
              }`}
            >
              {copy.scale[m]}
              <span
                aria-hidden
                className={`absolute inset-x-0 -bottom-px h-px bg-current transition-transform duration-300 ${
                  mode === m ? "scale-x-100" : "scale-x-0"
                } ${m === "near" ? "origin-right" : "origin-left"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-2 w-full text-current"
        style={{ aspectRatio: `${VIEWBOX.w} / ${VIEWBOX.h}` }}
      >
        <svg
          viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
          className="absolute inset-0 h-full w-full overflow-visible"
          role="img"
          aria-label={copy.ariaLabel}
          fill="none"
          stroke="currentColor"
        >
          {/* Üst yüz ızgarası */}
          <path d={gridLines.join("")} strokeOpacity={0.07} strokeWidth={1} vectorEffect="non-scaling-stroke" />

          {/* Prizma kenarları */}
          {edges.map(([a, b]) => {
            const p = toSvg(corners[a], cam);
            const q = toSvg(corners[b], cam);
            return (
              <line
                key={`${a}-${b}`}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                strokeOpacity={0.5}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Yol: geçmiş düz, gelecek kesik ve soluk */}
          {[ROAD_HALF, -ROAD_HALF].map((o) => (
            <g key={o}>
              <path d={pathOf(split.done, o, cam)} strokeOpacity={0.75} strokeWidth={1.2} vectorEffect="non-scaling-stroke" />
              <path
                d={pathOf(split.planned, o, cam)}
                strokeOpacity={0.35}
                strokeWidth={1.2}
                strokeDasharray="5 5"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}

          {/* Odak modu süre çizgisi: aktif noktadan spanEnd'e kadar beyaz çizgi */}
          {activePlaced && spanData && spanData.hasSpan && spanData.totalLen > 1 && open.span > 0 && (
            <g>
              <path
                d={poly(spanData.svgPts)}
                stroke="#ffffff"
                strokeOpacity={0.9}
                strokeWidth={2}
                strokeDasharray={spanData.totalLen}
                strokeDashoffset={spanData.totalLen * (1 - open.span)}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {(() => {
                const tipPt = pointAlong(spanData.svgPts, open.span);
                return (
                  <g style={{ opacity: open.span > 0.05 ? 1 : 0 }} className="transition-opacity duration-75">
                    <circle cx={tipPt.x} cy={tipPt.y} r={3} fill="#ffffff" stroke="none" />
                    <text
                      x={tipPt.x}
                      y={tipPt.y + 14}
                      fill="#ffffff"
                      stroke="none"
                      fillOpacity={Math.min(1, open.span * 1.5) * 0.9}
                      fontSize={10}
                      textAnchor="middle"
                      className="font-body font-medium"
                    >
                      {spanData.endLabel}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* Tick etiketleri: odak modunda ~150ms'de söner */}
          {tickSets.map((set) =>
            set.list.map((tk) => {
              const pt = pointAtArc(road, frameOf(tk.day).arc);
              const s = toSvg({ x: pt.x, y: 0, z: pt.z + 0.42 }, cam);
              const baseOp = set.fade * (tk.major ? 0.6 : 0.35);
              const op = isDimmed ? 0 : baseOp;
              return (
                <text
                  key={`${set.key}-${tk.day}`}
                  x={s.x}
                  y={s.y}
                  fill="currentColor"
                  stroke="none"
                  fontSize={tk.major ? 13 : 11}
                  textAnchor="middle"
                  className="font-body transition-opacity duration-150"
                  style={{ fillOpacity: op }}
                >
                  {tk.label}
                </text>
              );
            }),
          )}

          {/* Bugün: odak modunda ~150ms'de söner */}
          <g className="transition-opacity duration-150" style={{ opacity: isDimmed ? 0 : 1 }}>
            <line
              x1={todayBase.x}
              y1={todayBase.y}
              x2={todayTop.x}
              y2={todayTop.y}
              strokeOpacity={0.8}
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={todayTop.x}
              y={todayTop.y - 6}
              fill="currentColor"
              stroke="none"
              fontSize={12}
              textAnchor="middle"
              fillOpacity={0.8}
              className="font-body italic"
            >
              {copy.today}
            </text>
          </g>

          {/* Noktalar: odak modunda aktif olmayanlar ~150ms'de söner */}
          {placed.map((p) => {
            const s = toSvg({ x: p.world.x, y: 0, z: p.world.z }, cam);
            const on = p.event.id === active;
            const dotOp = isDimmed && !on ? 0 : p.opacity;
            const r = (on ? 5.5 : 4.5) * s.f;
            return p.event.status === "done" ? (
              <circle
                key={p.event.id}
                cx={s.x}
                cy={s.y}
                r={r}
                fill="currentColor"
                stroke="none"
                className="transition-opacity duration-150"
                style={{ opacity: dotOp }}
              />
            ) : (
              <circle
                key={p.event.id}
                cx={s.x}
                cy={s.y}
                r={r}
                strokeWidth={1.3}
                className="transition-opacity duration-150"
                style={{ opacity: dotOp }}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Top: ip + kontur + elipsler; çok hafif nabız */}
          {ball && (
            <g>
              <line
                x1={ball.base.x}
                y1={ball.base.y}
                x2={ball.center.x}
                y2={ball.center.y + ball.r}
                strokeOpacity={0.5}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <g className={open.progress > 0.5 && !reducedMotion ? "roadmap-pulse" : undefined}>
                <circle
                  cx={ball.center.x}
                  cy={ball.center.y}
                  r={ball.r}
                  fill="currentColor"
                  fillOpacity={0.12}
                  strokeWidth={1.2}
                  vectorEffect="non-scaling-stroke"
                />
                <g strokeOpacity={0.45 * Math.min(open.progress, 1)} strokeWidth={0.8}>
                  <ellipse cx={ball.center.x} cy={ball.center.y} rx={ball.r} ry={ball.r * 0.34} vectorEffect="non-scaling-stroke" />
                  <ellipse cx={ball.center.x} cy={ball.center.y} rx={ball.r * 0.4} ry={ball.r} vectorEffect="non-scaling-stroke" />
                </g>
              </g>
            </g>
          )}
        </svg>

        {/* Yumuşak soluk ışık hüzmesi: 0→700ms'de belirir (opacity 0→1, scaleX 0.6→1), kalıcı kalır, kapanışta 150ms'de söner */}
        {card && ball && beamGeometry && beam.opacity > 0.005 && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
            fill="none"
          >
            <defs>
              <filter id="roadmap-beam-blur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <linearGradient
                id="roadmap-beam-grad"
                x1={beamGeometry.ballX}
                y1={beamGeometry.ballY}
                x2={beamGeometry.cardMidX}
                y2={beamGeometry.cardY}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
              <linearGradient
                id="roadmap-inner-beam-grad"
                x1={beamGeometry.ballX}
                y1={beamGeometry.ballY}
                x2={beamGeometry.cardMidX}
                y2={beamGeometry.cardY}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <g
              style={{
                transformOrigin: `${beamGeometry.ballX}px ${beamGeometry.ballY}px`,
                transform: `scaleX(${beam.scaleX})`,
                opacity: beam.opacity,
              }}
            >
              {/* Ana yumuşak hüzme trapez/koni */}
              <path
                d={beamGeometry.pathMain}
                fill="url(#roadmap-beam-grad)"
                filter="url(#roadmap-beam-blur)"
              />

              {/* İçteki 2 ince daha açık hüzme (farklı açılarda, alpha 0.12) */}
              <path
                d={beamGeometry.pathInnerLeft}
                fill="url(#roadmap-inner-beam-grad)"
                filter="url(#roadmap-beam-blur)"
              />
              <path
                d={beamGeometry.pathInnerRight}
                fill="url(#roadmap-inner-beam-grad)"
                filter="url(#roadmap-beam-blur)"
              />
            </g>
          </svg>
        )}

        {/* Gerçek, odaklanabilir olaylar (noktalara hizalı) */}
        {interactive.map((p) =>
          p.event.href ? (
            <a key={p.event.id} href={p.event.href} {...hitProps(p)} />
          ) : (
            <button key={p.event.id} type="button" {...hitProps(p)} />
          ),
        )}

        {/* Kart: normal ince çerçeve, hüzme ve top ile aynı anda 220ms ease-out açılır */}
        {activePlaced && card && (
          <div
            ref={cardRef}
            data-roadmap-card=""
            role="dialog"
            aria-label={activePlaced.event.title}
            onPointerEnter={() => window.clearTimeout(leaveTimer.current)}
            onPointerLeave={(e) => e.pointerType === "mouse" && scheduleLeave()}
            className="absolute z-10 rounded-[2px] border border-white/20 p-4 text-left text-white shadow-lg backdrop-blur-sm"
            style={{
              left: card.rect.left,
              top: card.rect.top,
              width: cardW,
              backgroundColor: "rgba(17,42,64,0.95)",
              opacity: open.progress,
              transform: `translateY(${(1 - open.progress) * 4}px)`,
              visibility: open.progress > 0.01 ? "visible" : "hidden",
              pointerEvents: open.progress > 0.5 ? "auto" : "none",
            }}
          >
            <div>
              <p className="text-xs tabular-nums opacity-75">
                {activePlaced.number} · {copy.kinds[activePlaced.event.kind]} · {formatEventRange(activePlaced.event)}
                {activePlaced.event.status === "planned" && activePlaced.event.endDate === null && <> · {copy.planned}</>}
              </p>
              <h3 className="mt-1.5 text-lg leading-snug">{activePlaced.event.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed opacity-85">{activePlaced.event.summary}</p>
              {activePlaced.event.href && (
                <a
                  href={activePlaced.event.href}
                  className="link-underline mt-3 inline-block text-sm font-semibold"
                  onBlur={(e) => {
                    if (!(e.relatedTarget as HTMLElement | null)?.closest("[data-roadmap-hit], [data-roadmap-card]"))
                      scheduleLeave();
                  }}
                >
                  {copy.open}
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pencere dışında kalan olaylar: erişilebilirlik / SEO */}
      {outside.length > 0 && (
        <ul className="sr-only" aria-label={copy.allEntries}>
          {outside.map((e) => (
            <li key={e.id}>
              {formatEventRange(e)} — {copy.kinds[e.kind]}:{" "}
              {e.href ? <a href={e.href}>{e.title}</a> : e.title}. {e.summary}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
