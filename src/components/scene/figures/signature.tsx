"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, ShaderMaterial } from "three";
import { arcParams, lissajousKnot } from "@/lib/scene/lissajous";
import { BANDS_GLSL, bandUniforms, live, writeBandUniforms } from "../live";

const POINTS = 1400;

/**
 * Ekran-uzayında sabit kalınlıkta şerit (ribbon): her nokta için iki köşe,
 * yön komşu noktalardan vertex shader'da hesaplanır. Böylece çizgi her DPR'de
 * aynı CSS kalınlığında ve antialias'lı kalır (WebGL'in 1px çizgi sınırı yok).
 */
function buildRibbon() {
  const pts = lissajousKnot({ count: POINTS, a: 3, b: 2, c: 5, phaseX: Math.PI / 2, phaseZ: 0.35 });
  const params = arcParams(pts, 3);
  const n = POINTS;
  const curr = new Float32Array(n * 2 * 3);
  const prev = new Float32Array(n * 2 * 3);
  const next = new Float32Array(n * 2 * 3);
  const side = new Float32Array(n * 2);
  const t = new Float32Array(n * 2);

  // Kapalı eğri: ilk ve son nokta aynı; komşular dikişin öbür yanından.
  const at = (i: number) => {
    const j = i < 0 ? n - 2 : i >= n ? 1 : i;
    return [pts[j * 3], pts[j * 3 + 1], pts[j * 3 + 2]];
  };

  for (let i = 0; i < n; i++) {
    const c = at(i);
    const p = at(i - 1);
    const q = at(i + 1);
    for (let s = 0; s < 2; s++) {
      const v = i * 2 + s;
      curr.set(c, v * 3);
      prev.set(p, v * 3);
      next.set(q, v * 3);
      side[v] = s === 0 ? -1 : 1;
      t[v] = params[i];
    }
  }

  const index: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(curr, 3));
  geometry.setAttribute("aPrev", new BufferAttribute(prev, 3));
  geometry.setAttribute("aNext", new BufferAttribute(next, 3));
  geometry.setAttribute("aSide", new BufferAttribute(side, 1));
  geometry.setAttribute("aT", new BufferAttribute(t, 1));
  geometry.setIndex(index);
  return geometry;
}

const vertexShader = /* glsl */ `
  uniform vec2 uRes;
  uniform float uPx;
  attribute vec3 aPrev;
  attribute vec3 aNext;
  attribute float aSide;
  attribute float aT;

  uniform float uScale;
  uniform float uTheta;
  uniform float uWidth;

  varying float vSide;
  varying float vT;
  varying float vDepth;

  // Y ekseni etrafında dönen 3B düğüm + hafif perspektif → piksel (merkezden).
  vec3 project(vec3 p) {
    float c = cos(uTheta);
    float s = sin(uTheta);
    vec3 r = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
    float persp = 1.0 / (1.0 + r.z * 0.22);
    return vec3(r.xy * persp * uScale, r.z);
  }

  void main() {
    vec3 c = project(position);
    vec2 a = project(aPrev).xy;
    vec2 b = project(aNext).xy;
    vec2 dir = normalize(b - a + 1e-6);
    vec2 normal = vec2(-dir.y, dir.x);
    // +1 cihaz pikseli: kenar antialias'ı için pay.
    float halfW = uWidth * uPx * 0.5 + 1.0;
    vec2 px = c.xy + normal * aSide * halfW;

    vSide = aSide;
    vT = aT;
    vDepth = c.z;
    gl_Position = vec4(px * 2.0 / uRes, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  ${BANDS_GLSL}
  uniform float uWidth;
  uniform float uDraw;
  uniform float uAlpha;

  varying float vSide;
  varying float vT;
  varying float vDepth;

  void main() {
    if (vT > uDraw) discard;
    float halfW = uWidth * uPx * 0.5;
    float dist = abs(vSide) * (halfW + 1.0);
    float coverage = clamp(halfW + 0.5 - dist, 0.0, 1.0);

    // Arkada kalan kısımlar daha soluk: derinlik ipucu.
    float depth = mix(1.0, 0.45, clamp(vDepth * 0.5 + 0.5, 0.0, 1.0));
    // Çizilirken kalemin ucu biraz koyu.
    float tip = uDraw < 1.0 ? 1.0 + 1.4 * (1.0 - smoothstep(0.0, 0.035, uDraw - vT)) : 1.0;

    gl_FragColor = vec4(ink(toneAt(screenY())), coverage * depth * tip * uAlpha);
  }
`;

export function SignatureFigure() {
  const meshRef = useRef<Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const geometry = buildRibbon();
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      // Şerit yönü eğri boyunca döner; yüz ayıklama yarısını silmesin.
      side: DoubleSide,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        ...bandUniforms(),
        uScale: { value: 300 },
        uTheta: { value: 0 },
        uWidth: { value: 1.25 },
        uDraw: { value: 0 },
        uAlpha: { value: 0 },
      },
    });
    return { geometry, material };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(({ size, viewport }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Frame başına uniform güncellemesi ref üzerinden (React state değil).
    const u = (mesh.material as ShaderMaterial).uniforms;
    const w = size.width * viewport.dpr;
    const h = size.height * viewport.dpr;
    writeBandUniforms(u, size, viewport.dpr);
    // Perspektif payı (~1.28×) dahil ekranda kalsın.
    u.uScale.value = Math.min(w * 0.36, h * 0.36);
    u.uTheta.value = 0.35 + live.time * 0.11;
    u.uDraw.value = live.signatureDraw;
    // Intro kartı zeminde okunaklı kalsın: en fazla %20 alpha.
    u.uAlpha.value = 0.2 * live.weights.signature;
    mesh.visible = live.weights.signature > 0;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={2}
    />
  );
}
