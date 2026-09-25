import { describe, expect, it } from "vitest";
import { FIGURES, ROUTE_ALLOWED_FIGURES, figureAnimating, parseFigure, resolveFigures, weightStep } from "./figures";

describe("resolveFigures", () => {
  it("intro aktifken landing'de yalnız imza eğrisi", () => {
    expect(resolveFigures({ pathname: "/", introActive: true, visible: ["contour"] })).toEqual([
      "signature",
    ]);
  });
  it("landing'de görünür bölümlerin figürleri", () => {
    expect(resolveFigures({ pathname: "/", introActive: false, visible: ["contour", "none"] })).toEqual(
      ["contour"],
    );
  });
  it("görünür figür yoksa rotanın varsayılanı (şimdilik boş)", () => {
    expect(resolveFigures({ pathname: "/", introActive: false, visible: [] })).toEqual([]);
  });
  it("/about rotasının varsayılanı kareli kâğıt", () => {
    expect(resolveFigures({ pathname: "/about", introActive: false, visible: [] })).toEqual(["grid"]);
  });
  it("intro sadece ana sayfada geçerli", () => {
    expect(resolveFigures({ pathname: "/about", introActive: true, visible: [] })).toEqual(["grid"]);
  });
  it("tekrarları ayıklar", () => {
    expect(
      resolveFigures({ pathname: "/", introActive: false, visible: ["contour", "contour"] }),
    ).toEqual(["contour"]);
  });
  it("rota değişiminde aktif figür listesi yalnız yeni rotaya ait (/projects -> / geçişi)", () => {
    // /projects'ten ana sayfaya geçerken henüz temizlenmemiş proje portreleri elenir
    expect(
      resolveFigures({
        pathname: "/",
        introActive: false,
        visible: ["anomaly", "montecarlo", "network"],
      }),
    ).toEqual([]);

    expect(
      resolveFigures({
        pathname: "/",
        introActive: false,
        visible: ["anomaly", "contour"],
      }),
    ).toEqual(["contour"]);
  });
  it("rota değişiminde /about -> / geçişinde grid figürü elenir", () => {
    expect(
      resolveFigures({
        pathname: "/",
        introActive: false,
        visible: ["grid"],
      }),
    ).toEqual([]);

    expect(
      resolveFigures({
        pathname: "/",
        introActive: false,
        visible: ["grid", "contour"],
      }),
    ).toEqual(["contour"]);
  });
  it("rota değişiminde / -> /projects geçişinde yalnız proje portreleri kabul edilir", () => {
    expect(
      resolveFigures({
        pathname: "/projects",
        introActive: false,
        visible: ["contour", "anomaly"],
      }),
    ).toEqual(["anomaly"]);
  });
});

describe("ROUTE_ALLOWED_FIGURES", () => {
  it("her rota yalnız kendi figürlerine izin verir", () => {
    expect(ROUTE_ALLOWED_FIGURES["/"]).toContain("contour");
    expect(ROUTE_ALLOWED_FIGURES["/"]).not.toContain("anomaly");
    expect(ROUTE_ALLOWED_FIGURES["/"]).not.toContain("grid");
    expect(ROUTE_ALLOWED_FIGURES["/about"]).toEqual(["grid"]);
    expect(ROUTE_ALLOWED_FIGURES["/projects"]).toEqual(["anomaly", "montecarlo", "network"]);
  });
});

describe("parseFigure", () => {
  it("kayıtlı figürü kabul eder, bilinmeyeni none'a çevirir", () => {
    expect(parseFigure("contour")).toBe("contour");
    expect(parseFigure("kitap")).toBe("none");
    expect(parseFigure(undefined)).toBe("none");
  });
  it("registry her figür için meta içerir", () => {
    for (const id of Object.keys(FIGURES)) {
      expect(parseFigure(id)).toBe(id);
    }
  });
});

describe("FIGURES meta", () => {
  it("intro imzası çıkışta kesilir, kontur sönümlenir", () => {
    expect(FIGURES.signature.cutOnExit).toBe(true);
    expect(FIGURES.contour.cutOnExit).toBe(false);
  });
  it("kareli kâğıt sadece scroll ile hareket eder (sürekli animasyon yok)", () => {
    expect(FIGURES.grid.animated).toBe(false);
  });
});

describe("Faz 3 figürleri", () => {
  it("landing bölüm figürleri kayıtlı", () => {
    for (const id of ["manifold", "waves", "field"]) expect(parseFigure(id)).toBe(id);
  });
  it("proje portreleri kayıtlı", () => {
    for (const id of ["anomaly", "montecarlo", "network"]) expect(parseFigure(id)).toBe(id);
  });
  it("/projects rotasının varsayılan zemini yok; portreler bölümlerden gelir", () => {
    expect(resolveFigures({ pathname: "/projects", introActive: false, visible: [] })).toEqual([]);
    expect(
      resolveFigures({ pathname: "/projects", introActive: false, visible: ["anomaly", "network"] }),
    ).toEqual(["anomaly", "network"]);
  });
});

describe("weightStep", () => {
  it("reduced-motion'da anında hedefe", () => {
    expect(weightStep({ current: 0, target: 1, dt: 0.016, instant: true, cut: false, edgeAttached: false })).toBe(1);
  });
  it("cutOnExit figür çıkışta anında 0", () => {
    expect(weightStep({ current: 1, target: 0, dt: 0.016, instant: false, cut: true, edgeAttached: false })).toBe(0);
  });
  it("bölüm kenarına bağlı figür girişte beklemez (kenar zaten geçiş)", () => {
    expect(weightStep({ current: 0, target: 1, dt: 0.016, instant: false, cut: false, edgeAttached: true })).toBe(1);
  });
  it("aksi hâlde üstel yumuşama, hedefe yaklaşınca oturur", () => {
    const w = weightStep({ current: 0, target: 1, dt: 0.016, instant: false, cut: false, edgeAttached: false });
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(0.2);
    expect(weightStep({ current: 0.999, target: 1, dt: 0.016, instant: false, cut: false, edgeAttached: false })).toBe(1);
  });
});

describe("figureAnimating", () => {
  it("sürekli figürler hep animasyonlu", () => {
    expect(figureAnimating("contour", 100)).toBe(true);
    expect(figureAnimating("anomaly", 100)).toBe(true);
    expect(figureAnimating("network", 100)).toBe(true);
  });
  it("çizilip oturan figür süresi dolunca durur (0 fps)", () => {
    expect(figureAnimating("montecarlo", 0.5)).toBe(true);
    expect(figureAnimating("montecarlo", 10)).toBe(false);
  });
  it("statik figürler hiç animasyonlu değil", () => {
    expect(figureAnimating("grid", 0)).toBe(false);
  });
});
