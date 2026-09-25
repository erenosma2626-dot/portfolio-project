import { pointAtArc, type BuiltRoad } from "./road";

type XZ = { x: number; z: number };

/** "YYYY-MM" → "Aug 2026" (ay adları içerik sözlüğünden). */
export function formatMonth(date: string, months: readonly string[]): string {
  const [year, month] = date.split("-");
  return `${months[Number(month) - 1]} ${year}`;
}

/**
 * Yolu yay oranı `a`'da (bugün) ikiye böler: done (geçmiş, düz) ve planned
 * (gelecek, kesik). Kesim noktası iki parçada da yer alır → çizgi kopmaz.
 */
export function splitRoadAtArc(road: BuiltRoad, a: number): { done: XZ[]; planned: XZ[] } {
  if (a <= 0) return { done: [], planned: road.points.slice() };
  if (a >= 1) return { done: [...road.points, road.points[road.points.length - 1]], planned: [road.points[road.points.length - 1]] };
  const target = a * road.total;
  let idx = 0;
  while (idx + 1 < road.cum.length && road.cum[idx + 1] <= target) idx++;
  const p = pointAtArc(road, a);
  const cut = { x: p.x, z: p.z };
  return {
    done: [...road.points.slice(0, idx + 1), cut],
    planned: [cut, ...road.points.slice(idx + 1)],
  };
}

/**
 * Kartın konumu (kapsayıcı CSS px): çapanın üstünde ortalı; yer yoksa alta
 * döner; yatayda kapsayıcı kenarlarına kırpılır.
 */
export function cardPlacement({
  anchorX,
  anchorY,
  cardW,
  cardH,
  containerW,
  gap,
  margin,
  minTop = margin,
}: {
  anchorX: number;
  anchorY: number;
  cardW: number;
  cardH: number;
  containerW: number;
  gap: number;
  margin: number;
  /** Kartın üst kenarı için en küçük değer (konteyner dışına taşmaya izin). */
  minTop?: number;
}): { left: number; top: number; placement: "above" | "below" } {
  const left = Math.min(Math.max(anchorX - cardW / 2, margin), containerW - cardW - margin);
  const aboveTop = anchorY - gap - cardH;
  if (aboveTop >= minTop) return { left, top: aboveTop, placement: "above" };
  return { left, top: anchorY + gap, placement: "below" };
}
