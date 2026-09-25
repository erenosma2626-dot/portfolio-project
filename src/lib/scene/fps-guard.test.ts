import { describe, expect, it } from "vitest";
import { initialGuard, stepGuard } from "./fps-guard";

const feed = (state: ReturnType<typeof initialGuard>, ms: number, n: number) => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepGuard(s, ms / 1000);
  return s;
};

describe("FPS guard", () => {
  it("60 fps'te seviye değişmez", () => {
    const s = feed(initialGuard(), 16.7, 300);
    expect(s.level).toBe("full");
  });
  it("sürekli yavaşsa önce DPR'yi düşürür", () => {
    const s = feed(initialGuard(), 30, 60);
    expect(s.level).toBe("low-dpr");
  });
  it("düşük DPR'de de yavaşsa statik kareye geçer", () => {
    const s = feed(feed(initialGuard(), 30, 60), 30, 60);
    expect(s.level).toBe("static");
  });
  it("tek seferlik takılma (sekme dönüşü) sayılmaz", () => {
    let s = initialGuard();
    s = stepGuard(s, 2.5); // arka plandan dönüş
    s = feed(s, 16.7, 120);
    expect(s.level).toBe("full");
  });
  it("seviye değişince pencere sıfırlanır", () => {
    const s = feed(initialGuard(), 30, 60);
    expect(s.samples).toBe(0);
  });
});
