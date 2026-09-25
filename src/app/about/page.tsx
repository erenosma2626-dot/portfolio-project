import type { Metadata } from "next";
import Link from "next/link";
import { AboutFolio } from "@/components/about/about-folio";
import { ExperienceList } from "@/components/about/experience-list";
import { ProofLine } from "@/components/about/proof-line";
import { Row, SectionHeading } from "@/components/monograph";
import { Reveal } from "@/components/reveal";
import { content } from "@/content";

const { about, common, meta } = content;

export const metadata: Metadata = {
  title: meta.aboutTitle,
  description: meta.aboutDescription,
};

const sections = [
  { id: "about-me", number: "1.1", label: about.sections.aboutMe },
  { id: "education", number: "1.2", label: about.sections.education },
  { id: "experiences", number: "1.3", label: about.sections.experiences },
  { id: "certifications", number: "1.4", label: about.sections.certifications },
];

// Detaylı deneyimler numaralı "entry", tek satırlık olanlar sonda bir "Remark".
const detailed = about.experiences.filter((exp) => exp.bullets.length > 0);
const brief = about.experiences.filter((exp) => exp.bullets.length === 0);

export default function AboutPage() {
  return (
    <div className="text-navy">
      <AboutFolio items={sections} />

      <article className="relative mx-auto max-w-5xl px-5 pb-28 pt-32 sm:px-8 sm:pt-40">
        <ProofLine items={sections} />
        {/* Ekranın ilk karesi Reveal ile gizlenmez (LCP metni hydration'ı beklemesin). */}
        <header>
          <Row margin={<span className="font-heading text-base font-bold">§1</span>}>
            <h1 className="text-4xl leading-tight sm:text-5xl">{about.title}</h1>
          </Row>
        </header>

        {/* 1.1 — Definition */}
        <section id="about-me" className="mt-14 scroll-mt-28">
          <Row
            margin={
              <div className="space-y-1">
                <p>{about.location}</p>
                <p>{about.language}</p>
              </div>
            }
          >
            <p className="max-w-[62ch] text-lg leading-[1.75]">
              <span className="font-heading font-bold">{about.definitionLabel}</span>{" "}
              <span className="italic">{about.definitionName}</span> {about.summary}
            </p>

            <dl className="mt-8 grid max-w-[62ch] grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-current/15 pt-5 text-sm">
              <dt className="italic opacity-75">{about.contact.email}</dt>
              <dd>
                <a href="mailto:erenosma2626@gmail.com" className="link-underline">
                  erenosma2626@gmail.com
                </a>
              </dd>
              <dt className="italic opacity-75">{about.contact.phone}</dt>
              <dd>
                <a href="tel:+905467856268" className="link-underline">
                  +90 546 785 6268
                </a>
              </dd>
              <dt className="italic opacity-75">{about.contact.cv}</dt>
              <dd>
                <a href="/CV.pdf" target="_blank" rel="noopener noreferrer" className="link-underline">
                  {about.contact.cvLink}
                </a>
              </dd>
            </dl>
          </Row>
        </section>

        {/* 1.2 — Education */}
        <section id="education" className="mt-24 scroll-mt-28">
          <Reveal>
            <SectionHeading number="1.2">{about.sections.education}</SectionHeading>
          </Reveal>
          <Reveal className="mt-8">
            <Row margin={<p className="tabular-nums">{about.education.period}</p>}>
              <div className="flex items-start gap-4">
                <span aria-hidden className="ytu-star mt-1 h-9 w-9 shrink-0 bg-current" />
                <div>
                  <p className="font-heading text-xl font-bold">{about.education.university}</p>
                  <p className="mt-1 italic opacity-80">{about.education.degree}</p>
                </div>
              </div>
            </Row>
          </Reveal>
        </section>

        {/* 1.3 — Experiences */}
        <section id="experiences" className="mt-24 scroll-mt-28">
          <Reveal>
            <SectionHeading number="1.3">{about.sections.experiences}</SectionHeading>
          </Reveal>

          <div className="mt-8">
            <ExperienceList items={detailed} />
          </div>

          <div className="mt-10">
            <Reveal>
              <Row>
                <p className="max-w-[62ch] leading-relaxed">
                  <span className="font-heading font-bold">{about.remarkLabel}</span>{" "}
                  {brief.map((exp, i) => (
                    <span key={exp.org}>
                      {exp.org} — <span className="italic">{exp.role}</span>, {exp.period}
                      {i < brief.length - 1 ? "; " : "."}
                    </span>
                  ))}
                </p>
              </Row>
            </Reveal>
          </div>
        </section>

        {/* 1.4 — Certifications */}
        <section id="certifications" className="mt-24 scroll-mt-28">
          <Reveal>
            <SectionHeading number="1.4">{about.sections.certifications}</SectionHeading>
          </Reveal>
          <Reveal className="mt-8">
            <Row>
              <ol className="space-y-2">
                {about.certifications.map((cert, i) => (
                  <li key={cert} className="flex gap-4">
                    <span className="tabular-nums opacity-75">[{i + 1}]</span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ol>
            </Row>
          </Reveal>
        </section>

        <Reveal className="mt-28">
          <Row>
            <div className="flex flex-wrap items-baseline justify-between gap-6 border-t border-current/15 pt-8">
              <Link href="/" className="link-underline text-sm">
                {common.home}
              </Link>
              <Link href="/projects" className="group text-right">
                <span className="block text-xs italic opacity-75">{common.nextSection}</span>
                <span className="font-heading text-2xl font-bold">
                  §2 {content.nav.labels.projects}{" "}
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
