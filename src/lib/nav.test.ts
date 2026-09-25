import { describe, expect, it } from "vitest";
import { NAV_ITEMS, activeIndex, logoAction, navHref, routeActive } from "./nav";

describe("NAV_ITEMS", () => {
  it("landing bölümleriyle aynı sırada beş öğe (Roadmap, Contact'tan önce)", () => {
    expect(NAV_ITEMS.map((i) => i.id)).toEqual(["about", "projects", "writings", "roadmap", "contact"]);
  });
  it("monografi numaralaması §1..§5", () => {
    expect(NAV_ITEMS.map((i) => i.number)).toEqual(["§1", "§2", "§3", "§4", "§5"]);
  });
  it("roadmap landing'de hash, başka sayfada /#roadmap", () => {
    expect(navHref("/", "roadmap")).toBe("#roadmap");
    expect(navHref("/about", "roadmap")).toBe("/#roadmap");
  });
});

describe("navHref", () => {
  it("About her zaman /about sayfasına gider", () => {
    expect(navHref("/", "about")).toBe("/about");
    expect(navHref("/about", "about")).toBe("/about");
  });
  it("Projects her zaman /projects sayfasına gider", () => {
    expect(navHref("/", "projects")).toBe("/projects");
    expect(navHref("/about", "projects")).toBe("/projects");
  });
  it("diğer landing bölümleri ana sayfada hash, başka sayfada /#hash", () => {
    expect(navHref("/", "writings")).toBe("#writings");
    expect(navHref("/projects", "contact")).toBe("/#contact");
  });
});

describe("logoAction", () => {
  it("ana sayfadayken başa kaydırır, başka sayfada gezinir", () => {
    expect(logoAction("/")).toBe("scroll-top");
    expect(logoAction("/about")).toBe("navigate");
  });
});

describe("activeIndex", () => {
  const tops = [0, 800, 1600, 2400];
  it("probe'un geçtiği son bölüm", () => {
    expect(activeIndex(tops, 10)).toBe(0);
    expect(activeIndex(tops, 800)).toBe(1);
    expect(activeIndex(tops, 2399)).toBe(2);
    expect(activeIndex(tops, 9000)).toBe(3);
  });
  it("hiçbir bölüme girilmediyse -1", () => {
    expect(activeIndex([100, 200], 50)).toBe(-1);
    expect(activeIndex([], 50)).toBe(-1);
  });
});

describe("routeActive", () => {
  it("alt sayfa rotası kendi nav öğesini aktif eder", () => {
    expect(routeActive("/about")).toBe("about");
    expect(routeActive("/projects")).toBe("projects");
  });
  it("ana sayfa ve bilinmeyen rota için null (landing'de scroll belirler)", () => {
    expect(routeActive("/")).toBeNull();
    expect(routeActive("/yok")).toBeNull();
  });
});
