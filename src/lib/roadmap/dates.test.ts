import { describe, expect, it } from "vitest";
import {
  dayIndex,
  formatDay,
  formatMonthShort,
  fromDayIndex,
  todayIndex,
} from "./dates";

describe("roadmap dates (v2 - day resolution)", () => {
  describe("dayIndex", () => {
    it("1970-01-01 için UTC epoch gün indeksini 0 olarak hesaplamalıdır", () => {
      expect(dayIndex("1970-01-01")).toBe(0);
    });

    it("geçerli YYYY-MM-DD tarihlerini tam sayı UTC gün indeksine dönüştürmelidir", () => {
      const idx = dayIndex("2026-09-25");
      const expected = Math.floor(Date.UTC(2026, 8, 25) / 86400000);
      expect(idx).toBe(expected);
      expect(Number.isInteger(idx)).toBe(true);
    });

    it("geçersiz biçimli veya takvimde var olmayan tarihlerde hata fırlatmalıdır", () => {
      expect(() => dayIndex("")).toThrow();
      expect(() => dayIndex("2026-9-5")).toThrow();
      expect(() => dayIndex("2026/09/25")).toThrow();
      expect(() => dayIndex("invalid")).toThrow();
      expect(() => dayIndex("2026-02-30")).toThrow(); // Şubat 30 olamaz
      expect(() => dayIndex("2026-04-31")).toThrow(); // Nisan 31 olamaz
      expect(() => dayIndex("2026-13-01")).toThrow(); // 13. ay olamaz
      expect(() => dayIndex("2026-00-10")).toThrow(); // 0. ay olamaz
    });
  });

  describe("fromDayIndex", () => {
    it("gün indeksini doğru YYYY-MM-DD formatına dönüştürmelidir", () => {
      expect(fromDayIndex(0)).toBe("1970-01-01");
      const idx2026 = Math.floor(Date.UTC(2026, 8, 25) / 86400000);
      expect(fromDayIndex(idx2026)).toBe("2026-09-25");
    });

    it("dayIndex ile çift yönlü tutarlı olmalıdır", () => {
      const dates = [
        "2025-12-01",
        "2026-02-28",
        "2026-08-30",
        "2027-06-15",
        "2028-02-29", // artık yıl
      ];
      for (const d of dates) {
        expect(fromDayIndex(dayIndex(d))).toBe(d);
      }
    });

    it("tam sayı olmayan indeksleri Math.floor ile tabana yuvarlamalıdır", () => {
      const idx = dayIndex("2026-09-25");
      expect(fromDayIndex(idx + 0.9)).toBe("2026-09-25");
    });
  });

  describe("todayIndex", () => {
    it("verilen Date nesnesinin UTC gün indeksini hesaplamalıdır", () => {
      const d = new Date("2026-09-25T14:30:00Z");
      expect(todayIndex(d)).toBe(dayIndex("2026-09-25"));
    });
  });

  describe("formatDay", () => {
    it("günü 'MMM D, YYYY' formatında biçimlendirmelidir", () => {
      expect(formatDay(dayIndex("2026-09-19"))).toBe("Sep 19, 2026");
      expect(formatDay(dayIndex("2025-12-01"))).toBe("Dec 1, 2025");
      expect(formatDay(dayIndex("2026-01-05"))).toBe("Jan 5, 2026");
    });
  });

  describe("formatMonthShort", () => {
    it("ayı 'MMM YYYY' formatında biçimlendirmelidir", () => {
      expect(formatMonthShort(dayIndex("2026-09-19"))).toBe("Sep 2026");
      expect(formatMonthShort(dayIndex("2025-12-01"))).toBe("Dec 2025");
      expect(formatMonthShort(dayIndex("2027-02-15"))).toBe("Feb 2027");
    });
  });
});
