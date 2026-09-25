import { describe, expect, it } from "vitest";
import { MAX_SCREEN_BANDS, activeCenterFigure, clipRect, figureRect, screenBands, toneUnder, type SectionBand } from "./sections";

const bands: SectionBand[] = [
  { top: 0, bottom: 1000, tone: "light", figure: "contour" },
  { top: 1000, bottom: 2000, tone: "dark", figure: "none" },
  { top: 2000, bottom: 3000, tone: "light", figure: "none" },
];

describe("screenBands", () => {
  it("sadece viewport'a giren bantları ekran koordinatına çevirir", () => {
    expect(screenBands(bands, 0, 800)).toEqual([
      { y0: 0, y1: 800, tone: 1 * 0, figure: "contour" },
    ]);
  });
  it("sınır ekrandayken iki bandı keser", () => {
    expect(screenBands(bands, 600, 800)).toEqual([
      { y0: 0, y1: 400, tone: 0, figure: "contour" },
      { y0: 400, y1: 800, tone: 1, figure: "none" },
    ]);
  });
  it("tamamen dışarıdaki bantları atar", () => {
    expect(screenBands(bands, 1100, 800).map((b) => b.tone)).toEqual([1]);
  });
  it("bant sayısını sınırlar", () => {
    const many: SectionBand[] = Array.from({ length: 10 }, (_, i) => ({
      top: i * 50,
      bottom: (i + 1) * 50,
      tone: "light",
      figure: "none",
    }));
    expect(screenBands(many, 0, 800)).toHaveLength(MAX_SCREEN_BANDS);
  });
});

describe("figureRect", () => {
  it("figürün görünür bandını tam genişlikte döner", () => {
    const visible = screenBands(bands, 600, 800);
    expect(figureRect(visible, "contour", 1200)).toEqual({ x0: 0, y0: 0, x1: 1200, y1: 400 });
  });
  it("görünür değilse null", () => {
    expect(figureRect(screenBands(bands, 1100, 800), "contour", 1200)).toBeNull();
  });
});

describe("toneUnder", () => {
  const rects = [
    { top: -400, bottom: 30, tone: "light" as const },
    { top: 30, bottom: 900, tone: "dark" as const },
  ];
  it("y'nin altındaki bölümün tonu", () => {
    expect(toneUnder(rects, 10)).toBe("light");
    expect(toneUnder(rects, 40)).toBe("dark");
  });
  it("bölüm yoksa light", () => {
    expect(toneUnder([], 10)).toBe("light");
  });
});

describe("clipRect (figür plakası)", () => {
  it("viewport'a kırpar", () => {
    expect(clipRect({ x0: -10, y0: 700, x1: 500, y1: 1000 }, 1200, 800)).toEqual({ x0: 0, y0: 700, x1: 500, y1: 800 });
  });
  it("tamamen dışarıdaysa null", () => {
    expect(clipRect({ x0: 0, y0: 900, x1: 500, y1: 1000 }, 1200, 800)).toBeNull();
    expect(clipRect({ x0: 0, y0: -300, x1: 500, y1: -1 }, 1200, 800)).toBeNull();
  });
});

describe("activeCenterFigure (/projects arka plan figürü)", () => {
  const projectBands: SectionBand[] = [
    { top: 200, bottom: 800, tone: "light", figure: "anomaly" },
    { top: 900, bottom: 1500, tone: "light", figure: "montecarlo" },
    { top: 1600, bottom: 2200, tone: "light", figure: "network" },
  ];

  it("ekran ortasındaki projenin figürünü seçer", () => {
    expect(activeCenterFigure(projectBands, 500)).toBe("anomaly");
    expect(activeCenterFigure(projectBands, 1200)).toBe("montecarlo");
    expect(activeCenterFigure(projectBands, 1900)).toBe("network");
  });

  it("bölümler arasındayken en yakın projeyi seçer", () => {
    // 830: anomaly (800'e 30px, 900'e 70px)
    expect(activeCenterFigure(projectBands, 830)).toBe("anomaly");
    // 880: montecarlo (900'e 20px)
    expect(activeCenterFigure(projectBands, 880)).toBe("montecarlo");
  });

  it("none figürlerini atlar ve boşsa null döner", () => {
    const mixed: SectionBand[] = [
      { top: 0, bottom: 500, tone: "light", figure: "none" },
    ];
    expect(activeCenterFigure(mixed, 250)).toBeNull();
    expect(activeCenterFigure([], 250)).toBeNull();
  });
});
