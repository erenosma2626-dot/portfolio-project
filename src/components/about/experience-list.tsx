"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Keywords, Row } from "@/components/monograph";
import { Reveal } from "@/components/reveal";
import { content, type Experience } from "@/content";
import { isOpen, panelState, toggle } from "@/lib/accordion";

const { experienceToggle } = content.about;

/**
 * About 1.3 — deneyim satırları, varsayılan kapalı. Tüm satır bir <button>
 * (h3 içinde); sağda soluk chevron. Kapalı hâl yalnız html[data-js] ile CSS'te
 * uygulanır → JS yoksa maddeler açık görünür. Kapalı panel hydration sonrası
 * `inert` olur (odaklanamaz), içerik DOM'da kalır.
 */
export function ExperienceList({ items }: { items: Experience[] }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());

  return (
    <div className="border-b border-current/10">
      {items.map((exp, i) => {
        const id = `${exp.org}-${exp.role}`;
        return (
          <Reveal key={id}>
            <ExperienceRow
              exp={exp}
              number={`1.3.${i + 1}`}
              open={isOpen(open, id)}
              onToggle={() => setOpen((current) => toggle(current, id))}
            />
          </Reveal>
        );
      })}
    </div>
  );
}

function ExperienceRow({
  exp,
  number,
  open,
  onToggle,
}: {
  exp: Experience;
  number: string;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // SSR'da inert yok (JS'siz okuyucu içeriğe erişsin); istemcide kapalıyken inert.
  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !open;
  }, [open]);

  return (
    <div className="border-t border-current/10">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="accordion-row group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 py-6 text-left outline-hidden lg:grid-cols-[10rem_minmax(0,1fr)_auto] lg:gap-x-12"
        >
          {/* Hover / focus-visible çerçevesi (globals.css → .accordion-frame) */}
          <span aria-hidden className="accordion-frame" />
          {/* Künye */}
          <span className="col-start-1 block font-body text-sm font-normal leading-relaxed opacity-70 lg:text-right">
            <span className="block font-heading font-bold tabular-nums opacity-100">{number}</span>
            <span className="block tabular-nums">{exp.period}</span>
          </span>
          {/* Başlık */}
          <span className="col-start-1 block lg:col-start-2 lg:row-start-1">
            <span className="block font-heading text-xl font-bold">{exp.org}</span>
            <span className="mt-1 block font-body text-base font-normal italic opacity-80">{exp.role}</span>
          </span>
          {/* Chevron: soluk navy, açıkken yukarı */}
          <span
            aria-hidden
            className="col-start-2 row-span-2 row-start-1 self-center opacity-70 transition-opacity duration-200 group-hover:opacity-90 group-focus-visible:opacity-90 lg:col-start-3 lg:row-span-1"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`accordion-chevron ${open ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          <span className="sr-only">{open ? experienceToggle.hide : experienceToggle.show}</span>
        </button>
      </h3>

      <div ref={panelRef} id={panelId} role="region" className="accordion-panel" data-state={panelState(open)}>
        <div className="accordion-inner">
          <div className="accordion-content pb-8">
            <Row>
              {exp.bullets.length > 1 ? (
                <ol className="roman-list max-w-[62ch] space-y-2 leading-relaxed">
                  {exp.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ol>
              ) : (
                <p className="max-w-[62ch] leading-relaxed">{exp.bullets[0]}</p>
              )}
              <Keywords items={exp.tags} />
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}
