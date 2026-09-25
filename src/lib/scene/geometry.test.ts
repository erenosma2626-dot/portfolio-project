import { describe, expect, it } from "vitest";
import { monteCarloPaths, networkLayout, ribbonArrays } from "./geometry";

describe("ribbonArrays", () => {
  const lines = [new Float32Array([0, 0, 1, 0, 2, 0]), new Float32Array([0, 1, 3, 1])];
  const r = ribbonArrays(lines, 2);
  it("her nokta için iki köşe", () => {
    expect(r.side.length).toBe((3 + 2) * 2);
    expect(r.curr.length).toBe((3 + 2) * 2 * 2);
  });
  it("her çizgi kendi içinde üçgenlenir (çizgiler arası köprü yok)", () => {
    expect(r.index.length).toBe((2 + 1) * 6);
  });
  it("t her çizgide yay-uzunluğuyla 0..1", () => {
    expect(Array.from(r.t.slice(0, 6))).toEqual([0, 0, 0.5, 0.5, 1, 1]);
    expect(Array.from(r.t.slice(6, 10))).toEqual([0, 0, 1, 1]);
  });
  it("çizgi indeksi köşelere yazılır", () => {
    expect(Array.from(r.line)).toEqual([0, 0, 0, 0, 0, 0, 1, 1, 1, 1]);
  });
  it("uçlarda prev/next kendine kapanır (açık çizgi)", () => {
    expect(Array.from(r.prev.slice(0, 2))).toEqual([0, 0]);
    expect(Array.from(r.next.slice(2 * 5, 2 * 5 + 2))).toEqual([2, 0]);
  });
});

describe("monteCarloPaths", () => {
  const paths = monteCarloPaths({ seed: 7, count: 12, steps: 40 });
  it("deterministik", () => {
    expect(monteCarloPaths({ seed: 7, count: 12, steps: 40 })[3]).toEqual(paths[3]);
  });
  it("hepsi aynı kökten (0,0) başlar, x 0→1", () => {
    for (const p of paths) {
      expect(p[0]).toBe(0);
      expect(p[1]).toBe(0);
      expect(p[p.length - 2]).toBeCloseTo(1);
    }
  });
  it("yelpaze açılır: son noktaların yayılımı başlangıçtan büyük", () => {
    const ends = paths.map((p) => p[p.length - 1]);
    expect(Math.max(...ends) - Math.min(...ends)).toBeGreaterThan(0.2);
  });
});

describe("networkLayout", () => {
  const net = networkLayout([3, 5, 2]);
  it("katman başına düğüm", () => {
    expect(net.nodes).toHaveLength(10);
  });
  it("yalnız komşu katmanlar arası tam bağlantı", () => {
    expect(net.edges).toHaveLength(3 * 5 + 5 * 2);
  });
  it("düğümler [0,1] kutusunda, katmanlar soldan sağa", () => {
    for (const n of net.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(1);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(1);
    }
    expect(net.nodes[0].x).toBeLessThan(net.nodes[9].x);
  });
});
