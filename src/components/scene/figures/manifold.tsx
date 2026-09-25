"use client";

import { useMemo } from "react";
import { ribbonArrays } from "@/lib/scene/geometry";
import { RibbonFigure } from "../ribbon-figure";

const LINES = 21;
const STEPS = 96;

/** (u, v) ∈ [-1, 1]² parametre çizgileri: sabit-v ve sabit-u eğrileri. */
function paramLines() {
  const lines: Float32Array[] = [];
  for (let i = 0; i < LINES; i++) {
    const c = -1 + (2 * i) / (LINES - 1);
    const a = new Float32Array((STEPS + 1) * 2);
    const b = new Float32Array((STEPS + 1) * 2);
    for (let j = 0; j <= STEPS; j++) {
      const s = -1 + (2 * j) / STEPS;
      a.set([s, c], j * 2);
      b.set([c, s], j * 2);
    }
    lines.push(a, b);
  }
  return ribbonArrays(lines, 2);
}

/**
 * "Dönen tel-kafes manifold" (§2 Projects, navy zemin → beyaz çizgi):
 * eyer (u² − v²) + yavaş dalgalanan yüzey; Y ekseninde döner, scroll dönüşe
 * hafif katkı verir. Arkadaki çizgiler soluk (derinlik), merkez (başlık)
 * maskeli. Yüzey vertex shader'da hesaplanır → geometri tek sefer yüklenir.
 */
const project = /* glsl */ `
  vec3 surface(vec2 uv) {
    float t = uTime;
    float h = 0.22 * (uv.x * uv.x - uv.y * uv.y)
            + 0.16 * sin(2.2 * uv.x + t * 0.35) * cos(1.8 * uv.y - t * 0.27);
    return vec3(uv.x * 1.25, h, uv.y * 1.25);
  }

  vec3 project(vec3 pos) {
    vec3 p = surface(pos.xy);
    float yaw = uTime * 0.07 + uScroll * 0.0004;
    float c = cos(yaw), s = sin(yaw);
    p = vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
    float tilt = 0.52;
    float ct = cos(tilt), st = sin(tilt);
    p = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
    float persp = 3.4 / (3.4 + p.z);
    float scale = min(uRes.x, uRes.y) * 0.4;
    vec2 center = 0.5 * uRes;
    return vec3(center + vec2(p.x, -p.y) * persp * scale, p.z);
  }
`;

const shade = /* glsl */ `
  float shade() {
    // Arka yüz (z > 0) soluk; ekran merkezindeki başlık çevresi sessiz.
    float depth = mix(1.0, 0.35, clamp(vDepth * 0.6 + 0.5, 0.0, 1.0));
    vec2 size = uRes / uPx;
    vec2 d = (screenPx() - 0.5 * size) / vec2(360.0, 150.0);
    float mask = smoothstep(0.6, 1.4, length(d));
    return 0.3 * depth * mix(0.25, 1.0, mask);
  }
`;

export function ManifoldFigure() {
  const arrays = useMemo(() => paramLines(), []);
  return <RibbonFigure id="manifold" arrays={arrays} dims={2} project={project} shade={shade} />;
}
