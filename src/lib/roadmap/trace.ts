export type Pt = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };

/**
 * Toptan kart çerçevesine iki ışık yolu: önce topa yakın kenarın köşelerine,
 * sonra yan kenarlar boyunca, karşı kenarın ortasında buluşur.
 */
export function tracePaths(ball: Pt, card: Rect, placement: "above" | "below") {
  const l = card.left;
  const r = card.left + card.width;
  const near = placement === "above" ? card.top + card.height : card.top;
  const far = placement === "above" ? card.top : card.top + card.height;
  const mid = { x: card.left + card.width / 2, y: far };
  return {
    left: [ball, { x: l, y: near }, { x: l, y: far }, mid],
    right: [ball, { x: r, y: near }, { x: r, y: far }, mid],
  };
}

export function polylineLength(pts: Pt[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return s;
}

/** Çok-çizgi boyunca `frac` (0..1) oranındaki nokta. */
export function pointAlong(pts: Pt[], frac: number): Pt {
  const target = Math.min(1, Math.max(0, frac)) * polylineLength(pts);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (acc + seg >= target) {
      const k = seg ? (target - acc) / seg : 0;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}
