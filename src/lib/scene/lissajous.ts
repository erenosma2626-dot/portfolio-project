/**
 * Kapalı Lissajous eğrisi: x = sin(a·t + phase), y = sin(b·t), t ∈ [0, 2π].
 * Düz [x0, y0, x1, y1, ...] dizisi döner; son nokta ilk noktayla çakışır.
 */
export function lissajousPoints({
  count,
  a,
  b,
  phase,
}: {
  count: number;
  a: number;
  b: number;
  phase: number;
}): Float32Array {
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * Math.PI * 2;
    out[i * 2] = Math.sin(a * t + phase);
    out[i * 2 + 1] = Math.sin(b * t);
  }
  return out;
}

/**
 * 3B Lissajous düğümü: x = sin(a·t + phaseX), y = sin(b·t), z = sin(c·t + phaseZ).
 * Düz [x, y, z, ...] dizisi; kapalı eğri.
 */
export function lissajousKnot({
  count,
  a,
  b,
  c,
  phaseX,
  phaseZ,
}: {
  count: number;
  a: number;
  b: number;
  c: number;
  phaseX: number;
  phaseZ: number;
}): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * Math.PI * 2;
    out[i * 3] = Math.sin(a * t + phaseX);
    out[i * 3 + 1] = Math.sin(b * t);
    out[i * 3 + 2] = Math.sin(c * t + phaseZ);
  }
  return out;
}

/** Noktalar boyunca normalize yay-uzunluğu (0..1); çizimin sabit hızda ilerlemesi için. */
export function arcParams(points: Float32Array, stride: number): Float32Array {
  const count = points.length / stride;
  const out = new Float32Array(count);
  let total = 0;
  for (let i = 1; i < count; i++) {
    let sq = 0;
    for (let k = 0; k < stride; k++) {
      const d = points[i * stride + k] - points[(i - 1) * stride + k];
      sq += d * d;
    }
    total += Math.sqrt(sq);
    out[i] = total;
  }
  if (total > 0) for (let i = 0; i < count; i++) out[i] /= total;
  return out;
}
