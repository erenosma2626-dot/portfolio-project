/**
 * Scroll hissinin TÜM ayarları burada. İnce ayar rehberi:
 *
 * - "Daha ağır / daha hafif":  weight.lerp  (küçük = ağır, daha uzun süzülür;
 *   0.1 Lenis varsayılanı, 0.06 belirgin ağır) ve weight.wheelMultiplier
 *   (tekerlek başına mesafe; 0.8 = her tık daha kısa).
 * - "Hizalama daha çekici / daha serbest":  snap.pull (en yakın bölüm başına
 *   en fazla bu kadar viewport uzaktaysa oturur; 0.5 = hep oturur, 0.3 = orta
 *   bölgede serbest) ve snap.forwardCommit (kaydırma yönünde sonraki bölüme bu
 *   oranda girildiyse ileri gider; küçük = daha kolay sayfa çevirir).
 * - "Hizalama çok erken/geç başlıyor":  snap.idleMs.
 * - "Hizalama animasyonu yavaş/hızlı":  snap.duration.
 * - Mobil/touch için ayrı ve daha hafif değerler: snap.touch.
 */
export const SCROLL = {
  weight: {
    /** Lenis lerp: kare başına hedefe yaklaşma oranı. */
    lerp: 0.092,
    /** Tekerlek/trackpad delta çarpanı. */
    wheelMultiplier: 0.9,
    /** /about ve /projects'te de ağırlık (hizalama değil). */
    onReadingPages: true,
  },
  snap: {
    /** Hizalamanın açık olduğu rotalar. */
    routes: ["/"],
    /** Son scroll olayından sonra bekleme (ms) — trackpad momentumu bitsin. */
    idleMs: 200,
    pull: 0.5,
    forwardCommit: 0.2,
    /** Uzun bölüm içinde kenara bu kadar yakınsa hizala. */
    tallPull: 0.18,
    /** Süre (s) = base + mesafe/viewport × perViewport, en fazla max. */
    duration: { base: 0.55, perViewport: 0.35, max: 1.1 },
    touch: {
      idleMs: 280,
      pull: 0.3,
      /** 1 = touch'ta yön bazlı ileri atlama yok (native momentuma saygı). */
      forwardCommit: 1,
      tallPull: 0.12,
    },
  },
  /** Durağan başlangıçtan hizalama/anchor: easeInOutCubic. */
  easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  /** Tekerlek ataleti sürerken devralma: easeOutCubic (hız kesilmez). */
  easingOut: (t: number) => 1 - Math.pow(1 - t, 3),
} as const;

export function scrollPolicy(pathname: string, reducedMotion: boolean) {
  if (reducedMotion) return { smooth: false, snap: false };
  const snap = (SCROLL.snap.routes as readonly string[]).includes(pathname);
  return { smooth: snap || SCROLL.weight.onReadingPages, snap };
}
