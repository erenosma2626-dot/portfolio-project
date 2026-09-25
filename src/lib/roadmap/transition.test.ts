import { describe, expect, it } from "vitest";
import { easeInOut, eventFrame } from "./transition";

const from = { start: 0, end: 100 };
const to = { start: 50, end: 100 };

describe("eventFrame (near↔far geçişi)", () => {
  it("t=0 eski pencere, t=1 yeni pencere konumu", () => {
    expect(eventFrame(75, from, to, 0).arc).toBeCloseTo(0.75);
    expect(eventFrame(75, from, to, 1).arc).toBeCloseTo(0.5);
  });
  it("ikisinde de görünen olay hep tam opak", () => {
    expect(eventFrame(75, from, to, 0.5).opacity).toBe(1);
  });
  it("yeni pencereden çıkan soluklaşır", () => {
    expect(eventFrame(20, from, to, 0).opacity).toBe(1);
    expect(eventFrame(20, from, to, 0.5).opacity).toBeCloseTo(0.5);
    expect(eventFrame(20, from, to, 1).opacity).toBe(0);
  });
  it("yeni pencereye giren belirir (ters yön)", () => {
    expect(eventFrame(20, to, from, 0).opacity).toBe(0);
    expect(eventFrame(20, to, from, 1).opacity).toBe(1);
  });
  it("yay oranı çizim için [0,1]'e kırpılır", () => {
    const f = eventFrame(20, from, to, 1);
    expect(f.arc).toBeGreaterThanOrEqual(0);
  });
});

describe("easeInOut", () => {
  it("uçlar sabit, orta 0.5", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
});
