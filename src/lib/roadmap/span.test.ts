import { describe, expect, it } from "vitest";
import type { RoadmapEvent } from "@/content/roadmap";
import { dayIndex } from "./dates";
import { buildRoad, DEFAULT_ROAD, pointAtArc } from "./road";
import { formatEventRange, roadSpanPoints, spanEnd } from "./span";

describe("roadmap span utilities", () => {
  const today = dayIndex("2026-09-25");

  describe("spanEnd", () => {
    it("endDate varsa onun dayIndex'ini dönmelidir", () => {
      const e: RoadmapEvent = {
        id: "test-1",
        date: "2026-03-05",
        endDate: "2026-04-25",
        kind: "project",
        status: "done",
        title: "Test 1",
        summary: "Summary",
        href: null,
      };
      expect(spanEnd(e, today)).toBe(dayIndex("2026-04-25"));
    });

    it("endDate yok ve done durumundaysa today dönmelidir", () => {
      const e: RoadmapEvent = {
        id: "test-2",
        date: "2026-01-22",
        endDate: null,
        kind: "writing",
        status: "done",
        title: "Test 2",
        summary: "Summary",
        href: null,
      };
      expect(spanEnd(e, today)).toBe(today);
    });

    it("endDate yok ve planned durumundaysa başlangıç tarihi (dayIndex(e.date)) dönmelidir", () => {
      const e: RoadmapEvent = {
        id: "test-3",
        date: "2026-10-12",
        endDate: null,
        kind: "project",
        status: "planned",
        title: "Test 3",
        summary: "Summary",
        href: null,
      };
      expect(spanEnd(e, today)).toBe(dayIndex("2026-10-12"));
    });
  });

  describe("formatEventRange", () => {
    it("aynı yıl içinde bitiş tarihi olan olayları 'MMM D – MMM D, YYYY' formatında göstermelidir", () => {
      const e: RoadmapEvent = {
        id: "test-same-year",
        date: "2026-09-08",
        endDate: "2026-10-02",
        kind: "project",
        status: "done",
        title: "Same Year",
        summary: "Summary",
        href: null,
      };
      expect(formatEventRange(e)).toBe("Sep 8 – Oct 2, 2026");
    });

    it("farklı yıllar arasında bitiş tarihi olan olayları 'MMM D, YYYY – MMM D, YYYY' formatında göstermelidir", () => {
      const e: RoadmapEvent = {
        id: "test-diff-year",
        date: "2025-12-10",
        endDate: "2026-02-15",
        kind: "internship",
        status: "done",
        title: "Diff Year",
        summary: "Summary",
        href: null,
      };
      expect(formatEventRange(e)).toBe("Dec 10, 2025 – Feb 15, 2026");
    });

    it("endDate olmayan done olaylar için 'MMM D, YYYY – ongoing' formatında göstermelidir", () => {
      const e: RoadmapEvent = {
        id: "test-ongoing",
        date: "2026-09-08",
        endDate: null,
        kind: "project",
        status: "done",
        title: "Ongoing",
        summary: "Summary",
        href: null,
      };
      expect(formatEventRange(e)).toBe("Sep 8, 2026 – ongoing");
    });

    it("endDate olmayan planned olaylar için tek tarih formatında göstermelidir", () => {
      const e: RoadmapEvent = {
        id: "test-planned",
        date: "2026-10-12",
        endDate: null,
        kind: "project",
        status: "planned",
        title: "Planned",
        summary: "Summary",
        href: null,
      };
      expect(formatEventRange(e)).toBe("Oct 12, 2026");
    });
  });

  describe("roadSpanPoints", () => {
    const road = buildRoad(DEFAULT_ROAD);

    it("a1 >= a2 durumunda tek nokta veya boş dizi dönmelidir", () => {
      const pts = roadSpanPoints(road, 0.5, 0.5);
      expect(pts.length).toBeLessThanOrEqual(1);
    });

    it("a1 < a2 durumunda başlangıç ve bitiş noktalarını ve aradaki noktaları içermelidir", () => {
      const pts = roadSpanPoints(road, 0.2, 0.6);
      expect(pts.length).toBeGreaterThanOrEqual(2);

      const pStart = pointAtArc(road, 0.2);
      const pEnd = pointAtArc(road, 0.6);

      expect(pts[0].x).toBeCloseTo(pStart.x, 3);
      expect(pts[0].z).toBeCloseTo(pStart.z, 3);
      expect(pts[pts.length - 1].x).toBeCloseTo(pEnd.x, 3);
      expect(pts[pts.length - 1].z).toBeCloseTo(pEnd.z, 3);
    });
  });
});
