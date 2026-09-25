import { describe, expect, it } from "vitest";
import { DEFAULT_CAMERA, PRISM_EDGES, prismCorners, projectPoint, visibleEdges, type Prism } from "./camera";

const prism: Prism = { length: 10, depth: 3, height: 0.6 };

describe("projectPoint", () => {
  it("merkez noktası ekran merkezine düşer", () => {
    const p = projectPoint({ x: 0, y: 0, z: 0 }, DEFAULT_CAMERA);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });
  it("eğik bakış: ön kenar (z+) ekranda arka kenardan (z−) aşağıda (SVG y aşağı)", () => {
    const front = projectPoint({ x: 0, y: 0, z: 1.5 }, DEFAULT_CAMERA);
    const back = projectPoint({ x: 0, y: 0, z: -1.5 }, DEFAULT_CAMERA);
    expect(front.y).toBeGreaterThan(back.y);
  });
  it("perspektif: ön kenar arka kenardan daha geniş görünür", () => {
    const fw = projectPoint({ x: 5, y: 0, z: 1.5 }, DEFAULT_CAMERA).x;
    const bw = projectPoint({ x: 5, y: 0, z: -1.5 }, DEFAULT_CAMERA).x;
    expect(fw).toBeGreaterThan(bw);
  });
  it("yükselen nokta (y+) ekranda yukarı çıkar", () => {
    const ground = projectPoint({ x: 1, y: 0, z: 0 }, DEFAULT_CAMERA);
    const up = projectPoint({ x: 1, y: 1, z: 0 }, DEFAULT_CAMERA);
    expect(up.y).toBeLessThan(ground.y);
  });
});

describe("prizma", () => {
  it("8 köşe, 12 kenar", () => {
    expect(prismCorners(prism)).toHaveLength(8);
    expect(PRISM_EDGES).toHaveLength(12);
  });
  it("üstten-önden bakışta yalnız üst ve ön yüz kenarları görünür (7 kenar)", () => {
    const edges = visibleEdges(prism, DEFAULT_CAMERA);
    expect(edges).toHaveLength(7);
  });
  it("görünür kenarlar arka-alt kenarı içermez", () => {
    const c = prismCorners(prism);
    const edges = visibleEdges(prism, DEFAULT_CAMERA);
    const backBottom = edges.filter(([a, b]) => c[a].y < 0 && c[b].y < 0 && c[a].z < 0 && c[b].z < 0);
    expect(backBottom).toHaveLength(0);
  });
});
