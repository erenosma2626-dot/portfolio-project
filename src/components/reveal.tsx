"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Görünüme girince bir kez beliren blok. Gizli başlangıç hâli yalnızca
 * html[data-js] varken CSS'te uygulanır (globals.css → .reveal); JS yoksa
 * içerik baştan görünür. Reduced-motion'da CSS hareketsiz gösterir.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  aboveFold = false,
  className = "",
  children,
  ...rest
}: {
  as?: "div" | "header" | "section";
  delay?: number;
  /** İlk ekranda görünen blok: gizlenmez (LCP metni hydration'ı beklemesin). */
  aboveFold?: boolean;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.revealed = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={aboveFold ? className : `reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
