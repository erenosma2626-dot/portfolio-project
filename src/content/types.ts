import type { FigureId } from "@/lib/scene/figures";
import type { NavId } from "@/lib/nav";

/**
 * Sitenin tüm metinleri bu şekle uyan tek bir sözlükten gelir (i18n'e hazır:
 * TR/EN geçişi eklendiğinde ikinci bir sözlük yazılıp content/index.ts'te
 * seçilecek). Bileşenlere metin gömülmez.
 */
export interface Experience {
  org: string;
  role: string;
  period: string;
  bullets: string[];
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  statement: string;
  keywords: string[];
  figure: FigureId;
  caption: string;
}

export interface Content {
  locale: "en" | "tr";
  meta: {
    siteTitle: string;
    description: string;
    aboutTitle: string;
    aboutDescription: string;
    projectsTitle: string;
    projectsDescription: string;
  };
  nav: {
    ariaLabel: string;
    labels: Record<NavId, string>;
    menu: string;
    close: string;
    onThisPage: string;
  };
  intro: {
    kicker: string;
    heading: string;
    scrollLabel: string;
  };
  landing: {
    srTitle: string;
    about: { title: string; body: string };
    projects: { title: string; body: string };
    writings: { title: string; body: string };
    roadmap: { title: string; body: string };
    contact: { title: string; body: string };
    readMore: string;
  };
  common: {
    keywords: string;
    nextSection: string;
    home: string;
  };
  about: {
    title: string;
    location: string;
    language: string;
    definitionLabel: string;
    definitionName: string;
    summary: string;
    contact: { email: string; phone: string; cv: string; cvLink: string };
    sections: { aboutMe: string; education: string; experiences: string; certifications: string };
    education: { university: string; degree: string; period: string };
    experiences: Experience[];
    remarkLabel: string;
    /** Deneyim satırı aç/kapa için ekran okuyucu ipucu. */
    experienceToggle: { show: string; hide: string };
    certifications: string[];
  };
  projects: {
    title: string;
    figureLabel: string;
    items: Project[];
  };
  roadmap: {
    ariaLabel: string;
    today: string;
    planned: string;
    open: string;
    allEntries: string;
    scale: { label: string; near: string; far: string };
    months: string[];
    kinds: Record<"internship" | "project" | "writing", string>;
  };
  notFound: {
    title: string;
    lemmaLabel: string;
    lemma: string;
    proofLabel: string;
    proof: string;
  };
}
