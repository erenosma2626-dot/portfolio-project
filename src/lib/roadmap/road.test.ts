import { describe, expect, it } from "vitest";
import {
  buildRoad,
  DEFAULT_ROAD,
  pointAtArc,
  roadCenter,
  type RoadParams,
} from "./road";

describe("roadmap road", () => {
  describe("roadCenter", () => {
    it("uç noktalarda x = ±length/2 olmalıdır", () => {
      const start = roadCenter(0, DEFAULT_ROAD);
      const end = roadCenter(1, DEFAULT_ROAD);
      expect(start.x).toBeCloseTo(-DEFAULT_ROAD.length / 2, 5);
      expect(end.x).toBeCloseTo(DEFAULT_ROAD.length / 2, 5);
    });

    it("s aralığı dışındaki değerleri [0, 1] aralığına clamp etmelidir", () => {
      const under = roadCenter(-0.5, DEFAULT_ROAD);
      const start = roadCenter(0, DEFAULT_ROAD);
      expect(under.x).toBe(start.x);
      expect(under.z).toBe(start.z);

      const over = roadCenter(1.5, DEFAULT_ROAD);
      const end = roadCenter(1, DEFAULT_ROAD);
      expect(over.x).toBe(end.x);
      expect(over.z).toBe(end.z);
    });

    it("tüm s değerleri için |z| <= depth/2 - 0.2 sınırına uymalıdır", () => {
      const maxZ = DEFAULT_ROAD.depth / 2 - 0.2;
      for (let i = 0; i <= 100; i++) {
        const s = i / 100;
        const pt = roadCenter(s, DEFAULT_ROAD);
        expect(Math.abs(pt.z)).toBeLessThanOrEqual(maxZ + 1e-9);
      }
    });

    it("büyük amplitude verilse bile amplitude depth sınırına clamp edilmelidir", () => {
      const customParams: RoadParams = {
        ...DEFAULT_ROAD,
        depth: 2.0,
        amplitude: 5.0, // depth/2 - 0.2 = 0.8
      };
      const maxZ = customParams.depth / 2 - 0.2;
      for (let i = 0; i <= 100; i++) {
        const s = i / 100;
        const pt = roadCenter(s, customParams);
        expect(Math.abs(pt.z)).toBeLessThanOrEqual(maxZ + 1e-9);
      }
    });
  });

  describe("buildRoad", () => {
    it("samples + 1 adet nokta ve kümülatif yay uzunluğu dizisi üretmelidir", () => {
      const road = buildRoad(DEFAULT_ROAD);
      expect(road.points).toHaveLength(DEFAULT_ROAD.samples + 1);
      expect(road.cum).toHaveLength(DEFAULT_ROAD.samples + 1);
      expect(road.cum[0]).toBe(0);
      expect(road.total).toBe(road.cum[road.cum.length - 1]);
      expect(road.total).toBeGreaterThan(DEFAULT_ROAD.length);
    });

    it("kümülatif yay uzunluğu (cum) kesin monoton artan olmalıdır", () => {
      const road = buildRoad(DEFAULT_ROAD);
      for (let i = 1; i < road.cum.length; i++) {
        expect(road.cum[i]).toBeGreaterThan(road.cum[i - 1]);
      }
    });
  });

  describe("pointAtArc", () => {
    it("a = 0 ve a = 1 iken uç noktalara denk gelmelidir", () => {
      const road = buildRoad(DEFAULT_ROAD);
      const start = pointAtArc(road, 0);
      const end = pointAtArc(road, 1);

      expect(start.x).toBeCloseTo(road.points[0].x, 5);
      expect(start.z).toBeCloseTo(road.points[0].z, 5);

      const lastPoint = road.points[road.points.length - 1];
      expect(end.x).toBeCloseTo(lastPoint.x, 5);
      expect(end.z).toBeCloseTo(lastPoint.z, 5);
    });

    it("a arttıkça x koordinatı monoton artmalıdır", () => {
      const road = buildRoad(DEFAULT_ROAD);
      let prevX = -Infinity;
      for (let i = 0; i <= 50; i++) {
        const a = i / 50;
        const pt = pointAtArc(road, a);
        expect(pt.x).toBeGreaterThanOrEqual(prevX - 1e-9);
        prevX = pt.x;
      }
    });

    it("tanjant vektörü (tx, tz) birim uzunlukta olmalıdır", () => {
      const road = buildRoad(DEFAULT_ROAD);
      for (let i = 0; i <= 20; i++) {
        const a = i / 20;
        const { tx, tz } = pointAtArc(road, a);
        const len = Math.hypot(tx, tz);
        expect(len).toBeCloseTo(1.0, 4);
      }
    });

    it("eşit a adımlarında ardışık noktalar arasındaki kavis mesafesi yaklaşık eşit olmalıdır (±%2)", () => {
      const road = buildRoad(DEFAULT_ROAD);
      const steps = 50;
      const expectedArcStep = road.total / steps;

      const pts = [];
      for (let i = 0; i <= steps; i++) {
        pts.push(pointAtArc(road, i / steps));
      }

      for (let i = 1; i <= steps; i++) {
        const dist = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
        // Doğrusal mesafe ile yay mesafesi yoğun örneklemede (samples=400) %2 tolerans içindedir
        const ratio = dist / expectedArcStep;
        expect(ratio).toBeGreaterThan(0.98);
        expect(ratio).toBeLessThan(1.02);
      }
    });
  });
});
