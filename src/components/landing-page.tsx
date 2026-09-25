import Link from "next/link";
import { content } from "@/content";
import type { FigureId } from "@/lib/scene/figures";
import type { Tone } from "@/lib/scene/sections";
import { RoadmapFigure } from "./roadmap/roadmap-figure";
import { Reveal } from "./reveal";

const { landing } = content;

const sections: {
  id: "projects" | "writings" | "roadmap" | "contact";
  kicker: string;
  tone: Tone;
  figure: FigureId;
  href: string | null;
}[] = [
  { id: "projects", kicker: "§2", tone: "dark", figure: "manifold", href: "/projects" },
  { id: "writings", kicker: "§3", tone: "light", figure: "waves", href: null },
  // Roadmap koyu, Contact açık: beyaz/navy invert ritmi 5 bölümde korunur.
  { id: "roadmap", kicker: "§4", tone: "dark", figure: "none", href: null },
  { id: "contact", kicker: "§5", tone: "light", figure: "field", href: null },
];

export function LandingPage() {
  return (
    <div>
      <h1 className="sr-only">{landing.srTitle}</h1>
      {/* data-scene-*: arka plan sahnesi bu bölümleri ölçer (ton + figür). */}
      <section
        id="about"
        data-scene-section
        data-tone="light"
        data-figure="contour"
        className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-navy"
      >
        <span className="font-heading text-base font-bold opacity-75">§1</span>
        <h2 className="mt-3 text-3xl sm:text-4xl">{landing.about.title}</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed opacity-75 sm:text-base">
          {landing.about.body}
        </p>
        <Link
          href="/about"
          className="mt-6 rounded-full border border-navy/30 px-5 py-2 text-sm font-semibold"
        >
          {landing.readMore}
        </Link>
      </section>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          data-scene-section
          data-tone={section.tone}
          data-figure={section.figure}
          className={`flex min-h-screen flex-col items-center justify-center px-6 text-center ${
            section.tone === "dark" ? "bg-navy text-white" : "bg-white text-navy"
          }`}
        >
          <Reveal className="flex w-full flex-col items-center">
            <span className="font-heading text-base font-bold opacity-75">{section.kicker}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl">{landing[section.id].title}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed opacity-75 sm:text-base">
              {landing[section.id].body}
            </p>
            {section.id === "roadmap" && <RoadmapFigure />}
            {section.href && (
              <Link
                href={section.href}
                className="mt-6 rounded-full border border-current/30 px-5 py-2 text-sm font-semibold"
              >
                {landing.readMore}
              </Link>
            )}
          </Reveal>
        </section>
      ))}
    </div>
  );
}
