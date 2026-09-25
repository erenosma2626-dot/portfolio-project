import { describe, expect, it } from "vitest";
import { buildProofPath, checkpointPoints } from "./proof-line";

describe("proof-line (kanıt çizgisi matematik katmanı)", () => {
  it("noktalar verildiğinde geçerli bir SVG path 'd' dizesi üretmelidir", () => {
    const pts = [
      { x: 12, y: 0 },
      { x: 12, y: 150 },
      { x: 12, y: 300 },
      { x: 12, y: 500 },
    ];
    const d = buildProofPath(pts);
    expect(d.startsWith("M12.0,0.0")).toBe(true);
    expect(d).toContain("C");
  });

  it("boş veya tek noktalı dizide boş dize dönmelidir", () => {
    expect(buildProofPath([])).toBe("");
    expect(buildProofPath([{ x: 12, y: 0 }])).toBe("");
  });

  it("checkpointPoints verilen Y koordinatlarına göre hafif kıvrımlı noktalar dizisi dönmelidir", () => {
    const yList = [100, 250, 400];
    const totalH = 600;
    const pts = checkpointPoints(yList, totalH, 12, 4);

    expect(pts.length).toBeGreaterThan(yList.length);
    expect(pts[0].y).toBe(0);
    expect(pts[pts.length - 1].y).toBe(totalH);

    // Her checkpoint noktasında X = baseX (12) olmalıdır
    for (const y of yList) {
      const match = pts.find((p) => Math.abs(p.y - y) < 0.1);
      expect(match).toBeDefined();
      expect(match?.x).toBe(12);
    }
  });
});
