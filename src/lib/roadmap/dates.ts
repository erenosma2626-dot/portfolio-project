const DATE_FORMAT_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * "YYYY-MM-DD" biçimindeki tarihi UTC epoch gün indeksine dönüştürür (tam sayı).
 * Geçersiz format veya takvimde var olmayan tarihlerde Error fırlatır.
 */
export function dayIndex(date: string): number {
  if (!DATE_FORMAT_REGEX.test(date)) {
    throw new Error(
      `Geçersiz tarih formatı ("YYYY-MM-DD" bekleniyordu): "${date}"`,
    );
  }

  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  const utcMs = Date.UTC(year, month - 1, day);
  const d = new Date(utcMs);

  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    throw new Error(`Takvimde geçerli olmayan tarih: "${date}"`);
  }

  return Math.floor(utcMs / 86400000);
}

/**
 * UTC gün indeksini "YYYY-MM-DD" formatına dönüştürür.
 * Tam sayı olmayan değerler Math.floor ile tabana yuvarlanır.
 */
export function fromDayIndex(i: number): string {
  const dayCount = Math.floor(i);
  const d = new Date(dayCount * 86400000);

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  const yearStr = String(year).padStart(4, "0");
  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");

  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Verilen Date nesnesinin UTC yıl, ay ve gününü temel alarak gün indeksini döner.
 */
export function todayIndex(now: Date): number {
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      86400000,
  );
}

/**
 * Gün indeksini "Sep 19, 2026" ("MMM D, YYYY") biçiminde gösterir.
 */
export function formatDay(i: number): string {
  const dayCount = Math.floor(i);
  const d = new Date(dayCount * 86400000);
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${monthName} ${day}, ${year}`;
}

/**
 * Gün indeksini "Sep 2026" ("MMM YYYY") biçiminde gösterir.
 */
export function formatMonthShort(i: number): string {
  const dayCount = Math.floor(i);
  const d = new Date(dayCount * 86400000);
  const monthName = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${monthName} ${year}`;
}
