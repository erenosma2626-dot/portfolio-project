import type { RoadmapEvent } from "@/content/roadmap";
import { dayIndex, MONTH_NAMES, todayIndex } from "./dates";

/** Zaman aralığı modu */
export type RangeMode = "near" | "far";

/**
 * Zaman penceresi görünüm aralığı (dayIndex cinsinden, end dahil değil).
 */
export interface View {
  start: number;
  end: number;
}

/**
 * İki pozisyonlu zaman aralığı parametreleri.
 */
export const RANGE = {
  near: { pastDays: 30, futureDays: 60 },
  far: { from: "2025-12-01", futureDays: 365 },
} as const;

/**
 * Verilen mod ve referans tarih için görünüm penceresi (start, end) üretir.
 */
export function viewFor(mode: RangeMode, now: Date): View {
  const today = todayIndex(now);
  if (mode === "near") {
    return {
      start: today - RANGE.near.pastDays,
      end: today + RANGE.near.futureDays,
    };
  }
  return {
    start: dayIndex(RANGE.far.from),
    end: today + RANGE.far.futureDays,
  };
}

/**
 * Gün indeksini pencere içi orana (0..1) dönüştürür.
 * Pencere dışı günler için <0 veya >1 dönebilir.
 */
export function project(v: View, day: number): number {
  return (day - v.start) / (v.end - v.start);
}

/**
 * Verilen olaylar arasından görünüm penceresinde (0 ≤ project ≤ 1) kalanları döner.
 */
export function visible(v: View, events: RoadmapEvent[]): RoadmapEvent[] {
  return events.filter((e) => {
    const p = project(v, dayIndex(e.date));
    return p >= 0 && p <= 1;
  });
}

/**
 * Görünüm modu ve penceresine göre kılavuz çizgileri (ticks) üretir.
 * near: her Pazartesi (UTC), ayın 1'ini kapsayan tick major ve "Oct" formatında.
 * far: her ayın 1'i, ilk tick ve Ocak ayları major ("Jan 2027" / "Dec 2025"), diğerleri "Jan".
 */
export function ticks(
  v: View,
  mode: RangeMode,
): Array<{ day: number; label: string; major: boolean }> {
  const result: Array<{ day: number; label: string; major: boolean }> = [];

  if (mode === "near") {
    let current = v.start;
    // İlk Pazartesi gününe ilerle (UTC gün: 1 = Pazartesi)
    while (new Date(current * 86400000).getUTCDay() !== 1) {
      current++;
    }

    while (current < v.end) {
      const d = new Date(current * 86400000);
      const dayOfMonth = d.getUTCDate();
      const monthName = MONTH_NAMES[d.getUTCMonth()];
      // Pazartesiler arası 7 gün olduğundan, ayın 1'ini içeren haftadaki tick 1 <= dayOfMonth <= 7 olur
      const isMajor = dayOfMonth <= 7;
      const label = isMajor ? monthName : `${monthName} ${dayOfMonth}`;

      result.push({
        day: current,
        label,
        major: isMajor,
      });

      current += 7;
    }
  } else {
    // far modu: her ayın 1'i
    const startDate = new Date(v.start * 86400000);
    let year = startDate.getUTCFullYear();
    let month = startDate.getUTCMonth();

    while (true) {
      const firstOfDay = Math.floor(Date.UTC(year, month, 1) / 86400000);
      if (firstOfDay >= v.end) break;

      if (firstOfDay >= v.start) {
        const isFirstTick = result.length === 0;
        const isJanuary = month === 0;
        const isMajor = isFirstTick || isJanuary;
        const monthName = MONTH_NAMES[month];
        const label = isMajor ? `${monthName} ${year}` : monthName;

        result.push({
          day: firstOfDay,
          label,
          major: isMajor,
        });
      }

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  }

  return result;
}
