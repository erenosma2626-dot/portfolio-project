/**
 * Site navigasyonu (etiketler content sözlüğünde). Numaralama monografi dilinde: landing bölümleri §1..§4,
 * /about alt bölümleri 1.1..1.4.
 */
export const NAV_ITEMS = [
  { id: "about", number: "§1" },
  { id: "projects", number: "§2" },
  { id: "writings", number: "§3" },
  { id: "roadmap", number: "§4" },
  { id: "contact", number: "§5" },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

/** Kendi sayfası olan bölümler. */
const ROUTES: Partial<Record<NavId, string>> = {
  about: "/about",
  projects: "/projects",
};

export function navHref(pathname: string, id: NavId): string {
  const route = ROUTES[id];
  if (route) return route;
  return pathname === "/" ? `#${id}` : `/#${id}`;
}

export function logoAction(pathname: string): "scroll-top" | "navigate" {
  return pathname === "/" ? "scroll-top" : "navigate";
}

/** Sıralı bölüm üst kenarları (belge px) içinde probe'un geçtiği son bölüm; yoksa -1. */
export function activeIndex(tops: number[], probe: number): number {
  let index = -1;
  for (let i = 0; i < tops.length; i++) {
    if (tops[i] <= probe) index = i;
  }
  return index;
}

/** Alt sayfa rotasının karşılık geldiği nav öğesi; ana sayfada scroll belirler. */
export function routeActive(pathname: string): NavId | null {
  const entry = Object.entries(ROUTES).find(([, route]) => route === pathname);
  return entry ? (entry[0] as NavId) : null;
}
