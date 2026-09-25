/**
 * Figür kayıt defteri (K1 "Çizgi Figürleri"). Sayfalar yalnızca figür adı
 * verir; çizim bileşenleri components/scene/figures altında.
 */
export const FIGURES = {
  none: { label: "Boş", animated: false, cutOnExit: false },
  // Intro figürü perde tamamen kapalıyken ayrılır → sönümlemeden kesilir.
  signature: { label: "Kendini çizen Lissajous imza eğrisi", animated: true, cutOnExit: true },
  contour: { label: "Nefes alan kontur haritası", animated: true, cutOnExit: false },
  grid: { label: "Perspektif kareli kâğıt", animated: false, cutOnExit: false },
  // Landing (Faz 3)
  manifold: { label: "Dönen tel-kafes manifold", animated: true, cutOnExit: false },
  waves: { label: "Akan sinüs yazı satırları", animated: true, cutOnExit: false },
  field: { label: "İletişime yakınsayan vektör alanı", animated: true, cutOnExit: false },
  // /projects portreleri (kenar notları: 900ms çizilme; anomaly & network yavaşça devam eder)
  anomaly: { label: "Anomali sinyali", animated: true, cutOnExit: false },
  montecarlo: { label: "Monte Carlo yelpazesi", animated: true, cutOnExit: false },
  network: { label: "Nabız atan düğüm grafı", animated: true, cutOnExit: false },
} as const;

export type FigureId = keyof typeof FIGURES;

/** Çizilip sonra duran figürler: bu kadar saniye sonra kare istemez. */
const SETTLE_AFTER: Partial<Record<FigureId, number>> = {
  montecarlo: 1.5,
};

export function figureAnimating(id: FigureId, age: number): boolean {
  if (!FIGURES[id].animated) return false;
  const settle = SETTLE_AFTER[id];
  return settle === undefined || age < settle;
}

/** Bölüm eşlemesi olmayan yerlerde rota varsayılanı. */
export const ROUTE_FIGURES: Record<string, FigureId[]> = {
  "/": [],
  "/about": ["grid"],
  "/projects": [],
};

/**
 * Her rotada render edilmesine izin verilen figürler kümesi.
 * Rota değişiminde önceki sayfanın figürlerinin yeni sayfaya sızmasını önler.
 */
export const ROUTE_ALLOWED_FIGURES: Record<string, readonly FigureId[]> = {
  "/": ["signature", "contour", "manifold", "waves", "field"],
  "/about": ["grid"],
  "/projects": ["anomaly", "montecarlo", "network"],
};

export function parseFigure(value: string | undefined | null): FigureId {
  return value && Object.hasOwn(FIGURES, value) ? (value as FigureId) : "none";
}

/** O an sahnede olması gereken figürler (ağırlığı 1'e gidenler). */
export function resolveFigures({
  pathname,
  introActive,
  visible,
}: {
  pathname: string;
  introActive: boolean;
  visible: FigureId[];
}): FigureId[] {
  if (pathname === "/" && introActive) return ["signature"];
  const allowed = ROUTE_ALLOWED_FIGURES[pathname] ?? [];
  const fromSections = [...new Set(visible.filter((f) => f !== "none" && allowed.includes(f)))];
  if (fromSections.length > 0) return fromSections;
  return ROUTE_FIGURES[pathname] ?? [];
}

/**
 * Bir figür ağırlığının bir karelik adımı. Bölüm kenarına bağlı figür
 * (ekrana kenardan giren/çıkan) sönümlenmez: kenar zaten geçişin kendisi,
 * gecikmeli fade "geç kalmış" görünür. Rota/intro değişiminde yumuşak fade.
 */
export function weightStep({
  current,
  target,
  dt,
  instant,
  cut,
  edgeAttached,
}: {
  current: number;
  target: number;
  dt: number;
  instant: boolean;
  cut: boolean;
  edgeAttached: boolean;
}): number {
  if (instant) return target;
  if (target === 0 && cut) return 0;
  if (target === 1 && edgeAttached) return 1;
  const next = current + (target - current) * (1 - Math.exp(-dt * 3.2));
  return Math.abs(target - next) < 0.003 ? target : next;
}
