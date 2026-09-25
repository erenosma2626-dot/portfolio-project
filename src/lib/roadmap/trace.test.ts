import { describe, expect, it } from "vitest";
import { pointAlong, polylineLength, tracePaths } from "./trace";

const card = { left: 100, top: 0, width: 200, height: 100 };
const ball = { x: 200, y: 150 };

describe("tracePaths (toptan kart çerçevesine ışık)", () => {
  const { left, right } = tracePaths(ball, card, "above");
  it("iki yol toptan başlar ve üst kenar ortasında buluşur", () => {
    expect(left[0]).toEqual(ball);
    expect(right[0]).toEqual(ball);
    expect(left[left.length - 1]).toEqual({ x: 200, y: 0 });
    expect(right[right.length - 1]).toEqual({ x: 200, y: 0 });
  });
  it("önce yakın (alt) köşelere gider", () => {
    expect(left[1]).toEqual({ x: 100, y: 100 });
    expect(right[1]).toEqual({ x: 300, y: 100 });
  });
  it("ortalıyken simetrik uzunluk", () => {
    expect(polylineLength(left)).toBeCloseTo(polylineLength(right));
  });
  it("kart alttaysa üst köşelerden başlayıp alt ortada buluşur", () => {
    const b = tracePaths({ x: 200, y: -50 }, card, "below");
    expect(b.left[1]).toEqual({ x: 100, y: 0 });
    expect(b.left[b.left.length - 1]).toEqual({ x: 200, y: 100 });
  });
});

describe("pointAlong (kıvılcım başı)", () => {
  const line = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];
  it("oran boyunca konum", () => {
    expect(pointAlong(line, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(line, 0.25)).toEqual({ x: 5, y: 0 });
    expect(pointAlong(line, 0.75)).toEqual({ x: 10, y: 5 });
    expect(pointAlong(line, 1)).toEqual({ x: 10, y: 10 });
  });
});
