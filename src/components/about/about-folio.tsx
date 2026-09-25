"use client";

import { useEffect, useState } from "react";
import { content } from "@/content";
import { activeIndex } from "@/lib/nav";

/**
 * Sağ kenarda ince "içindekiler cetveli" (yalnız geniş ekranlar). Aktif
 * bölümün çizgisi uzar; tıklayınca bölüme kayar.
 */
export function AboutFolio({ items }: { items: { id: string; number: string; label: string }[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const tops = items.map((item) => {
        const el = document.getElementById(item.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
      // Sayfa sonunda son bölüm kısa kalsa da aktif olabilsin.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(atEnd ? items.length - 1 : Math.max(0, activeIndex(tops, window.scrollY + window.innerHeight * 0.35)));
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
  }, [items]);

  return (
    <nav
      aria-label={content.nav.onThisPage}
      className="fixed right-8 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol className="space-y-3 text-right text-xs">
        {items.map((item, i) => {
          const isActive = i === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className="group flex items-center justify-end gap-3"
              >
                <span
                  className={`transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-70 group-focus-visible:opacity-70"
                  }`}
                >
                  {item.label}
                </span>
                <span className="w-7 tabular-nums opacity-75">{item.number}</span>
                <span
                  aria-hidden
                  className={`block h-px bg-current transition-all duration-500 ${
                    isActive ? "w-10 opacity-100" : "w-4 opacity-30 group-hover:opacity-60"
                  }`}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
