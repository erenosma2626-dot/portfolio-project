import { describe, expect, it } from "vitest";
import {
  INTRO_SEEN_KEY,
  advanceGesture,
  decideIntro,
  introBootstrapScript,
  shouldCommit,
} from "./intro";

describe("decideIntro", () => {
  it("ilk ziyarette, hash yokken intro oynar", () => {
    expect(decideIntro({ pathname: "/", hash: "", seen: false })).toBe("play");
  });
  it("oturumda görüldüyse atlar", () => {
    expect(decideIntro({ pathname: "/", hash: "", seen: true })).toBe("skip");
  });
  it("hash ile gelen ziyaretçi intro'yu atlar", () => {
    expect(decideIntro({ pathname: "/", hash: "#projects", seen: false })).toBe("skip");
  });
  it("boş hash ('#') hash sayılmaz", () => {
    expect(decideIntro({ pathname: "/", hash: "#", seen: false })).toBe("play");
  });
});

describe("decideIntro — rota", () => {
  it("intro sadece ana sayfada oynar; alt sayfalara doğrudan gelen kilitlenmez", () => {
    expect(decideIntro({ pathname: "/about", hash: "", seen: false })).toBe("skip");
  });
});

describe("introBootstrapScript", () => {
  function run(hash: string, stored: string | null, throws = false, pathname = "/") {
    const dataset: Record<string, string> = {};
    const win = {
      location: { hash, pathname },
      sessionStorage: {
        getItem: (k: string) => {
          if (throws) throw new Error("blocked");
          return k === INTRO_SEEN_KEY ? stored : null;
        },
      },
    };
    new Function("window", "document", introBootstrapScript)(win, {
      documentElement: { dataset },
    });
    return dataset.intro;
  }

  it("JS'in çalıştığını data-js ile işaretler (reveal animasyonları için)", () => {
    const dataset: Record<string, string> = {};
    new Function("window", "document", introBootstrapScript)(
      { location: { hash: "", pathname: "/" }, sessionStorage: { getItem: () => null } },
      { documentElement: { dataset } },
    );
    expect(dataset.js).toBe("1");
  });

  it("html'e data-intro=play yazar (ilk ziyaret)", () => {
    expect(run("", null)).toBe("play");
  });
  it("oturum bayrağı varsa skip", () => {
    expect(run("", "1")).toBe("skip");
  });
  it("hash varsa skip", () => {
    expect(run("#contact", null)).toBe("skip");
  });
  it("alt sayfada skip (intro katmanı yok, scroll kilitlenmemeli)", () => {
    expect(run("", null, false, "/about")).toBe("skip");
  });
  it("sessionStorage erişilemezse sessizce oynatır", () => {
    expect(run("", null, true)).toBe("play");
  });
});

describe("intro jest ilerlemesi", () => {
  it("aşağı jest ilerletir, 0..1'e sıkışır", () => {
    expect(advanceGesture(0, 100, 1000)).toBeCloseTo(0.1);
    expect(advanceGesture(0.9, 500, 1000)).toBe(1);
    expect(advanceGesture(0.05, -200, 1000)).toBe(0);
  });
  it("eşik üstü commit eder", () => {
    expect(shouldCommit(0.29)).toBe(false);
    expect(shouldCommit(0.3)).toBe(true);
  });
});
