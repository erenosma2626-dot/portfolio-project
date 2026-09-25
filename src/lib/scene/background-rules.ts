/**
 * EFEKT GRAMERİ (tüm sayfalar için kural):
 * - Çizgi: tek renk navy, 1px, opacity beyaz zeminde ≤0.06 (navy zeminde beyaz ≤0.08). Dolgu/gölge/glow yok.
 * - Metin sütunu (içerik kolonu) üzerinde maske: orada opacity ×0.3; efekt esas olarak kenar boşluklarında yaşar.
 * - Hareket SADECE scroll'a bağlı (kendiliğinden döngü yok), yavaş (parallax ≤0.25). Görünür olma geçişi ≥600ms fade.
 * - z-index içerikten her zaman altta; pointer-events none. reduced-motion: statik, sabit kare.
 */
export const BACKGROUND_RULES = {
  /** Çizgi kalınlığı: 1px */
  lineWidthPx: 1,
  /** Beyaz zemin üzerinde çizgi opaklığı (≤ 0.09) */
  maxOpacityLight: 0.085,
  /** Navy zemin üzerinde beyaz çizgi opaklığı (≤ 0.095) */
  maxOpacityDark: 0.095,
  /** /about sayfasındaki grid opaklığı (Faz 2: 0.085) */
  aboutGridOpacity: 0.085,
  /** Metin sütunu (içerik kolonu) üzerindeki zayıflatma çarpanı (x0.6) */
  contentColumnFactor: 0.6,
  /** Maksimum paralaks çarpanı (≤ 0.25) */
  maxParallax: 0.22,
  /** Figürler arası çapraz geçiş süresi (ms) (≥ 600ms) */
  transitionDurationMs: 600,
} as const;

/**
 * Zemin tonuna göre etkin çizgi opaklığı.
 */
export function effectiveLineOpacity(tone: "light" | "dark" = "light"): number {
  return tone === "dark"
    ? BACKGROUND_RULES.maxOpacityDark
    : BACKGROUND_RULES.maxOpacityLight;
}

/**
 * Sayfa genişliği ve verilen X koordinatına göre metin sütunu maskesi katsayısı döner.
 * İçerik sütununda (~760px genişlik) opacity x0.6'ya iner, kenar boşluklarında 1.0 olur.
 */
export function contentColumnMask(x: number, containerWidth: number): number {
  const center = containerWidth / 2;
  const dist = Math.abs(x - center);
  const halfContentWidth = 380;
  const transitionWidth = 100;

  if (dist <= halfContentWidth - transitionWidth) {
    return BACKGROUND_RULES.contentColumnFactor;
  }
  if (dist >= halfContentWidth + transitionWidth) {
    return 1.0;
  }
  const t = (dist - (halfContentWidth - transitionWidth)) / (2 * transitionWidth);
  return BACKGROUND_RULES.contentColumnFactor + (1.0 - BACKGROUND_RULES.contentColumnFactor) * t;
}

/**
 * GLSL fragment shader'ları için ortak metin sütunu maskesi fonksiyonu.
 */
export const CONTENT_COLUMN_MASK_GLSL = /* glsl */ `
  float contentColumnMask(vec2 css, vec2 res) {
    float centerDist = abs(css.x - res.x * 0.5);
    // Metin sütunu: merkezden ~380px yarı genişlikte x0.6 çarpanı
    float inColumn = 1.0 - smoothstep(260.0, 420.0, centerDist);
    return mix(1.0, 0.60, inColumn);
  }
`;
