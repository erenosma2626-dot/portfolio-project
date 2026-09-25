import { describe, expect, it } from "vitest";
import { arcParams, lissajousKnot, lissajousPoints } from "./lissajous";

describe("lissajousPoints", () => {
  const pts = lissajousPoints({ count: 400, a: 3, b: 2, phase: Math.PI / 2 });
  it("count adet 2B nokta üretir", () => {
    expect(pts.length).toBe(400 * 2);
  });
  it("[-1,1] aralığında kalır", () => {
    for (const v of pts) {
      expect(Math.abs(v)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
  it("kapalı eğri: ilk ve son nokta çakışır", () => {
    expect(pts[0]).toBeCloseTo(pts[pts.length - 2], 6);
    expect(pts[1]).toBeCloseTo(pts[pts.length - 1], 6);
  });
});

describe("lissajousKnot (3B)", () => {
  const pts = lissajousKnot({ count: 300, a: 3, b: 2, c: 5, phaseX: 0.7, phaseZ: 0.2 });
  it("count adet 3B nokta", () => {
    expect(pts.length).toBe(300 * 3);
  });
  it("kapalı ve sınırlı", () => {
    expect(pts[0]).toBeCloseTo(pts[pts.length - 3], 6);
    expect(pts[2]).toBeCloseTo(pts[pts.length - 1], 6);
    for (const v of pts) expect(Math.abs(v)).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe("arcParams", () => {
  it("0'dan 1'e monoton artan yay-uzunluğu parametresi", () => {
    const t = arcParams(new Float32Array([0, 0, 0, 1, 0, 0, 3, 0, 0]), 3);
    expect(t[0]).toBe(0);
    expect(t[1]).toBeCloseTo(1 / 3, 6);
    expect(t[2]).toBe(1);
  });
});
