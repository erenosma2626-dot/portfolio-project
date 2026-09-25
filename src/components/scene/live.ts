import { BufferAttribute, BufferGeometry, Vector2, Vector3, Vector4, type IUniform } from "three";
import { FIGURES, type FigureId } from "@/lib/scene/figures";
import type { RibbonArrays } from "@/lib/scene/geometry";
import { MAX_SCREEN_BANDS } from "@/lib/scene/sections";
import { sceneStore } from "@/lib/scene/store";

/** Kilitli palet — shader'larda başka literal renk yok; ara tonlar alpha ile. */
export const NAVY: [number, number, number] = [17 / 255, 42 / 255, 64 / 255];

/**
 * Frame başına yumuşatılmış sahne değerleri. Director yazar, figürler okur.
 * Frame içinde bellek tahsisi yapılmaması için düz, değiştirilebilir obje.
 */
const zeroPerFigure = () =>
  Object.fromEntries(Object.keys(FIGURES).map((id) => [id, 0])) as Record<FigureId, number>;

export const live = {
  weights: zeroPerFigure(),
  /** Figür görünür olalı beri geçen süre (s); görünmez olunca sıfırlanır. */
  age: zeroPerFigure(),
  /** Hover durumu interpolasyon değeri (0..1). */
  hover: zeroPerFigure(),
  /** Sadece hareket serbestken ilerleyen sahne saati (s). */
  time: 0,
  /** İmza eğrisinin çizilmiş oranı (0..1). */
  signatureDraw: 0,
};

/**
 * Rota değişiminde o rotaya ait olmayan tüm figürlerin ağırlıklarını ve yaşlarını
 * ANINDA sıfırlar (fade-out gecikmesi olmadan keser).
 */
export function cutNonRouteFigures(allowedFigures: readonly FigureId[]) {
  for (const id of Object.keys(live.weights) as FigureId[]) {
    if (!allowedFigures.includes(id)) {
      live.weights[id] = 0;
      live.age[id] = 0;
      live.hover[id] = 0;
    }
  }
}

/**
 * Bölüm bantları + palet: her shader'ın başına eklenir. paper()/ink()
 * piksel başına, pikselin düştüğü bölümün tonuna göre navy/beyaz verir.
 */
export const BANDS_GLSL = /* glsl */ `
  #define MAX_BANDS ${MAX_SCREEN_BANDS}
  uniform vec2 uRes;
  uniform float uPx;
  uniform vec3 uBands[MAX_BANDS];
  uniform int uBandCount;
  const vec3 NAVY = vec3(${NAVY.map((c) => c.toFixed(6)).join(", ")});
  const vec3 WHITE = vec3(1.0);

  float screenY() {
    return (uRes.y - gl_FragCoord.y) / uPx;
  }

  float toneAt(float y) {
    float t = 0.0;
    for (int i = 0; i < MAX_BANDS; i++) {
      if (i >= uBandCount) break;
      vec3 b = uBands[i];
      if (y >= b.x && y < b.y) t = b.z;
    }
    return t;
  }

  vec3 paper(float tone) { return mix(WHITE, NAVY, tone); }
  vec3 ink(float tone) { return mix(NAVY, WHITE, tone); }

  vec2 screenPx() {
    return vec2(gl_FragCoord.x / uPx, screenY());
  }

  // Figür dikdörtgeni (x0, y0, x1, y1; CSS px), kenarda 1px yumuşak.
  float inRect(vec2 p, vec4 r) {
    vec2 a = smoothstep(r.xy - 0.5, r.xy + 0.5, p);
    vec2 b = 1.0 - smoothstep(r.zw - 0.5, r.zw + 0.5, p);
    return a.x * a.y * b.x * b.y;
  }

  // Metin sütunu maskesi: içerik kolonunda (~760px genişlik) alpha x0.6'ya düşer.
  float columnMask(float cssX) {
    float centerDist = abs(cssX - (uRes.x / uPx) * 0.5);
    float inColumn = 1.0 - smoothstep(260.0, 420.0, centerDist);
    return mix(1.0, 0.60, inColumn);
  }
`;

export function bandUniforms(): Record<string, IUniform> {
  return {
    uRes: { value: new Vector2(1, 1) },
    uPx: { value: 1 },
    uBands: { value: Array.from({ length: MAX_SCREEN_BANDS }, () => new Vector3()) },
    uBandCount: { value: 0 },
  };
}

/** Store'daki bantları ve çözünürlüğü uniform'lara yazar (tahsis yok). */
export function writeBandUniforms(
  u: Record<string, IUniform>,
  size: { width: number; height: number },
  dpr: number,
) {
  (u.uRes.value as Vector2).set(size.width * dpr, size.height * dpr);
  u.uPx.value = dpr;
  const { bands } = sceneStore.get();
  const slots = u.uBands.value as Vector3[];
  for (let i = 0; i < bands.length && i < slots.length; i++) {
    slots[i].set(bands[i].y0, bands[i].y1, bands[i].tone);
  }
  u.uBandCount.value = Math.min(bands.length, slots.length);
}

/** Figürün store'daki ekran dikdörtgeni; yoksa tam ekran. */
export function writeRect(
  target: Vector4,
  figure: FigureId,
  size: { width: number; height: number },
) {
  const rect = sceneStore.get().rects[figure];
  if (rect) target.set(rect.x0, rect.y0, rect.x1, rect.y1);
  else target.set(0, 0, size.width, size.height);
}

/**
 * Ekran-uzaylı şerit (ribbon) vertex yardımcısı: komşu noktalar cihaz
 * pikselinde verilir, sabit CSS kalınlıkta şerit köşesi döner (+1px AA payı).
 * Nokta koordinatları: cihaz px, sol-üst orijin, y aşağı.
 */
export const RIBBON_GLSL = /* glsl */ `
  vec4 ribbonClip(vec2 prevPx, vec2 currPx, vec2 nextPx, float side, float widthCss, vec2 res, float px) {
    vec2 dir = normalize(nextPx - prevPx + vec2(1e-6, 0.0));
    vec2 normal = vec2(-dir.y, dir.x);
    vec2 p = currPx + normal * side * (widthCss * px * 0.5 + 1.0);
    return vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, 0.0, 1.0);
  }

  // Şerit kenar kapsaması: side ±1 boyunca antialias.
  float ribbonCoverage(float side, float widthCss, float px) {
    float halfW = widthCss * px * 0.5;
    return clamp(halfW + 0.5 - abs(side) * (halfW + 1.0), 0.0, 1.0);
  }
`;

export function ribbonGeometry(r: RibbonArrays, dims: number) {
  const geometry = new BufferGeometry();
  // three position'ı 3 bileşen bekler; 2B veride z = 0 eklenir.
  const pad = (a: Float32Array) => {
    if (dims === 3) return a;
    const out = new Float32Array((a.length / dims) * 3);
    for (let i = 0; i < a.length / dims; i++) {
      out[i * 3] = a[i * dims];
      out[i * 3 + 1] = a[i * dims + 1];
    }
    return out;
  };
  geometry.setAttribute("position", new BufferAttribute(pad(r.curr), 3));
  geometry.setAttribute("aPrev", new BufferAttribute(pad(r.prev), 3));
  geometry.setAttribute("aNext", new BufferAttribute(pad(r.next), 3));
  geometry.setAttribute("aSide", new BufferAttribute(r.side, 1));
  geometry.setAttribute("aT", new BufferAttribute(r.t, 1));
  geometry.setAttribute("aLine", new BufferAttribute(r.line, 1));
  geometry.setIndex(new BufferAttribute(r.index, 1));
  return geometry;
}
