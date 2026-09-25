/**
 * Yumuşak bölüm hizalama (soft snap) — saf mantık. Kullanıcı kaydırmayı
 * bıraktıktan sonra hangi scroll konumuna (varsa) ease ile oturulacağını
 * hesaplar. Zorlayıcı değil: pull dışında ya da uzun bölümün içinde null.
 */

export interface SectionSpan {
  top: number;
  bottom: number;
}

/** Bölüm ekrana sığmıyorsa (bu oranın üstü) içinde serbest scroll. */
const TALL = 1.05;

/** Hizalanabilir scroll konumları: bölüm başları; uzun bölümlerde ayrıca alt kenar hizası. */
export function snapPoints(sections: SectionSpan[], h: number): number[] {
  const out = new Set<number>();
  for (const s of sections) {
    out.add(Math.round(s.top));
    if (s.bottom - s.top > h * TALL) out.add(Math.round(s.bottom - h));
  }
  return [...out].sort((a, b) => a - b);
}

export function snapTarget({
  points,
  y,
  h,
  direction,
  pull,
  forwardCommit,
  tallPull,
}: {
  points: number[];
  y: number;
  h: number;
  /** Son kaydırma yönü: 1 aşağı, -1 yukarı, 0 bilinmiyor. */
  direction: number;
  /** En yakın noktaya en fazla bu kadar (viewport oranı) uzaksa hizala. */
  pull: number;
  /** Kaydırma yönünde sonraki bölüme bu oran kadar girildiyse ileri git. */
  forwardCommit: number;
  /** Uzun bölüm içinde kenara bu kadar yakınsa hizala. */
  tallPull: number;
}): number | null {
  if (points.length === 0) return null;
  if (points.some((p) => Math.abs(p - y) < 1)) return null;

  let prev: number | null = null;
  let next: number | null = null;
  for (const p of points) {
    if (p <= y) prev = p;
    else if (next === null) next = p;
  }

  const nearest =
    prev === null ? next! : next === null ? prev : y - prev <= next - y ? prev : next;
  const dist = (p: number) => Math.abs(p - y);

  // Uzun bölümün içi: serbest; sadece kenara çok yakınsa.
  if (prev !== null && next !== null && next - prev > h * TALL) {
    return dist(nearest) <= tallPull * h ? nearest : null;
  }

  // Sayfa çevirme hissi: yönde yeterince ilerlendiyse ileri.
  if (prev !== null && next !== null) {
    if (direction > 0 && y - prev >= forwardCommit * h) return next;
    if (direction < 0 && next - y >= forwardCommit * h) return prev;
  }

  return dist(nearest) <= pull * h ? nearest : null;
}

/** Klavye (PageDown/Space/PageUp) için komşu hizalama noktası; uçta null. */
export function adjacentTarget(points: number[], y: number, direction: 1 | -1): number | null {
  if (direction > 0) return points.find((p) => p > y + 1) ?? null;
  for (let i = points.length - 1; i >= 0; i--) if (points[i] < y - 1) return points[i];
  return null;
}

/** Hizalama süresi (s): taban + mesafe (viewport cinsinden) × katsayı, üst sınırlı. */
export function snapDuration(
  distance: number,
  h: number,
  cfg: { base: number; perViewport: number; max: number },
): number {
  return Math.min(cfg.max, cfg.base + (Math.abs(distance) / h) * cfg.perViewport);
}

/**
 * Hizalama başlayabilir mi? Yalnız KULLANICI kaynaklı hareket beklenir:
 * son input (wheel — trackpad momentum olayları dahil — / touch / tuş) ve
 * son native scroll (touch momentumu, ok tuşları, scrollbar). Lenis'in kendi
 * lerp kuyruğu bilinçli olarak hesaba katılmaz: aksi hâlde ~1.5 sn süzülme
 * bitmeden hizalama başlamaz (kullanıcı "2 sn gecikme" olarak hissetti).
 */
export function idleReady({
  now,
  lastInputAt,
  lastNativeScrollAt,
  idleMs,
  touching,
}: {
  now: number;
  lastInputAt: number;
  lastNativeScrollAt: number;
  idleMs: number;
  touching: boolean;
}): boolean {
  if (touching) return false;
  return now - lastInputAt >= idleMs && now - lastNativeScrollAt >= idleMs;
}
