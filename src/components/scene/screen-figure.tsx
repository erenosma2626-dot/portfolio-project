"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Mesh, PlaneGeometry, ShaderMaterial, Vector4, type IUniform } from "three";
import { ROUTE_ALLOWED_FIGURES, type FigureId } from "@/lib/scene/figures";
import { sceneStore } from "@/lib/scene/store";
import { BANDS_GLSL, bandUniforms, live, writeBandUniforms, writeRect } from "./live";

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/**
 * Tam ekran quad üzerinde çizilen figür. Ortak uniform'lar: bölüm bantları
 * (paper/ink), uRect (figürün ekran dikdörtgeni), uWeight, uTime (sahne
 * saati), uAge (figür görüneli beri), uScroll. Shader `body` içinde
 * `vec4 figure(vec2 p)` tanımlar; p = CSS px (sol-üst orijin).
 */
export function ScreenFigure({
  id,
  body,
  renderOrder = 1,
  uniforms: extra,
}: {
  id: FigureId;
  body: string;
  renderOrder?: number;
  uniforms?: Record<string, IUniform>;
}) {
  const meshRef = useRef<Mesh>(null);
  const { geometry, material } = useMemo(
    () => ({
      geometry: new PlaneGeometry(2, 2),
      material: new ShaderMaterial({
        vertexShader,
        fragmentShader: /* glsl */ `
          ${BANDS_GLSL}
          uniform vec4 uRect;
          uniform float uWeight;
          uniform float uTime;
          uniform float uAge;
          uniform float uScroll;
          uniform float uHover;
          ${body}
          void main() {
            vec2 p = screenPx();
            vec4 c = figure(p);
            gl_FragColor = vec4(c.rgb, c.a * uWeight * inRect(p, uRect));
          }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          ...bandUniforms(),
          uRect: { value: new Vector4() },
          uWeight: { value: 0 },
          uTime: { value: 0 },
          uAge: { value: 0 },
          uScroll: { value: 0 },
          uHover: { value: 0 },
          ...extra,
        },
      }),
    }),
    // Shader gövdesi ve ek uniform'lar bileşen ömrü boyunca sabit.
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
    // Frame başına uniform güncellemesi ref üzerinden (React state değil).
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
