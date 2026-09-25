"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Mesh, PlaneGeometry, ShaderMaterial } from "three";
import { BANDS_GLSL, bandUniforms, writeBandUniforms } from "../live";

/** Zemin: piksel başına bölüm tonu (beyaz/navy). Bölüm kenarında keskin invert. */
const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const fragmentShader = /* glsl */ `
  ${BANDS_GLSL}
  void main() {
    gl_FragColor = vec4(paper(toneAt(screenY())), 1.0);
  }
`;

export function PaperFigure() {
  const meshRef = useRef<Mesh>(null);
  const { geometry, material } = useMemo(
    () => ({
      geometry: new PlaneGeometry(2, 2),
      material: new ShaderMaterial({
        vertexShader,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        uniforms: bandUniforms(),
      }),
    }),
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
    writeBandUniforms((mesh.material as ShaderMaterial).uniforms, size, viewport.dpr);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} frustumCulled={false} renderOrder={0} />
  );
}
