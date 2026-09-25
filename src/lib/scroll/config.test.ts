import { describe, expect, it } from "vitest";
import { SCROLL, scrollPolicy } from "./config";

describe("scrollPolicy", () => {
  it("landing: ağırlık + hizalama", () => {
    expect(scrollPolicy("/", false)).toEqual({ smooth: true, snap: true });
  });
  it("okuma sayfaları: ağırlık var, hizalama yok", () => {
    expect(scrollPolicy("/about", false)).toEqual({ smooth: SCROLL.weight.onReadingPages, snap: false });
    expect(scrollPolicy("/projects", false)).toEqual({ smooth: SCROLL.weight.onReadingPages, snap: false });
  });
  it("reduced-motion: ikisi de kapalı", () => {
    expect(scrollPolicy("/", true)).toEqual({ smooth: false, snap: false });
  });
});

describe("SCROLL parametreleri", () => {
  it("makul aralıklarda", () => {
    expect(SCROLL.weight.lerp).toBeGreaterThan(0);
    expect(SCROLL.weight.lerp).toBeLessThanOrEqual(1);
    expect(SCROLL.snap.touch.pull).toBeLessThan(SCROLL.snap.pull);
  });
});
