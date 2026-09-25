"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { content } from "@/content";
import { NAV_ITEMS, activeIndex, logoAction, navHref, routeActive, type NavId } from "@/lib/nav";
import { toneUnder, type Tone } from "@/lib/scene/sections";
import { scrollToHash, scrollToY } from "@/lib/scroll/controller";

const EASE = [0.45, 0, 0.15, 1] as const;

/** Header'ın altındaki bölüm tonu, scroll durumu ve landing'de aktif bölüm. */
function useHeaderState(pathname: string) {
  const [tone, setTone] = useState<Tone>("light");
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<NavId | null>(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene-section]"));
      const rects = sections.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, tone: (el.dataset.tone === "dark" ? "dark" : "light") as Tone };
      });
      setTone(toneUnder(rects, 32));
      setScrolled(window.scrollY > 8);

      const fromRoute = routeActive(pathname);
      if (fromRoute) {
        setActive(fromRoute);
      } else if (pathname === "/") {
        const tops = NAV_ITEMS.map((item) => {
          const el = document.getElementById(item.id);
          return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
        });
        const i = activeIndex(tops, window.scrollY + window.innerHeight * 0.4);
        setActive(i >= 0 ? NAV_ITEMS[i].id : null);
      } else {
        setActive(null);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return { tone, scrolled, active };
}

/**
 * Sabit üst başlık: solda isim (ana sayfadayken başa kaydırır), sağda
 * monografi numaralı navigasyon. Altındaki bölüm navy ise renkleri invert
 * eder; scroll edilince ince buzlu bir zemin alır. Mobilde tam ekran menü.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const { tone: sectionTone, scrolled, active } = useHeaderState(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const tone: Tone = menuOpen ? "dark" : sectionTone;
  const dark = tone === "dark";


  // Menü açıkken: Esc kapatır, scroll kilitli, odak ilk bağlantıda; kapanınca butona döner.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const button = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    firstLinkRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [menuOpen]);

  const onLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (logoAction(pathname) !== "scroll-top") return;
    event.preventDefault();
    scrollToY(0);
    if (window.location.hash) window.history.replaceState(null, "", "/");
  };

  // Aynı sayfadaki §-linkleri: hizalamayla aynı ease (controller). Menüden
  // gelindiyse scroll kilidi kalkana kadar bir kare bekle.
  const onNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string, fromMenu: boolean) => {
    if (fromMenu) setMenuOpen(false);
    if (!href.startsWith("#") || !document.getElementById(href.slice(1))) return;
    event.preventDefault();
    if (fromMenu) requestAnimationFrame(() => requestAnimationFrame(() => scrollToHash(href)));
    else scrollToHash(href);
  };

  return (
    <header
      className={`site-header fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        dark ? "text-white" : "text-navy"
      }`}
    >
      {/* Buzlu zemin: sadece scroll edilince ve menü kapalıyken. */}
      <div
        aria-hidden
        className={`absolute inset-0 border-b backdrop-blur-md transition-[opacity,background-color,border-color] duration-300 ${
          dark ? "border-white/10 bg-navy/80" : "border-navy/10 bg-white/80"
        } ${scrolled && !menuOpen ? "opacity-100" : "opacity-0"}`}
      />

      <nav
        aria-label={content.nav.ariaLabel}
        className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-[72px] sm:px-8"
      >
        <Link
          href="/"
          onClick={onLogoClick}
          className="font-heading text-lg font-bold tracking-tight sm:text-xl"
        >
          Eren Osma
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={navHref(pathname, item.id)}
                  onClick={(event) => onNavClick(event, navHref(pathname, item.id), false)}
                  aria-current={isActive ? (routeActive(pathname) === item.id ? "page" : "location") : undefined}
                  className="group relative flex items-baseline gap-1.5 py-2 text-[0.95rem]"
                >
                  <span className="text-xs opacity-70 tabular-nums">{item.number}</span>
                  <span className={`transition-opacity ${isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`}>
                    {content.nav.labels[item.id]}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: EASE }}
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-current"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="relative -mr-2 flex h-11 items-center gap-2 px-2 text-sm tracking-wide md:hidden"
        >
          <span>{menuOpen ? content.nav.close : content.nav.menu}</span>
          <span aria-hidden className="relative block h-3 w-5">
            <span
              className={`absolute left-0 block h-px w-5 bg-current transition-transform duration-300 ${
                menuOpen ? "top-1.5 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-5 bg-current transition-transform duration-300 ${
                menuOpen ? "top-1.5 -rotate-45" : "top-2.5"
              }`}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={prefersReducedMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            animate={prefersReducedMotion ? { opacity: 1 } : { clipPath: "inset(0 0 0% 0)" }}
            exit={prefersReducedMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.5, ease: EASE }}
            className="fixed inset-0 -z-10 flex flex-col justify-center bg-navy px-8 text-white md:hidden"
          >
            <ol className="space-y-5">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.12 + i * 0.06, duration: 0.5, ease: EASE }}
                >
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={navHref(pathname, item.id)}
                    onClick={(event) => onNavClick(event, navHref(pathname, item.id), true)}
                    className="flex items-baseline gap-4"
                  >
                    <span className="w-8 text-sm opacity-70 tabular-nums">{item.number}</span>
                    <span
                      className={`font-heading text-4xl font-bold ${active === item.id ? "underline decoration-1 underline-offset-8" : ""}`}
                    >
                      {content.nav.labels[item.id]}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
