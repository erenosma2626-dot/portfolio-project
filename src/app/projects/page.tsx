import type { Metadata } from "next";
import Link from "next/link";
import { Row } from "@/components/monograph";
import { Reveal } from "@/components/reveal";
import { content } from "@/content";

const { projects, common, meta, nav } = content;

export const metadata: Metadata = {
  title: meta.projectsTitle,
  description: meta.projectsDescription,
};

export default function ProjectsPage() {
  return (
    <div className="text-navy">
      <article className="mx-auto max-w-5xl px-5 pb-28 pt-32 sm:px-8 sm:pt-40">
        {/* İlk ekran Reveal ile gizlenmez (LCP). */}
        <header>
          <Row margin={<span className="font-heading text-base font-bold">§2</span>}>
            <h1 className="text-4xl leading-tight sm:text-5xl">{projects.title}</h1>
          </Row>
        </header>

        <div className="mt-20 space-y-24">
          {projects.items.map((project, i) => (
            <section
              key={project.id}
              id={project.id}
              data-project-id={project.id}
              data-figure={project.figure}
              className="scroll-mt-28"
            >
              <Reveal aboveFold={i === 0}>
                <Row>
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
                    <div>
                      <h2 className="text-2xl sm:text-3xl">{project.title}</h2>
                      {/* <1024px ekranda figür başlığın altına, tam genişlik, 140px yükseklikte */}
                      <div
                        aria-hidden
                        data-scene-plate
                        data-figure={project.figure}
                        className="mt-4 h-[140px] w-full lg:hidden pointer-events-none"
                      />
                      <p className="mt-5 max-w-[62ch] text-lg leading-[1.75]">
                        {project.statement}
                      </p>
                    </div>

                    {/* lg (≥1024px) ekranda sağ kenar boşluğunda, boyut ~280×180px, başlık hizasında başlar */}
                    <div
                      aria-hidden
                      data-scene-plate
                      data-figure={project.figure}
                      className="hidden h-[180px] w-[280px] shrink-0 lg:block pointer-events-none"
                    />
                  </div>
                </Row>
              </Reveal>
            </section>
          ))}
        </div>

        <Reveal className="mt-28">
          <Row>
            <div className="flex flex-wrap items-baseline justify-between gap-6 border-t border-current/15 pt-8">
              <Link href="/about" className="link-underline text-sm">
                ← §1 {nav.labels.about}
              </Link>
              <Link href="/#writings" className="group text-right">
                <span className="block text-xs italic opacity-75">{common.nextSection}</span>
                <span className="font-heading text-2xl font-bold">
                  §3 {nav.labels.writings}{" "}
                  <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </div>
          </Row>
        </Reveal>
      </article>
    </div>
  );
}
