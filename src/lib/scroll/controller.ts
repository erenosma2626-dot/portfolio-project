/**
 * Programatik scroll için tek giriş noktası. SmoothScroll (Lenis) aktifken
 * onun ease'li scrollTo'sunu kaydeder; değilse (reduced-motion / SSR öncesi)
 * native'e düşer. §-linkleri ve logo bunu kullanır → hizalamayla aynı his.
 */
type ScrollFn = (y: number) => void;

let registered: ScrollFn | null = null;

export function registerScroller(fn: ScrollFn | null) {
  registered = fn;
}

export function scrollToY(y: number) {
  if (registered) registered(y);
  else window.scrollTo({ top: y, behavior: "auto" });
}

/** Sayfa içi #hash hedefine git; hedef yoksa false (çağıran native'e bıraksın). */
export function scrollToHash(hash: string): boolean {
  const id = hash.replace(/^\/?#/, "");
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  scrollToY(el.getBoundingClientRect().top + window.scrollY);
  window.history.replaceState(null, "", `#${id}`);
  return true;
}
