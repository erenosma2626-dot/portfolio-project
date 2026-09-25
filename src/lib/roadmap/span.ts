import type { RoadmapEvent } from "@/content/roadmap";
import { dayIndex, MONTH_NAMES, todayIndex } from "./dates";
import { pointAtArc, type BuiltRoad } from "./road";

type XZ = { x: number; z: number };

/**
 * Bir olayın süre bitişini gün indeksi (dayIndex) olarak hesaplar:
 * - endDate varsa: dayIndex(e.endDate)
 * - endDate yoksa:
 *   - done ise: today
 *   - planned ise: dayIndex(e.date) (uzunluk 0)
 */
export function spanEnd(e: RoadmapEvent, today: number | Date): number {
  if (e.endDate) {
    return dayIndex(e.endDate);
  }
  const todayIdx = typeof today === "number" ? today : todayIndex(today);
  if (e.status === "done") {
    return todayIdx;
  }
  return dayIndex(e.date);
}

/**
 * Kart künyesi veya etiket için olay tarih aralığını biçimlendirir:
 * - endDate varsa (aynı yıl): "Sep 8 – Oct 2, 2026"
 * - endDate varsa (farklı yıl): "Dec 10, 2025 – Feb 15, 2026"
 * - done ve endDate yoksa: "Sep 8, 2026 – ongoing"
 * - planned ve endDate yoksa: "Oct 12, 2026"
 */
export function formatEventRange(e: RoadmapEvent): string {
  const startDay = dayIndex(e.date);
  const startDate = new Date(startDay * 86400000);
  const startMonth = MONTH_NAMES[startDate.getUTCMonth()];
  const startD = startDate.getUTCDate();
  const startYear = startDate.getUTCFullYear();

  if (e.endDate) {
    const endDay = dayIndex(e.endDate);
    const endDate = new Date(endDay * 86400000);
    const endMonth = MONTH_NAMES[endDate.getUTCMonth()];
    const endD = endDate.getUTCDate();
    const endYear = endDate.getUTCFullYear();

    if (startYear === endYear) {
      return `${startMonth} ${startD} – ${endMonth} ${endD}, ${startYear}`;
    }
    return `${startMonth} ${startD}, ${startYear} – ${endMonth} ${endD}, ${endYear}`;
  }

  if (e.status === "done") {
    return `${startMonth} ${startD}, ${startYear} – ongoing`;
  }

  return `${startMonth} ${startD}, ${startYear}`;
}

/**
 * Yol üzerinde iki yay oranı (a1..a2) arasındaki alt segment noktalarını döner.
 */
export function roadSpanPoints(
  road: BuiltRoad,
  a1: number,
  a2: number,
): XZ[] {
  const minA = Math.max(0, Math.min(1, a1));
  const maxA = Math.max(0, Math.min(1, a2));

  if (maxA <= minA) {
    const p = pointAtArc(road, minA);
    return [{ x: p.x, z: p.z }];
  }

  const startDist = minA * road.total;
  const endDist = maxA * road.total;

  const startPt = pointAtArc(road, minA);
  const endPt = pointAtArc(road, maxA);

  const interior: XZ[] = [];
  for (let i = 0; i < road.points.length; i++) {
    const d = road.cum[i];
    if (d > startDist && d < endDist) {
      interior.push(road.points[i]);
    }
  }

  return [{ x: startPt.x, z: startPt.z }, ...interior, { x: endPt.x, z: endPt.z }];
}
