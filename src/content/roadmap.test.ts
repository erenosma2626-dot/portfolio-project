import { describe, expect, it } from "vitest";
import { roadmapEvents } from "./roadmap";

describe("roadmapEvents (v2 - day resolution)", () => {
  it("tam olarak 13 adet olay içermelidir", () => {
    expect(roadmapEvents).toHaveLength(13);
  });

  it("tüm olayların id değerleri benzersiz ve kebab-case olmalıdır", () => {
    const ids = roadmapEvents.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const id of ids) {
      expect(id).toMatch(kebabCaseRegex);
    }
  });

  it("tüm tarihlerin formatı YYYY-MM-DD ve takvimde geçerli bir tarih olmalıdır", () => {
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    for (const event of roadmapEvents) {
      expect(event.date).toMatch(dateRegex);

      const [y, m, d] = event.date.split("-").map(Number);
      const parsed = new Date(Date.UTC(y, m - 1, d));
      expect(parsed.getUTCFullYear()).toBe(y);
      expect(parsed.getUTCMonth()).toBe(m - 1);
      expect(parsed.getUTCDate()).toBe(d);
    }
  });

  it("olaylar tarihe göre artan sırada olmalıdır", () => {
    for (let i = 1; i < roadmapEvents.length; i++) {
      expect(roadmapEvents[i].date >= roadmapEvents[i - 1].date).toBe(true);
    }
  });

  it("özet metinleri (summary) en fazla 140 karakter olmalıdır", () => {
    for (const event of roadmapEvents) {
      expect(event.summary.length).toBeLessThanOrEqual(140);
      expect(event.summary.length).toBeGreaterThan(0);
    }
  });

  it("planned durumundaki olaylar done durumundaki olaylardan sonra gelmelidir", () => {
    let seenPlanned = false;
    for (const event of roadmapEvents) {
      if (event.status === "planned") {
        seenPlanned = true;
      } else if (seenPlanned && event.status === "done") {
        throw new Error(
          `'done' olay ('${event.id}'), 'planned' olaydan sonra gelemez.`,
        );
      }
    }
    expect(seenPlanned).toBe(true);
  });

  it("türlere göre doğru href eşlemesi yapılmalıdır", () => {
    for (const event of roadmapEvents) {
      if (event.kind === "project") {
        expect(event.href).toBe("/projects");
      } else if (event.kind === "internship") {
        expect(event.href).toBe("/about");
      } else if (event.kind === "writing") {
        expect(event.href).toBeNull();
      }
    }
  });

  it("endDate alanı kurallara uygun olmalıdır: endDate >= date, done+endDate <= 2026-09-25, planned için null", () => {
    const today = "2026-09-25";
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    const doneWithEnd = roadmapEvents.filter(
      (e) => e.status === "done" && e.endDate !== null,
    );
    const doneWithoutEnd = roadmapEvents.filter(
      (e) => e.status === "done" && e.endDate === null,
    );

    // Done olanların yaklaşık yarısı bitişli olmalı
    expect(doneWithEnd.length).toBeGreaterThanOrEqual(4);
    expect(doneWithoutEnd.length).toBeGreaterThanOrEqual(4);

    for (const event of roadmapEvents) {
      if (event.status === "planned") {
        expect(event.endDate).toBeNull();
      } else if (event.endDate !== null) {
        expect(event.endDate).toMatch(dateRegex);
        expect(event.endDate >= event.date).toBe(true);
        expect(event.endDate <= today).toBe(true);

        const [y1, m1, d1] = event.date.split("-").map(Number);
        const [y2, m2, d2] = event.endDate.split("-").map(Number);
        const t1 = Date.UTC(y1, m1 - 1, d1);
        const t2 = Date.UTC(y2, m2 - 1, d2);
        const diffDays = Math.round((t2 - t1) / 86400000);
        expect(diffDays).toBeGreaterThanOrEqual(20);
        expect(diffDays).toBeLessThanOrEqual(90);
      }
    }
  });
});
