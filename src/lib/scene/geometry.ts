/**
 * Figür geometrisi için saf yardımcılar (three'den bağımsız, test edilebilir).
 */

export interface RibbonArrays {
  curr: Float32Array;
  prev: Float32Array;
  next: Float32Array;
  side: Float32Array;
  t: Float32Array;
  line: Float32Array;
  index: Uint32Array;
}

/**
 * Açık çok-çizgilerden ekran-uzaylı şerit (ribbon) verisi: her nokta iki
 * köşe (side ±1); prev/next komşular (uçlarda kendisi); t her çizgide
 * yay-uzunluğuna göre 0..1; line çizgi indeksi. Çizgiler arasında üçgen yok.
 */
export function ribbonArrays(lines: Float32Array[], dims: number): RibbonArrays {
  const total = lines.reduce((sum, l) => sum + l.length / dims, 0);
  const curr = new Float32Array(total * 2 * dims);
  const prev = new Float32Array(total * 2 * dims);
  const next = new Float32Array(total * 2 * dims);
  const side = new Float32Array(total * 2);
  const t = new Float32Array(total * 2);
  const line = new Float32Array(total * 2);
  const index: number[] = [];

  let base = 0;
  lines.forEach((pts, lineIndex) => {
    const n = pts.length / dims;
    const lengths = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      let sq = 0;
      for (let k = 0; k < dims; k++) {
        const d = pts[i * dims + k] - pts[(i - 1) * dims + k];
        sq += d * d;
      }
      lengths[i] = lengths[i - 1] + Math.sqrt(sq);
    }
    const len = lengths[n - 1] || 1;

    for (let i = 0; i < n; i++) {
      const p = Math.max(i - 1, 0);
      const q = Math.min(i + 1, n - 1);
      for (let s = 0; s < 2; s++) {
        const v = (base + i) * 2 + s;
        for (let k = 0; k < dims; k++) {
          curr[v * dims + k] = pts[i * dims + k];
          prev[v * dims + k] = pts[p * dims + k];
          next[v * dims + k] = pts[q * dims + k];
        }
        side[v] = s === 0 ? -1 : 1;
        t[v] = lengths[i] / len;
        line[v] = lineIndex;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = (base + i) * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    base += n;
  });

  return { curr, prev, next, side, t, line, index: Uint32Array.from(index) };
}

/** Deterministik PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller ile standart normal. */
function gaussian(random: () => number) {
  const u = Math.max(random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/**
 * Tek kökten Monte Carlo yolları: x 0→1, y hafif pozitif sürüklenmeli
 * Brown hareketi (σ√t yayılımı). Her yol düz [x0, y0, x1, y1, ...].
 */
export function monteCarloPaths({
  seed,
  count,
  steps,
  drift = 0.12,
  volatility = 0.55,
}: {
  seed: number;
  count: number;
  steps: number;
  drift?: number;
  volatility?: number;
}): Float32Array[] {
  const random = rng(seed);
  const dt = 1 / steps;
  return Array.from({ length: count }, () => {
    const path = new Float32Array((steps + 1) * 2);
    let y = 0;
    for (let i = 1; i <= steps; i++) {
      y += drift * dt + volatility * Math.sqrt(dt) * gaussian(random);
      path[i * 2] = i / steps;
      path[i * 2 + 1] = y;
    }
    return path;
  });
}

/** Katmanlı sinir ağı yerleşimi: katmanlar soldan sağa, düğümler dikey ortalı; [0,1]². */
export function networkLayout(layers: number[]) {
  const nodes: { x: number; y: number; layer: number }[] = [];
  const firstIndex: number[] = [];
  const maxNodes = Math.max(...layers);
  layers.forEach((count, layer) => {
    firstIndex.push(nodes.length);
    const x = layers.length === 1 ? 0.5 : layer / (layers.length - 1);
    const spread = (count - 1) / Math.max(maxNodes - 1, 1);
    for (let i = 0; i < count; i++) {
      const y = count === 1 ? 0.5 : 0.5 - spread / 2 + (spread * i) / (count - 1);
      nodes.push({ x, y, layer });
    }
  });
  const edges: [number, number][] = [];
  for (let l = 0; l < layers.length - 1; l++) {
    for (let i = 0; i < layers[l]; i++) {
      for (let j = 0; j < layers[l + 1]; j++) {
        edges.push([firstIndex[l] + i, firstIndex[l + 1] + j]);
      }
    }
  }
  return { nodes, edges };
}
