import type { RoadmapEvent } from "@/content/roadmap";
import { dayIndex } from "./dates";
import { project, type View } from "./timescale";

/**
 * Kümelenmiş yol haritası olay grubu.
 */
export interface EventCluster {
  at: number; /* project ortalaması (0..1) */
  events: RoadmapEvent[];
}

/**
 * Görünür pencere içindeki olayları tarihe göre sıralar ve birbirine minGap'ten
 * daha yakın olan ardışık olayları aynı kümede birleştirir.
 */
export function clusterEvents(
  v: View,
  events: RoadmapEvent[],
  minGap = 0.04,
): EventCluster[] {
  // Sadece pencere içi olaylar: project ∈ [0, 1]
  const inWindow = events
    .map((event) => ({
      event,
      dIdx: dayIndex(event.date),
      p: project(v, dayIndex(event.date)),
    }))
    .filter((item) => item.p >= 0 && item.p <= 1);

  if (inWindow.length === 0) {
    return [];
  }

  // Tarihe göre artan sırala
  inWindow.sort((a, b) => a.dIdx - b.dIdx);

  interface WorkingCluster {
    positions: number[];
    events: RoadmapEvent[];
  }

  const clusters: WorkingCluster[] = [];

  for (const item of inWindow) {
    if (clusters.length === 0) {
      clusters.push({
        positions: [item.p],
        events: [item.event],
      });
      continue;
    }

    const lastCluster = clusters[clusters.length - 1];
    const lastPos = lastCluster.positions[lastCluster.positions.length - 1];

    if (item.p - lastPos < minGap) {
      lastCluster.positions.push(item.p);
      lastCluster.events.push(item.event);
    } else {
      clusters.push({
        positions: [item.p],
        events: [item.event],
      });
    }
  }

  return clusters.map((c) => ({
    at: c.positions.reduce((sum, val) => sum + val, 0) / c.positions.length,
    events: c.events,
  }));
}
