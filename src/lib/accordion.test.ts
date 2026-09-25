import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isOpen, panelState, toggle } from "./accordion";

describe("accordion durumu", () => {
  it("varsayılan: hepsi kapalı", () => {
    expect(isOpen(new Set(), "trex")).toBe(false);
  });
  it("toggle açar, tekrar toggle kapatır", () => {
    const a = toggle(new Set(), "trex");
    expect(isOpen(a, "trex")).toBe(true);
    expect(isOpen(toggle(a, "trex"), "trex")).toBe(false);
  });
  it("bağımsız: birden fazla aynı anda açık olabilir", () => {
    const s = toggle(toggle(new Set(), "trex"), "iletisim");
    expect([...s].sort()).toEqual(["iletisim", "trex"]);
  });
  it("girdi kümesini değiştirmez (immutable)", () => {
    const s = new Set<string>();
    toggle(s, "x");
    expect(s.size).toBe(0);
  });
  it("panel data-state değeri", () => {
    expect(panelState(true)).toBe("open");
    expect(panelState(false)).toBe("closed");
  });
});

describe("JS yok fallback (CSS sözleşmesi)", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  it("kapalı hâl yalnız html[data-js] varken uygulanır (JS yoksa içerik açık)", () => {
    expect(css).toMatch(/html\[data-js\]\s+\.accordion-panel\[data-state="closed"\]/);
    expect(css).not.toMatch(/(^|\n)\s*\.accordion-panel\[data-state="closed"\]/);
  });
});
