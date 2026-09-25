"use client";

import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SCROLL, scrollPolicy } from "@/lib/scroll/config";
import { registerScroller } from "@/lib/scroll/controller";
import { adjacentTarget, idleReady, snapDuration, snapPoints, snapTarget } from "@/lib/scroll/snap";

/** Hizalanacak bölümler: landing'in [data-scene-section] bölümleri (belge koordinatı). */
function measurePoints() {
  const spans = Array.from(document.querySelectorAll<HTMLElement>("[data-scene-section]")).map((el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
  });
  return snapPoints(spans, window.innerHeight);
}

const introActive = () => {
  const mode = document.documentElement.dataset.intro;
  return mode === "play" || mode === "revealing";
};

/**
 * Ağırlıklı scroll (Lenis) + landing'de yumuşak bölüm hizalama.
 * - Native scroll ve scrollbar korunur (Lenis window'u kaydırır; touch native).
 * - Hizalama: son scroll olayından idleMs sonra, momentum bittiyse ve
 *   parmak ekranda değilse; yeni input anında iptal eder.
 * - Reduced-motion: Lenis hiç kurulmaz, hizalama yok.
 * - Intro oynarken Lenis durdurulur (perde kendi jestini kullanır).
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion() ?? false;
  // Lenis örneği ref'te (dış, değişken nesne); ready efektleri yeniden tetikler.
  const lenisRef = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);
  const policy = scrollPolicy(pathname, reducedMotion);

  // Lenis ömrü: reduced-motion değilse bir kez kurulur, rotalar arası kalır.
  useEffect(() => {
    if (reducedMotion) return;
    const instance = new Lenis({
      lerp: SCROLL.weight.lerp,
      wheelMultiplier: SCROLL.weight.wheelMultiplier,
      syncTouch: false,
      stopInertiaOnNavigate: true,
      autoRaf: true,
    });
    lenisRef.current = instance;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dış kütüphane örneği tarayıcıda oluşur
    setReady(true);
    registerScroller((y) =>
      instance.scrollTo(y, {
        duration: snapDuration(y - instance.scroll, window.innerHeight, SCROLL.snap.duration),
        easing: SCROLL.easing,
      }),
    );

    // Intro: perde oynarken dur, bitince başla.
    const syncIntro = () => (introActive() ? instance.stop() : instance.start());
    syncIntro();
    const observer = new MutationObserver(syncIntro);
    observer.observe(document.documentElement, { attributeFilter: ["data-intro"] });

    return () => {
      observer.disconnect();
      registerScroller(null);
      instance.destroy();
      lenisRef.current = null;
      setReady(false);
    };
  }, [reducedMotion]);

  // Rota değişince: ağırlık politikası + konum senkronu.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!ready || !lenis) return;
    lenis.options.lerp = policy.smooth ? SCROLL.weight.lerp : 1;
    lenis.resize();
  }, [ready, pathname, policy.smooth]);

  // Yumuşak hizalama + klavye (yalnız snap rotalarında).
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!ready || !lenis || !policy.snap) return;

    let timer: number | undefined;
    let touching = false;
    let lastInput: "wheel" | "touch" = "wheel";
    let direction = 0;
    let snapping = false;
    let lastInputAt = 0;
    let lastNativeScrollAt = 0;

    const params = () => (lastInput === "touch" ? { ...SCROLL.snap, ...SCROLL.snap.touch } : SCROLL.snap);

    const trySnap = () => {
      if (introActive() || snapping) return;
      const p = params();
      const now = performance.now();
      if (!idleReady({ now, lastInputAt, lastNativeScrollAt, idleMs: p.idleMs, touching })) {
        if (!touching) schedule();
        return;
      }
      // Tekerlek ataleti sürüyorsa kararı ataletin duracağı yere göre ver ve
      // oradan devral (ease-out: hareket kesilmeden hizaya akar).
      const moving = lenis.isScrolling === "smooth";
      const y = moving ? lenis.targetScroll : window.scrollY;
      const target = snapTarget({
        points: measurePoints(),
        y,
        h: window.innerHeight,
        direction,
        pull: p.pull,
        forwardCommit: p.forwardCommit,
        tallPull: p.tallPull,
      });
      if (target === null) return;
      snapping = true;
      lenis.scrollTo(target, {
        duration: snapDuration(target - window.scrollY, window.innerHeight, SCROLL.snap.duration),
        easing: moving ? SCROLL.easingOut : SCROLL.easing,
        onComplete: () => {
          snapping = false;
        },
      });
    };

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(trySnap, params().idleMs);
    };

    // Zamanlayıcıyı yalnız kullanıcı kaynaklı hareket kurar: tekerlek olayı
    // (aşağıda) ve native scroll (touch momentumu, ok tuşları, scrollbar).
    // Lenis'in kendi yumuşatma kareleri bekleme süresini uzatmaz.
    const onScroll = () => {
      if (snapping || lenis.isScrolling !== "native") return;
      if (lenis.direction) direction = lenis.direction;
      lastNativeScrollAt = performance.now();
      schedule();
    };

    // Yeni input: süren hizalamayı anında bırak (kontrol kullanıcıda).
    const cancel = () => {
      window.clearTimeout(timer);
      if (snapping) {
        snapping = false;
        lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (introActive()) return;
      lastInput = "wheel";
      if (event.deltaY) direction = Math.sign(event.deltaY);
      lastInputAt = performance.now();
      cancel();
      schedule();
    };
    const onTouchStart = () => {
      lastInput = "touch";
      lastInputAt = performance.now();
      touching = true;
      cancel();
    };
    const onTouchEnd = () => {
      touching = false;
      lastInputAt = performance.now();
      schedule();
    };

    // PageDown/Space/PageUp: bir sonraki/önceki bölüme aynı ease ile.
    const onKey = (event: KeyboardEvent) => {
      if (introActive() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      const down = event.key === "PageDown" || (event.key === " " && !event.shiftKey);
      const up = event.key === "PageUp" || (event.key === " " && event.shiftKey);
      if (!down && !up) {
        if (event.key.startsWith("Arrow")) cancel();
        return;
      }
      const next = adjacentTarget(measurePoints(), window.scrollY, down ? 1 : -1);
      if (next === null) return;
      event.preventDefault();
      cancel();
      snapping = true;
      direction = down ? 1 : -1;
      lenis.scrollTo(next, {
        duration: snapDuration(next - window.scrollY, window.innerHeight, SCROLL.snap.duration),
        easing: SCROLL.easing,
        onComplete: () => {
          snapping = false;
        },
      });
    };

    const offScroll = lenis.on("scroll", onScroll);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("mousedown", cancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      offScroll();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("mousedown", cancel);
      window.removeEventListener("keydown", onKey);
    };
  }, [ready, policy.snap]);

  return null;
}
