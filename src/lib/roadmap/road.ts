/**
 * Prizma üst yüzeyindeki yol eğrisi parametreleri.
 */
export interface RoadParams {
  length: number;
  depth: number;
  amplitude: number;
  waves: number;
  phase: number;
  samples: number;
}

/**
 * Varsayılan yol eğrisi yapılandırması.
 */
export const DEFAULT_ROAD: RoadParams = {
  length: 10,
  depth: 3,
  amplitude: 0.9,
  waves: 1.75,
  phase: 0.6,
  samples: 400,
};

/**
 * Örneklenmiş ve yay uzunluğu hesaplanmış yol verisi.
 */
export interface BuiltRoad {
  points: Array<{ x: number; z: number }>;
  cum: number[];
  total: number;
}

/**
 * Normalleştirilmiş s ∈ [0, 1] parametresine göre yol merkez noktasını hesaplar.
 * |z| ≤ depth/2 - 0.2 kısıtına uyar.
 */
export function roadCenter(
  s: number,
  p: RoadParams = DEFAULT_ROAD,
): { x: number; z: number } {
  const sc = Math.max(0, Math.min(1, s));
  const x = (sc - 0.5) * p.length;

  const envelope = 0.35 + 0.65 * Math.sin(Math.PI * sc);
  const maxZ = Math.max(0, p.depth / 2 - 0.2);

  const clampedAmp =
    Math.min(Math.abs(p.amplitude), maxZ) * Math.sign(p.amplitude || 1);
  const rawZ =
    clampedAmp * Math.sin(2 * Math.PI * p.waves * sc + p.phase) * envelope;
  const z = Math.max(-maxZ, Math.min(maxZ, rawZ));

  return { x, z };
}

/**
 * Verilen yol parametrelerine göre ayrık noktaları ve kümülatif yay uzunluklarını oluşturur.
 */
export function buildRoad(p: RoadParams = DEFAULT_ROAD): BuiltRoad {
  const points: Array<{ x: number; z: number }> = [];
  const cum: number[] = [0];

  for (let i = 0; i <= p.samples; i++) {
    const s = i / p.samples;
    const pt = roadCenter(s, p);
    points.push(pt);
    if (i > 0) {
      const prev = points[i - 1];
      const dist = Math.hypot(pt.x - prev.x, pt.z - prev.z);
      cum.push(cum[i - 1] + dist);
    }
  }

  const total = cum[cum.length - 1];
  return { points, cum, total };
}

/**
 * Yay uzunluğu oranı a ∈ [0, 1] temelinde yol üzerindeki konumu ve teğet vektörünü döner.
 * İkili arama ve lineer interpolasyon kullanır.
 */
export function pointAtArc(
  road: BuiltRoad,
  a: number,
): { x: number; z: number; tx: number; tz: number } {
  const ac = Math.max(0, Math.min(1, a));
  const targetDist = ac * road.total;

  let low = 0;
  let high = road.cum.length - 1;
  let idx = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (road.cum[mid] <= targetDist) {
      idx = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const maxIdx = road.points.length - 2;
  const i = Math.max(0, Math.min(maxIdx, idx));

  const segLen = road.cum[i + 1] - road.cum[i];
  const t =
    segLen > 0
      ? Math.max(0, Math.min(1, (targetDist - road.cum[i]) / segLen))
      : 0;

  const p0 = road.points[i];
  const p1 = road.points[i + 1];

  const x = p0.x + t * (p1.x - p0.x);
  const z = p0.z + t * (p1.z - p0.z);

  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;
  const len = Math.hypot(dx, dz);
  const tx = len > 0 ? dx / len : 1;
  const tz = len > 0 ? dz / len : 0;

  return { x, z, tx, tz };
}
