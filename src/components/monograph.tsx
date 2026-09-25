import type { ReactNode } from "react";
import { content } from "@/content";

/**
 * Monografi düzeni yapı taşları (/about, /projects): dar kenar sütunu
 * (künye: numara, tarih, konum) + geniş içerik sütunu.
 */
export function Row({ margin, children }: { margin?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-x-12 gap-y-3 lg:grid-cols-[10rem_minmax(0,1fr)]">
      <div className="text-sm leading-relaxed opacity-70 lg:pt-1 lg:text-right">{margin}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SectionHeading({ number, children }: { number: string; children: ReactNode }) {
  return (
    <Row margin={<span className="font-heading text-base font-bold tabular-nums opacity-100">{number}</span>}>
      <h2 className="text-2xl sm:text-3xl">{children}</h2>
    </Row>
  );
}

export function Keywords({ items }: { items: readonly string[] }) {
  return (
    <p className="mt-4 text-sm leading-relaxed">
      <span className="italic opacity-75">{content.common.keywords}</span>
      <span className="opacity-80">{items.join(" · ")}</span>
    </p>
  );
}

