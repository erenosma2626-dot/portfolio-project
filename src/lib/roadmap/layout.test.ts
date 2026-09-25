import { describe, expect, it } from "vitest";
import { buildRoad } from "./road";
import { cardPlacement, formatMonth, splitRoadAtArc } from "./layout";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("formatMonth", () => {
  it("YYYY-MM → 'Aug 2026'", () => {
    expect(formatMonth("2026-08", MONTHS)).toBe("Aug 2026");
    expect(formatMonth("2027-01", MONTHS)).toBe("Jan 2027");
  });
});

describe("splitRoadAtArc", () => {
  const road = buildRoad({ length: 10, depth: 3, amplitude: 0.9, waves: 1.75, phase: 0.6, samples: 100 });
  it("kesim noktası iki parçada da var (kesintisiz yol)", () => {
    const { done, planned } = splitRoadAtArc(road, 0.5);
    expect(done[done.length - 1]).toEqual(planned[0]);
  });
  it("uçlarda tek parça", () => {
    expect(splitRoadAtArc(road, 1).planned.length).toBeLessThanOrEqual(1);
    expect(splitRoadAtArc(road, 0).done.length).toBeLessThanOrEqual(1);
  });
  it("tüm örnekler korunur", () => {
    const { done, planned } = splitRoadAtArc(road, 0.37);
    expect(done.length + planned.length).toBe(road.points.length + 2);
  });
});

describe("cardPlacement", () => {
  const base = { cardW: 280, cardH: 150, containerW: 1000, gap: 16, margin: 8 };
  it("varsayılan: çapanın üstünde, yatayda ortalı", () => {
    const p = cardPlacement({ ...base, anchorX: 500, anchorY: 400 });
    expect(p.placement).toBe("above");
    expect(p.left).toBe(500 - 140);
    expect(p.top).toBe(400 - 16 - 150);
  });
  it("üstte yer yoksa alta döner (flip)", () => {
    const p = cardPlacement({ ...base, anchorX: 500, anchorY: 100 });
    expect(p.placement).toBe("below");
    expect(p.top).toBe(100 + 16);
  });
  it("yatayda kaba kenarlara kırpılır (clamp)", () => {
    expect(cardPlacement({ ...base, anchorX: 20, anchorY: 400 }).left).toBe(8);
    expect(cardPlacement({ ...base, anchorX: 990, anchorY: 400 }).left).toBe(1000 - 280 - 8);
  });
});

describe("cardPlacement minTop", () => {
  it("üstte konteyner dışına minTop'a kadar taşabilir (flip yerine)", () => {
    const base = { cardW: 280, cardH: 150, containerW: 1000, gap: 16, margin: 8 };
    expect(cardPlacement({ ...base, anchorX: 500, anchorY: 150 }).placement).toBe("below");
    const p = cardPlacement({ ...base, anchorX: 500, anchorY: 150, minTop: -40 });
    expect(p.placement).toBe("above");
    expect(p.top).toBe(150 - 16 - 150);
  });
});
