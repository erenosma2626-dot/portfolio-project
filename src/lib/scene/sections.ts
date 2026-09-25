import type { FigureId } from "./figures";

export type Tone = "light" | "dark";

/** Belge koordinatlarında ölçülmüş bir bölüm. */
export interface SectionBand {
  top: number;
  bottom: number;
  tone: Tone;
  figure: FigureId;
}

/**
 * Viewport'a düşen bölüm dilimi, ekran koordinatlarında (CSS px, yukarıdan
 * aşağı). tone: 0 = beyaz zemin, 1 = navy zemin. Canvas zemini ve çizgi
 * mürekkebini piksel başına bu bantlardan hesaplar → invert tam bölüm
 * kenarında olur, ekran hiçbir an "ara ton"a boyanmaz.
 */
export interface ScreenBand {
  y0: number;
  y1: number;
  tone: number;
  figure: FigureId;
}

/** Shader uniform dizisinin boyutu. Bölümler ≥ viewport yüksekliğinde; 4 bol. */
export const MAX_SCREEN_BANDS = 4;

export function screenBands(bands: SectionBand[], scrollY: number, viewportHeight: number): ScreenBand[] {
  const out: ScreenBand[] = [];
  for (const band of bands) {
    const y0 = Math.max(band.top - scrollY, 0);
    const y1 = Math.min(band.bottom - scrollY, viewportHeight);
    if (y1 <= y0) continue;
    out.push({ y0, y1, tone: band.tone === "dark" ? 1 : 0, figure: band.figure });
    if (out.length === MAX_SCREEN_BANDS) break;
  }
  return out;
}

/** Figürün çizileceği ekran dikdörtgeni (CSS px). */
export interface ScreenRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Figürün ilk görünür bandı, tam genişlikte; yoksa null. */
export function figureRect(bands: ScreenBand[], figure: FigureId, width: number): ScreenRect | null {
  const band = bands.find((b) => b.figure === figure);
  return band ? { x0: 0, y0: band.y0, x1: width, y1: band.y1 } : null;
}

/** Bir "plaka" elemanının (portre alanı) viewport'a kırpılmış dikdörtgeni; görünmüyorsa null. */
export function clipRect(rect: ScreenRect, width: number, height: number): ScreenRect | null {
  const out = {
    x0: Math.max(rect.x0, 0),
    y0: Math.max(rect.y0, 0),
    x1: Math.min(rect.x1, width),
    y1: Math.min(rect.y1, height),
  };
  return out.x1 > out.x0 && out.y1 > out.y0 ? out : null;
}

/** Ekran y'sinin altındaki bölümün tonu (header rengi için); yoksa light. */
export function toneUnder(
  rects: { top: number; bottom: number; tone: Tone }[],
  y: number,
): Tone {
  return rects.find((r) => y >= r.top && y < r.bottom)?.tone ?? "light";
}

/**
 * Viewport'un ortasındaki (veya en yakın) bölümün figürünü döner.
 * /projects gibi sayfalarda arka planda ekrandaki aktif projenin portresini seçmek için kullanılır.
 */
export function activeCenterFigure(bands: SectionBand[], centerY: number): FigureId | null {
  const candidates = bands.filter((b) => b.figure !== "none");
  if (candidates.length === 0) return null;

  const inside = candidates.find((b) => centerY >= b.top && centerY < b.bottom);
  if (inside) return inside.figure;

  let best = candidates[0];
  let bestDist = Math.abs((best.top + best.bottom) * 0.5 - centerY);
  for (let i = 1; i < candidates.length; i++) {
    const dist = Math.abs((candidates[i].top + candidates[i].bottom) * 0.5 - centerY);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidates[i];
    }
  }
  return best.figure;
}
