/**
 * Intro kararı: oturum içinde bir kez oynar; hash ile gelen ziyaretçi
 * (ör. /#projects) intro'yu atlar ve doğrudan hedefe iner.
 */
export const INTRO_SEEN_KEY = "eo:intro-seen";

export type IntroMode = "play" | "skip";

export function decideIntro({
  pathname,
  hash,
  seen,
}: {
  pathname: string;
  hash: string;
  seen: boolean;
}): IntroMode {
  // Intro katmanı yalnız ana sayfada var; başka rotada "play" scroll'u kilitlerdi.
  if (pathname !== "/") return "skip";
  if (seen) return "skip";
  if (hash.length > 1) return "skip";
  return "play";
}

/**
 * <html>'e ilk boyamadan önce data-intro yazan satır içi script. İçerik
 * decideIntro ile aynı kuralı uygular (inline script modül import edemez).
 * CSS, intro katmanını ve scroll kilidini bu attribute'a bağlar — JS yoksa
 * attribute da yoktur, landing doğrudan görünür. data-js="1" ise scroll
 * reveal animasyonlarının başlangıç (gizli) hâlini açar — JS yoksa içerik
 * hiç gizlenmez.
 */
export const introBootstrapScript = `(function(){var m="play";try{var l=window.location,h=l.hash||"";if(l.pathname!=="/"||h.length>1||window.sessionStorage.getItem(${JSON.stringify(
  INTRO_SEEN_KEY,
)})==="1")m="skip";}catch(e){}var d=document.documentElement.dataset;d.intro=m;d.js="1";})();`;

/** Scroll/swipe jestiyle perdeyi elle sürükleme: viewport yüksekliği kadar jest = tam açılış. */
export function advanceGesture(progress: number, delta: number, viewportHeight: number): number {
  const next = progress + delta / Math.max(viewportHeight, 1);
  return Math.min(1, Math.max(0, next));
}

export const COMMIT_THRESHOLD = 0.3;

export function shouldCommit(progress: number): boolean {
  return progress >= COMMIT_THRESHOLD;
}
