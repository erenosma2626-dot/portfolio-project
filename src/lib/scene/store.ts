import type { FigureId } from "./figures";
import type { ScreenBand, ScreenRect } from "./sections";

/**
 * DOM tarafı (scroll, intro) ile canvas tarafı arasındaki küçük paylaşımlı
 * durum. Canvas her frame'de doğrudan okur; her değişiklikte abonelere haber
 * verilir (frameloop="demand" için invalidate tetikler).
 */
export interface SceneState {
  /** Geçerli rota yolu (örn. "/", "/about", "/projects"). */
  pathname: string;
  /** Viewport'taki bölüm dilimleri (ekran koordinatı, CSS px). */
  bands: ScreenBand[];
  /** Sahnede olması gereken figürler. */
  figures: FigureId[];
  /** Figür başına ekran dikdörtgeni (CSS px); yoksa tam ekran. */
  rects: Partial<Record<FigureId, ScreenRect>>;
  /** Fareyle üzerine gelinen figür (hover efekti için). */
  hoveredFigure: FigureId | null;
  /** Belge scroll konumu (CSS px) — scroll'a bağlı figürler (paralaks) için. */
  scrollY: number;
  introActive: boolean;
  reducedMotion: boolean;
}

type Listener = () => void;

let state: SceneState = {
  pathname: "/",
  bands: [],
  figures: [],
  rects: {},
  hoveredFigure: null,
  scrollY: 0,
  introActive: false,
  reducedMotion: false,
};
const listeners = new Set<Listener>();

export const sceneStore = {
  get: () => state,
  set(partial: Partial<SceneState>) {
    const changed = (Object.keys(partial) as (keyof SceneState)[]).some(
      (key) => partial[key] !== undefined && partial[key] !== state[key],
    );
    if (!changed) return;
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
