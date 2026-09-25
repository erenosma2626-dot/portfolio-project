import { describe, expect, it } from "vitest";
import { content } from ".";
import { en } from "./en";

/** Özel isimler Türkçe karakter taşıyabilir; geri kalan tüm metin İngilizce. */
const PROPER_NOUNS = ["Yıldız", "İstanbul", "Güngören", "İletişim"];

function strings(value: unknown, path = "en"): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  }
  return [];
}

describe("en içerik kaynağı", () => {
  it("aktif içerik İngilizce sözlük", () => {
    expect(content).toBe(en);
    expect(en.locale).toBe("en");
  });

  it("özel isimler dışında Türkçe karakter yok", () => {
    const offenders = strings(en).filter(([, s]) => {
      const stripped = PROPER_NOUNS.reduce((acc, noun) => acc.replaceAll(noun, ""), s);
      return /[çğıöşüÇĞİÖŞÜ]/.test(stripped);
    });
    expect(offenders).toEqual([]);
  });

  it("CV verisi eksiksiz: 5 deneyim, 2 sertifika, 3 proje", () => {
    expect(en.about.experiences).toHaveLength(5);
    expect(en.about.certifications).toHaveLength(2);
    expect(en.projects.items).toHaveLength(3);
  });

  it("deneyim maddeleri CV'nin İngilizce ifadeleri", () => {
    const trex = en.about.experiences.find((e) => e.org === "TREX");
    expect(trex?.bullets[1]).toContain("leakage-free feature set");
    expect(en.about.summary).toContain("Aspiring Data Scientist");
  });

  it("her nav öğesinin etiketi var", () => {
    for (const id of ["about", "projects", "writings", "roadmap", "contact"] as const) {
      expect(en.nav.labels[id].length).toBeGreaterThan(0);
    }
  });
});

describe("roadmap metinleri", () => {
  it("12 ay adı ve tür etiketleri", () => {
    expect(en.roadmap.months).toHaveLength(12);
    expect(Object.keys(en.roadmap.kinds).sort()).toEqual(["internship", "project", "writing"]);
  });
});
