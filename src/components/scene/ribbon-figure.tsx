"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, Mesh, ShaderMaterial, Vector4, type IUniform } from "three";
import { ROUTE_ALLOWED_FIGURES, type FigureId } from "@/lib/scene/figures";
import type { RibbonArrays } from "@/lib/scene/geometry";
import { sceneStore } from "@/lib/scene/store";
import {
  BANDS_GLSL,
  RIBBON_GLSL,
  bandUniforms,
  live,
  ribbonGeometry,
  writeBandUniforms,
  writeRect,
} from "./live";

const COMMON = /* glsl */ `
  uniform vec4 uRect;
  uniform float uWeight;
  uniform float uTime;
  uniform float uAge;
  uniform float uScroll;
  uniform float uWidth;
  uniform float uHover;
  varying float vSide;
  varying float vT;
  varying float vLine;
  varying float vDepth;

  // Plaka koordinatı (0..1, y aşağı) → cihaz pikseli.
  vec2 plateToPx(vec2 uv) {
    return (uRect.xy + uv * (uRect.zw - uRect.xy)) * uPx;
  }
`;

/**
 * Ekran-uzaylı sabit kalınlıkta çok-çizgi figürü. `project` (vertex):
 * vec3 → (cihaz px x, y [y aşağı], derinlik). `shade` (fragment): kapsama
 * dışındaki alpha çarpanı (çizim ilerlemesi, nabız, derinlik…).
 */
export function RibbonFigure({
  id,
  arrays,
  dims,
  project,
  shade,
  width = 1,
  renderOrder = 2,
  uniforms: extra,
}: {
  id: FigureId;
  arrays: RibbonArrays;
  dims: number;
  project: string;
  shade: string;
  width?: number;
  renderOrder?: number;
  uniforms?: Record<string, IUniform>;
}) {
  const meshRef = useRef<Mesh>(null);
  const { geometry, material } = useMemo(
    () => ({
      geometry: ribbonGeometry(arrays, dims),
      material: new ShaderMaterial({
        vertexShader: /* glsl */ `
          uniform vec2 uRes;
          uniform float uPx;
          attribute vec3 aPrev;
          attribute vec3 aNext;
          attribute float aSide;
          attribute float aT;
          attribute float aLine;
          ${COMMON}
          ${RIBBON_GLSL}
          ${project}
          void main() {
            vec3 c = project(position);
            vec3 a = project(aPrev);
            vec3 b = project(aNext);
            vSide = aSide;
            vT = aT;
            vLine = aLine;
            vDepth = c.z;
            gl_Position = ribbonClip(a.xy, c.xy, b.xy, aSide, uWidth, uRes, uPx);
          }
        `,
        fragmentShader: /* glsl */ `
          ${BANDS_GLSL}
          ${COMMON}
          ${RIBBON_GLSL}
          ${shade}
          void main() {
            vec2 p = screenPx();
            float a = ribbonCoverage(vSide, uWidth, uPx) * shade();
            gl_FragColor = vec4(ink(toneAt(p.y)), a * uWeight * inRect(p, uRect));
          }
        `,
        transparent: true,
        side: DoubleSide,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          ...bandUniforms(),
          uRect: { value: new Vector4() },
          uWeight: { value: 0 },
          uTime: { value: 0 },
          uAge: { value: 0 },
          uScroll: { value: 0 },
          uWidth: { value: width },
          uHover: { value: 0 },
          ...extra,
        },
      }),
    }),
    // Geometri ve shader bileşen ömrü boyunca sabit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
    const u = (mesh.material as ShaderMaterial).uniforms;
    writeBandUniforms(u, size, viewport.dpr);
    writeRect(u.uRect.value, id, size);
    u.uWeight.value = live.weights[id];
    u.uTime.value = live.time;
    u.uAge.value = live.age[id];
    u.uHover.value = live.hover[id] ?? 0;
    const { pathname, scrollY } = sceneStore.get();
    const allowed = ROUTE_ALLOWED_FIGURES[pathname];
    const isAllowed = !allowed || allowed.includes(id);
    u.uScroll.value = scrollY;
    mesh.visible = isAllowed && live.weights[id] > 0;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}
