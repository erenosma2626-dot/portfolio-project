import { describe, expect, it } from "vitest";
import { roadmapEvents } from "@/content/roadmap";
import { dayIndex, fromDayIndex } from "./dates";
import {
  project,
  RANGE,
  ticks,
  viewFor,
  visible,
  type View,
} from "./timescale";

describe("roadmap timescale (v2 - day resolution)", () => {
  const fixedNow = new Date("2026-09-25T12:00:00Z");

  describe("viewFor", () => {
    it("near modu için geçmiş 30 gün ve gelecek 60 günü içeren pencere üretmelidir", () => {
      const v = viewFor("near", fixedNow);
      expect(fromDayIndex(v.start)).toBe("2026-08-26");
      expect(fromDayIndex(v.end)).toBe("2026-11-24");
      expect(v.end - v.start).toBe(RANGE.near.pastDays + RANGE.near.futureDays);
    });

    it("far modu için 2025-12-01'den bugüne + 365 günü içeren pencere üretmelidir", () => {
      const v = viewFor("far", fixedNow);
      expect(fromDayIndex(v.start)).toBe("2025-12-01");
      expect(fromDayIndex(v.end)).toBe("2027-09-25");
    });
  });

  describe("project", () => {
    const v: View = {
      start: 100,
      end: 200,
    };

    it("gün indeksini [start, end] aralığına göre 0..1 oranına projekte etmelidir", () => {
      expect(project(v, 100)).toBe(0);
      expect(project(v, 200)).toBe(1);
      expect(project(v, 150)).toBe(0.5);
      expect(project(v, 50)).toBe(-0.5);
      expect(project(v, 250)).toBe(1.5);
    });
  });

  describe("visible", () => {
    it("near modunda sadece pencere içindeki 5 olayı döndürmelidir", () => {
      const v = viewFor("near", fixedNow);
      const vis = visible(v, roadmapEvents);

      expect(vis).toHaveLength(5);
      expect(vis.map((e) => e.date)).toEqual([
        "2026-08-30",
        "2026-09-08",
        "2026-09-19",
        "2026-10-12",
        "2026-11-15",
      ]);

      for (const e of vis) {
        const p = project(v, dayIndex(e.date));
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });

    it("far modunda tüm filler olayları görünür kılmalıdır", () => {
      const v = viewFor("far", fixedNow);
      const vis = visible(v, roadmapEvents);
      expect(vis).toHaveLength(roadmapEvents.length);
    });
  });

  describe("ticks", () => {
    describe("near modu", () => {
      it("tüm tick'ler pencere içinde olmalı ve her biri Pazartesi günü olmalıdır (ardışık fark 7 gün)", () => {
        const v = viewFor("near", fixedNow);
        const nearTicks = ticks(v, "near");

        expect(nearTicks.length).toBeGreaterThan(0);

        for (let i = 0; i < nearTicks.length; i++) {
          const t = nearTicks[i];
          expect(t.day).toBeGreaterThanOrEqual(v.start);
          expect(t.day).toBeLessThan(v.end);

          const d = new Date(t.day * 86400000);
          expect(d.getUTCDay()).toBe(1); // 1 = Monday (UTC)

          if (i > 0) {
            expect(t.day - nearTicks[i - 1].day).toBe(7);
          }
        }
      });

      it("ayın 1'ini içeren haftadaki tick major ve sadece ay adı etiketli olmalıdır; diğerleri 'MMM D' formatında olmalıdır", () => {
        const v = viewFor("near", fixedNow);
        const nearTicks = ticks(v, "near");

        // 2026-09-21 Pazartesi
        const sep21 = nearTicks.find((t) => fromDayIndex(t.day) === "2026-09-21");
        expect(sep21).toBeDefined();
        expect(sep21?.major).toBe(false);
        expect(sep21?.label).toBe("Sep 21");

        // 2026-10-05 Pazartesi (Ekim ayının ilk Pazartesisi, 1 Ekim'i kapsar)
        const oct5 = nearTicks.find((t) => fromDayIndex(t.day) === "2026-10-05");
        expect(oct5).toBeDefined();
        expect(oct5?.major).toBe(true);
        expect(oct5?.label).toBe("Oct");

        // 2026-11-02 Pazartesi (Kasım ayının ilk Pazartesisi)
        const nov2 = nearTicks.find((t) => fromDayIndex(t.day) === "2026-11-02");
        expect(nov2).toBeDefined();
        expect(nov2?.major).toBe(true);
        expect(nov2?.label).toBe("Nov");
      });
    });

    describe("far modu", () => {
      it("her ayın 1'ini tick olarak üretmeli ve hepsi pencere içinde olmalıdır", () => {
        const v = viewFor("far", fixedNow);
        const farTicks = ticks(v, "far");

        expect(farTicks.length).toBeGreaterThan(12);

        for (const t of farTicks) {
          expect(t.day).toBeGreaterThanOrEqual(v.start);
          expect(t.day).toBeLessThan(v.end);

          const d = new Date(t.day * 86400000);
          expect(d.getUTCDate()).toBe(1);
        }
      });

      it("pencerenin ilk tick'i ve Ocak ayları major olup 'MMM YYYY' formatında olmalıdır; diğerleri sadece 'MMM' olmalıdır", () => {
        const v = viewFor("far", fixedNow);
        const farTicks = ticks(v, "far");

        // İlk tick: 2025-12-01
        expect(farTicks[0].major).toBe(true);
        expect(farTicks[0].label).toBe("Dec 2025");

        // Ocak 2026 ve Ocak 2027
        const jan2026 = farTicks.find((t) => fromDayIndex(t.day) === "2026-01-01");
        expect(jan2026?.major).toBe(true);
        expect(jan2026?.label).toBe("Jan 2026");

        const jan2027 = farTicks.find((t) => fromDayIndex(t.day) === "2027-01-01");
        expect(jan2027?.major).toBe(true);
        expect(jan2027?.label).toBe("Jan 2027");

        // Normal ay: Şubat 2026
        const feb2026 = farTicks.find((t) => fromDayIndex(t.day) === "2026-02-01");
        expect(feb2026?.major).toBe(false);
        expect(feb2026?.label).toBe("Feb");
      });
    });
  });
});
