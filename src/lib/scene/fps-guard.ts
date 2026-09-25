/**
 * Adaptif kalite merdiveni: full → low-dpr (DPR 1) → static (animasyon durur).
 * Sadece sürekli animasyon karelerinde beslenir. 60 karelik pencerede ortalama
 * kare süresi 22 ms'yi (~45 fps) aşarsa bir kademe iner; geri çıkmaz (kararlı).
 * 250 ms'den uzun tek kareler (sekme dönüşü, GC) örneğe alınmaz.
 */
export type GuardLevel = "full" | "low-dpr" | "static";

export interface GuardState {
  level: GuardLevel;
  samples: number;
  total: number;
}

const WINDOW = 60;
const SLOW_FRAME = 0.022;
const OUTLIER = 0.25;
const NEXT: Record<GuardLevel, GuardLevel> = { full: "low-dpr", "low-dpr": "static", static: "static" };

export function initialGuard(): GuardState {
  return { level: "full", samples: 0, total: 0 };
}

export function stepGuard(state: GuardState, dt: number): GuardState {
  if (state.level === "static" || dt > OUTLIER) return state;
  const samples = state.samples + 1;
  const total = state.total + dt;
  if (samples < WINDOW) return { ...state, samples, total };
  if (total / samples > SLOW_FRAME) return { level: NEXT[state.level], samples: 0, total: 0 };
  return { level: state.level, samples: 0, total: 0 };
}
