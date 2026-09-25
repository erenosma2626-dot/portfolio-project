import { project, type View } from "./timescale";

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const inside = (v: View, day: number) => {
  const p = project(v, day);
  return p >= 0 && p <= 1 ? 1 : 0;
};

/**
 * near↔far geçişinde bir günün (olay, tick, today) karesi: yol üzerindeki
 * yay oranı iki pencere arasında kayar; pencereden çıkan soluklaşır, giren
 * belirir. t: eased ilerleme (0 = eski, 1 = yeni).
 */
export function eventFrame(day: number, from: View, to: View, t: number) {
  const a = project(from, day);
  const b = project(to, day);
  const arc = Math.min(1, Math.max(0, a + (b - a) * t));
  const oa = inside(from, day);
  const ob = inside(to, day);
  return { arc, opacity: oa + (ob - oa) * t };
}
