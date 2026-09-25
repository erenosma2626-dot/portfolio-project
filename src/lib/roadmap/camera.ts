/**
 * Roadmap prizması için küçük bir kamera: dünya koordinatları (x sağ, y yukarı,
 * z izleyiciye doğru; prizmanın üst yüzü y=0) → ekran (SVG, y aşağı).
 * Önce yaw (Y ekseni), sonra elevation (X ekseni) döndürülür; kamera +z'de
 * `distance` uzaklıkta, -z'ye bakar. Saf ve test edilebilir.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Camera {
  /** Yukarıdan bakış açısı (radyan). */
  elevation: number;
  /** Yatay dönüş (radyan) — scroll paralaksı burayı hafifçe oynatır. */
  yaw: number;
  distance: number;
}

export interface Prism {
  length: number;
  depth: number;
  height: number;
}

export const DEFAULT_CAMERA: Camera = { elevation: (40 * Math.PI) / 180, yaw: 0, distance: 16 };

export function toCamera(p: Vec3, cam: Camera): Vec3 {
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const x1 = p.x * cy - p.z * sy;
  const z1 = p.x * sy + p.z * cy;
  const ce = Math.cos(cam.elevation);
  const se = Math.sin(cam.elevation);
  return { x: x1, y: p.y * ce - z1 * se, z: p.y * se + z1 * ce };
}

/** Perspektif izdüşüm: ekran birimi dünya birimiyle aynı ölçekte (merkez 0,0). */
export function projectPoint(p: Vec3, cam: Camera): { x: number; y: number; depth: number } {
  const c = toCamera(p, cam);
  const f = cam.distance / (cam.distance - c.z);
  return { x: c.x * f, y: -c.y * f, depth: cam.distance - c.z };
}

/** Köşeler: indeks bitleri (x: 1, y: 2, z: 4) — 0 = sol-alt-arka. */
export function prismCorners(p: Prism): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < 8; i++) {
    out.push({
      x: (i & 1 ? 0.5 : -0.5) * p.length,
      y: i & 2 ? 0 : -p.height,
      z: (i & 4 ? 0.5 : -0.5) * p.depth,
    });
  }
  return out;
}

/** 12 kenar: tek bitte farklı köşe çiftleri. */
export const PRISM_EDGES: [number, number][] = (() => {
  const edges: [number, number][] = [];
  for (let a = 0; a < 8; a++) {
    for (const bit of [1, 2, 4]) {
      const b = a | bit;
      if (b !== a) edges.push([a, b]);
    }
  }
  return edges;
})();

/** Yüzler: sabit bit + değeri; normal o eksende ±. */
const FACES = [
  { bit: 1, on: true, normal: { x: 1, y: 0, z: 0 } },
  { bit: 1, on: false, normal: { x: -1, y: 0, z: 0 } },
  { bit: 2, on: true, normal: { x: 0, y: 1, z: 0 } },
  { bit: 2, on: false, normal: { x: 0, y: -1, z: 0 } },
  { bit: 4, on: true, normal: { x: 0, y: 0, z: 1 } },
  { bit: 4, on: false, normal: { x: 0, y: 0, z: -1 } },
];

/** Kameraya bakan yüzlere komşu kenarlar (dışbükey kutu → gizli kenar yok). */
export function visibleEdges(p: Prism, cam: Camera): [number, number][] {
  const corners = prismCorners(p);
  const visible = FACES.filter((face) => {
    const members = corners.filter((_, i) => Boolean(i & face.bit) === face.on);
    const center = {
      x: members.reduce((s, c) => s + c.x, 0) / 4,
      y: members.reduce((s, c) => s + c.y, 0) / 4,
      z: members.reduce((s, c) => s + c.z, 0) / 4,
    };
    const cc = toCamera(center, cam);
    const n = toCamera(face.normal, cam);
    // Kamera (0,0,distance) - yüz merkezi, normal ile aynı yönde mi?
    return -cc.x * n.x - cc.y * n.y + (cam.distance - cc.z) * n.z > 0;
  });
  return PRISM_EDGES.filter(([a, b]) =>
    visible.some((face) => Boolean(a & face.bit) === face.on && Boolean(b & face.bit) === face.on),
  );
}
