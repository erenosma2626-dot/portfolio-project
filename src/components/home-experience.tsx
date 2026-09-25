"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { content } from "@/content";
import { INTRO_SEEN_KEY, advanceGesture, decideIntro, shouldCommit } from "@/lib/intro";
import { sceneStore } from "@/lib/scene/store";
import { IntroArrow } from "./intro-arrow";

type Stage = "pending" | "intro" | "done";

/** Jestle önizlemede perdenin en fazla kalkabileceği oran (commit öncesi). */
const PREVIEW_MAX = 0.42;
/** 0→1 tam geçiş süresi (s). Eski 0.9 + 0.9 = 1.8 s yerine. */
const FULL_DURATION = 0.95;
const EASE = [0.45, 0, 0.15, 1] as const;

function readSeen() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Landing her zaman SSR'da render edilir; intro onun üstünde bir katman.
 * Görünürlük html[data-intro] ile CSS'te yönetilir (ilk boyamadan önce satır
 * içi script yazar) — böylece hydration beklemeden doğru ekran görünür.
 *
 * Geçiş tek bir ilerleme değeri (0→1): 0–0.5 navy perde aşağıdan kalkıp
 * intro'yu örter, 0.5'te sahne landing'e geçer, 0.5–1 perde yukarı çıkıp
 * landing'i açar. Wheel/swipe perdeyi parmağa bağlı olarak önizletir
 * (scrubbed); eşik aşılınca kalan yolu kendisi tamamlar, aşılmazsa geri yaylanır.
 */
export function HomeExperience({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("pending");
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const committedRef = useRef(false);
  const swappedRef = useRef(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const landingRef = useRef<HTMLDivElement>(null);

  const curtainY = useTransform(progress, [0, 0.5, 1], ["100%", "0%", "-100%"]);
  const panelY = useTransform(progress, [0, 0.5], [0, -48]);
  const panelOpacity = useTransform(progress, [0, 0.5], [1, 0.35]);

  // Karar: istemcide, ilk mount'ta. Hard load'da inline script aynı kararı
  // zaten html'e yazmış olur; soft navigasyonda (Link) burada yazılır.
  useEffect(() => {
    const root = document.documentElement;
    const mode = decideIntro({ pathname: "/", hash: window.location.hash, seen: readSeen() });
    root.dataset.intro = mode;
    if (mode === "play") sceneStore.set({ introActive: true });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcıya özgü karar, SSR'da bilinemez
    setStage(mode === "play" ? "intro" : "done");

    return () => {
      animationRef.current?.stop();
      root.dataset.intro = "done";
      sceneStore.set({ introActive: false });
    };
  }, []);

  const finish = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // Depolama kapalıysa intro bir sonraki ziyarette yine oynar; sorun değil.
    }
    document.documentElement.dataset.intro = "done";
    setStage("done");
    landingRef.current?.focus({ preventScroll: true });
  }, []);

  useMotionValueEvent(progress, "change", (value) => {
    if (value >= 0.5 && !swappedRef.current) {
      swappedRef.current = true;
      document.documentElement.dataset.intro = "revealing";
      sceneStore.set({ introActive: false });
    }
  });

  const commit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;
    animationRef.current?.stop();
    if (prefersReducedMotion) {
      progress.set(1);
      finish();
      return;
    }
    const remaining = 1 - progress.get();
    animationRef.current = animate(progress, 1, {
      duration: FULL_DURATION * remaining + 0.1,
      ease: EASE,
      onComplete: finish,
    });
  }, [finish, prefersReducedMotion, progress]);

  useEffect(() => {
    if (stage !== "intro") return;

    let settleTimer: number | undefined;
    const springBack = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (committedRef.current) return;
        animationRef.current = animate(progress, 0, { type: "spring", stiffness: 260, damping: 30 });
      }, 160);
    };
    const preview = (delta: number) => {
      if (committedRef.current) return;
      if (prefersReducedMotion) {
        if (delta > 0) commit();
        return;
      }
      animationRef.current?.stop();
      const next = advanceGesture(progress.get(), delta, window.innerHeight * 0.6);
      progress.set(Math.min(next, PREVIEW_MAX));
      if (shouldCommit(next)) commit();
      else springBack();
    };

    const onWheel = (event: WheelEvent) => {
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      preview(event.deltaY * unit);
    };

    let lastTouchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || lastTouchY === null) return;
      preview(lastTouchY - y);
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
        commit();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [stage, commit, prefersReducedMotion, progress]);

  return (
    <>
      {stage !== "done" && (
        <div className="intro-layer fixed inset-0 z-50 overflow-hidden">
          {/* Şeffaf panel: arkadaki canvas imza eğrisini gösterir. */}
          <motion.div
            style={{ y: panelY, opacity: panelOpacity }}
            className="intro-panel flex h-full w-full flex-col items-center justify-center px-6 text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-navy/75">{content.intro.kicker}</p>
            <p className="mt-4 max-w-sm font-heading text-2xl font-bold leading-snug sm:text-3xl">
              {content.intro.heading}
            </p>
            <IntroArrow onTrigger={commit} />
          </motion.div>

          <motion.div
            aria-hidden
            style={{ y: curtainY }}
            className="absolute inset-0 bg-navy will-change-transform"
          />
        </div>
      )}

      <div ref={landingRef} tabIndex={-1} className="landing-content outline-none">
        {children}
      </div>
    </>
  );
}
