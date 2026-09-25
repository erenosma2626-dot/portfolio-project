import { describe, expect, it } from "vitest";
import {
  BACKGROUND_RULES,
  contentColumnMask,
  effectiveLineOpacity,
} from "./background-rules";

describe("background-rules (Efekt Grameri)", () => {
  it("temel kural sabitleri belirtilen sınırlara uymalıdır", () => {
    expect(BACKGROUND_RULES.lineWidthPx).toBe(1);
    expect(BACKGROUND_RULES.maxOpacityLight).toBeLessThanOrEqual(0.09);
    expect(BACKGROUND_RULES.maxOpacityDark).toBeLessThanOrEqual(0.1);
    expect(BACKGROUND_RULES.aboutGridOpacity).toBeLessThanOrEqual(0.09);
    expect(BACKGROUND_RULES.contentColumnFactor).toBe(0.6);
    expect(BACKGROUND_RULES.maxParallax).toBeLessThanOrEqual(0.25);
    expect(BACKGROUND_RULES.transitionDurationMs).toBeGreaterThanOrEqual(600);
  });

  it("effectiveLineOpacity beyaz zeminde <= 0.09, navy zeminde <= 0.1 dönmelidir", () => {
    const light = effectiveLineOpacity("light");
    const dark = effectiveLineOpacity("dark");
    expect(light).toBeLessThanOrEqual(0.09);
    expect(light).toBeGreaterThan(0);
    expect(dark).toBeLessThanOrEqual(0.1);
    expect(dark).toBeGreaterThan(0);
  });

  it("contentColumnMask metin sütununda (merkezde) ~0.6 çarpanı, kenarlarda 1.0 çarpanı uygulamalıdır", () => {
    const width = 1200;
    const center = width / 2;
    // Tam merkez (içerik kolonu)
    expect(contentColumnMask(center, width)).toBeCloseTo(0.6, 1);
    // Sol kenar boşluğu
    expect(contentColumnMask(50, width)).toBeCloseTo(1.0, 1);
    // Sağ kenar boşluğu
    expect(contentColumnMask(width - 50, width)).toBeCloseTo(1.0, 1);
  });
});
