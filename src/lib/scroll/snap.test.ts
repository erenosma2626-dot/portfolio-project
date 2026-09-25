import { describe, expect, it } from "vitest";
import { adjacentTarget, idleReady, snapDuration, snapPoints, snapTarget } from "./snap";

const H = 800;
// Dört tam ekran bölüm (landing).
const fit = [
  { top: 0, bottom: 800 },
  { top: 800, bottom: 1600 },
  { top: 1600, bottom: 2400 },
  { top: 2400, bottom: 3200 },
];
const points = snapPoints(fit, H);
const base = { points, h: H, pull: 0.5, forwardCommit: 0.2, tallPull: 0.18 };

describe("snapPoints", () => {
  it("ekrana sığan bölümler için bölüm başları", () => {
    expect(points).toEqual([0, 800, 1600, 2400]);
  });
  it("uzun bölümde başı ve sonu (alt kenar hizası) ekler", () => {
    expect(snapPoints([{ top: 0, bottom: 800 }, { top: 800, bottom: 2400 }], H)).toEqual([0, 800, 1600]);
  });
});

describe("snapTarget", () => {
  it("tam hizalıyken hiçbir şey yapmaz", () => {
    expect(snapTarget({ ...base, y: 800, direction: 1 })).toBeNull();
    expect(snapTarget({ ...base, y: 800.4, direction: 0 })).toBeNull();
  });
  it("yön yoksa en yakın bölüm başına oturur", () => {
    expect(snapTarget({ ...base, y: 900, direction: 0 })).toBe(800);
    expect(snapTarget({ ...base, y: 1500, direction: 0 })).toBe(1600);
  });
  it("aşağı kaydırırken sonraki bölüme %20 girildiyse ileri gider (sayfa çevirme)", () => {
    expect(snapTarget({ ...base, y: 800 + 0.25 * H, direction: 1 })).toBe(1600);
  });
  it("aşağı kaydırma az kaldıysa geri döner (zorlamaz)", () => {
    expect(snapTarget({ ...base, y: 800 + 0.1 * H, direction: 1 })).toBe(800);
  });
  it("yukarı kaydırırken simetrik", () => {
    expect(snapTarget({ ...base, y: 1600 - 0.25 * H, direction: -1 })).toBe(800);
    expect(snapTarget({ ...base, y: 1600 - 0.1 * H, direction: -1 })).toBe(1600);
  });
  it("pull küçükse (touch) iki bölüm ortasında serbest bırakır", () => {
    expect(snapTarget({ ...base, pull: 0.3, forwardCommit: 1, y: 1200, direction: 0 })).toBeNull();
    expect(snapTarget({ ...base, pull: 0.3, forwardCommit: 1, y: 850, direction: 0 })).toBe(800);
  });
  it("uzun bölümün içinde serbest; sadece kenara yakınken hizalar", () => {
    const tall = snapPoints([{ top: 0, bottom: 800 }, { top: 800, bottom: 3200 }], H); // 0, 800, 2400
    const t = { ...base, points: tall };
    expect(snapTarget({ ...t, y: 1500, direction: 1 })).toBeNull();
    expect(snapTarget({ ...t, y: 850, direction: 1 })).toBe(800);
    expect(snapTarget({ ...t, y: 2350, direction: 1 })).toBe(2400);
  });
  it("snap noktası yoksa null", () => {
    expect(snapTarget({ ...base, points: [], y: 100, direction: 1 })).toBeNull();
  });
  it("son noktanın ötesinde (footer vb.) en yakına sadece pull içinde döner", () => {
    expect(snapTarget({ ...base, y: 2400 + 0.3 * H, direction: 0 })).toBe(2400);
    expect(snapTarget({ ...base, y: 2400 + 0.7 * H, direction: 0 })).toBeNull();
  });
});

describe("adjacentTarget (PageDown/PageUp/Space)", () => {
  it("sonraki / önceki bölüm başı", () => {
    expect(adjacentTarget(points, 800, 1)).toBe(1600);
    expect(adjacentTarget(points, 900, -1)).toBe(800);
    expect(adjacentTarget(points, 800, -1)).toBe(0);
  });
  it("uçta null (native davranışa bırak)", () => {
    expect(adjacentTarget(points, 2400, 1)).toBeNull();
    expect(adjacentTarget(points, 0, -1)).toBeNull();
  });
});

describe("snapDuration", () => {
  const d = { base: 0.5, perViewport: 0.4, max: 1.1 };
  it("mesafeyle artar, üst sınırlı", () => {
    expect(snapDuration(0, H, d)).toBe(0.5);
    expect(snapDuration(400, H, d)).toBeCloseTo(0.7);
    expect(snapDuration(10000, H, d)).toBe(1.1);
  });
});

describe("idleReady (hizalama ne zaman başlar)", () => {
  const base = { now: 1000, idleMs: 200, touching: false };
  it("son kullanıcı input'undan idleMs geçtiyse hazır", () => {
    expect(idleReady({ ...base, lastInputAt: 790, lastNativeScrollAt: 0 })).toBe(true);
  });
  it("input'tan beri idleMs dolmadıysa (trackpad momentumu dahil) bekle", () => {
    expect(idleReady({ ...base, lastInputAt: 900, lastNativeScrollAt: 0 })).toBe(false);
  });
  it("native scroll (touch momentumu, ok tuşu, scrollbar) sürüyorsa bekle", () => {
    expect(idleReady({ ...base, lastInputAt: 0, lastNativeScrollAt: 950 })).toBe(false);
  });
  it("parmak ekrandayken asla", () => {
    expect(idleReady({ ...base, touching: true, lastInputAt: 0, lastNativeScrollAt: 0 })).toBe(false);
  });
  it("Lenis'in kendi yumuşatma kuyruğu beklemeyi uzatmaz (parametre bile değil)", () => {
    // lerp kuyruğu ~1.5 sn sürse de karar yalnız input/native zamanına bakar.
    expect(idleReady({ ...base, lastInputAt: 780, lastNativeScrollAt: 0 })).toBe(true);
  });
});
