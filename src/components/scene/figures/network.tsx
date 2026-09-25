"use client";

import { useMemo } from "react";
import { Vector3 } from "three";
import { networkLayout, ribbonArrays } from "@/lib/scene/geometry";
import { RibbonFigure } from "../ribbon-figure";
import { ScreenFigure } from "../screen-figure";

const LAYERS = [4, 6, 6, 3];
const PAD = 0.1;

const toPlate = (n: { x: number; y: number }) => ({
  x: PAD + n.x * (1 - 2 * PAD),
  y: PAD + n.y * (1 - 2 * PAD),
});

// Dalga cephesi: yavaşça ilerleyen nabız dalgası + scroll katkısı
const phaseGlsl = /* glsl */ `
  float wave() { return fract(uTime * 0.15 + uScroll * 0.0004) * ${(LAYERS.length + 0.6).toFixed(2)}; }
`;

const edgeProject = /* glsl */ `
  vec3 project(vec3 pos) {
    vec2 p = plateToPx(pos.xy);
    p.y += (uScroll - uRect.y) * 0.15 * uPx;
    return vec3(p, pos.z);
  }
`;

const drawGlsl = /* glsl */ `
  ${phaseGlsl}
  float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  float targetAlpha() {
    float isMobile = step(uRes.x / uPx, 1024.0);
    return mix(mix(0.35, 0.60, uHover), 0.25, isMobile);
  }
  float drawn() {
    float progress = clamp(uAge / 0.9, 0.0, 1.0);
    progress = 1.0 - pow(1.0 - progress, 3.0);
    float edgeProgress = clamp(progress * 3.0 - vDepth, 0.0, 1.0);
    return 1.0 - smoothstep(edgeProgress - 0.02, edgeProgress, vT);
  }
`;

// vDepth = kaynak katman. Çizgi opaklığı ~0.35, hover ~0.60, mobil 0.25.
const edgeShade = /* glsl */ `
  ${drawGlsl}
  float shade() {
    float local = wave() - vDepth;
    float pulse = exp(-pow((vT - local) * 6.0, 2.0)) * step(0.0, local) * step(local, 1.2);
    float weightVar = mix(0.4, 1.0, hash1(vLine));
    float baseAlpha = 0.55 * weightVar;
    float pulseAlpha = 0.45 * pulse * weightVar;
    return (baseAlpha + pulseAlpha) * targetAlpha() * drawn();
  }
`;

/**
 * NeuroQuant portresi — "düğüm grafı": 4-6-6-3 katmanlı ağ;
 * sağ kenar notu (marginalia), 900ms ease-out reveal, yavaş nabız, 1px boş halkalar.
 */
export function NetworkFigure() {
  const { edges, nodes } = useMemo(() => {
    const net = networkLayout(LAYERS);
    const lines = net.edges.map(([a, b]) => {
      const p = toPlate(net.nodes[a]);
      const q = toPlate(net.nodes[b]);
      const layer = net.nodes[a].layer;
      return new Float32Array([p.x, p.y, layer, q.x, q.y, layer]);
    });
    const nodes = net.nodes.map((n) => {
      const p = toPlate(n);
      return new Vector3(p.x, p.y, n.layer);
    });
    return { edges: ribbonArrays(lines, 3), nodes };
  }, []);

  const nodeBody = useMemo(
    () => /* glsl */ `
      uniform vec3 uNodes[${nodes.length}];
      ${drawGlsl}
      vec4 figure(vec2 p) {
        vec2 size = uRect.zw - uRect.xy;
        float progress = clamp(uAge / 0.9, 0.0, 1.0);
        progress = 1.0 - pow(1.0 - progress, 3.0);
        float ring = 0.0;
        for (int i = 0; i < ${nodes.length}; i++) {
          vec3 n = uNodes[i];
          vec2 center = uRect.xy + n.xy * size;
          center.y += (uScroll - uRect.y) * 0.15;
          float r = length(p - center);
          float nodeDrawn = step(n.z / 3.0, progress);
          ring = max(ring, (1.0 - smoothstep(0.5, 1.5, abs(r - 5.0))) * nodeDrawn);
        }
        float alpha = ring * targetAlpha() * 0.95;
        return vec4(ink(toneAt(p.y)), alpha);
      }
    `,
    [nodes.length],
  );

  return (
    <>
      <RibbonFigure id="network" arrays={edges} dims={3} project={edgeProject} shade={edgeShade} />
      <ScreenFigure id="network" body={nodeBody} renderOrder={3} uniforms={{ uNodes: { value: nodes } }} />
    </>
  );
}
