/** Yol haritası olay türü */
export type RoadmapKind = "internship" | "project" | "writing";

/** Yol haritası olay durumu */
export type RoadmapStatus = "done" | "planned";

/** Yol haritası olay kaydı (gün çözünürlüğünde) */
export interface RoadmapEvent {
  id: string;
  date: string; /* "YYYY-MM-DD" */
  endDate: string | null; /* "YYYY-MM-DD" | null */
  kind: RoadmapKind;
  status: RoadmapStatus;
  title: string;
  summary: string; /* ≤140 karakter */
  href: string | null;
}

const DEFAULT_SUMMARY = "Placeholder summary — real content coming soon.";

/**
 * Zaman sıralı yol haritası olay listesi (tarihe göre artan sıralı, gün çözünürlüğü).
 */
export const roadmapEvents: RoadmapEvent[] = [
  {
    id: "filler-internship-1",
    date: "2025-12-10",
    endDate: "2026-02-15",
    kind: "internship",
    status: "done",
    title: "Filler internship I",
    summary: DEFAULT_SUMMARY,
    href: "/about",
  },
  {
    id: "filler-writing-1",
    date: "2026-01-22",
    endDate: null,
    kind: "writing",
    status: "done",
    title: "Filler writing I",
    summary: DEFAULT_SUMMARY,
    href: null,
  },
  {
    id: "filler-project-1",
    date: "2026-03-05",
    endDate: "2026-04-25",
    kind: "project",
    status: "done",
    title: "Filler project I",
    summary: DEFAULT_SUMMARY,
    href: "/projects",
  },
  {
    id: "filler-writing-2",
    date: "2026-04-18",
    endDate: null,
    kind: "writing",
    status: "done",
    title: "Filler writing II",
    summary: DEFAULT_SUMMARY,
    href: null,
  },
  {
    id: "filler-project-2",
    date: "2026-06-02",
    endDate: "2026-07-20",
    kind: "project",
    status: "done",
    title: "Filler project II",
    summary: DEFAULT_SUMMARY,
    href: "/projects",
  },
  {
    id: "filler-internship-2",
    date: "2026-07-14",
    endDate: null,
    kind: "internship",
    status: "done",
    title: "Filler internship II",
    summary: DEFAULT_SUMMARY,
    href: "/about",
  },
  {
    id: "filler-writing-3",
    date: "2026-08-30",
    endDate: "2026-09-22",
    kind: "writing",
    status: "done",
    title: "Filler writing III",
    summary: DEFAULT_SUMMARY,
    href: null,
  },
  {
    id: "filler-project-3",
    date: "2026-09-08",
    endDate: null,
    kind: "project",
    status: "done",
    title: "Filler project III",
    summary: DEFAULT_SUMMARY,
    href: "/projects",
  },
  {
    id: "filler-internship-3",
    date: "2026-09-19",
    endDate: null,
    kind: "internship",
    status: "done",
    title: "Filler internship III",
    summary: DEFAULT_SUMMARY,
    href: "/about",
  },
  {
    id: "planned-project-1",
    date: "2026-10-12",
    endDate: null,
    kind: "project",
    status: "planned",
    title: "Planned project I",
    summary: DEFAULT_SUMMARY,
    href: "/projects",
  },
  {
    id: "planned-writing-1",
    date: "2026-11-15",
    endDate: null,
    kind: "writing",
    status: "planned",
    title: "Planned writing I",
    summary: DEFAULT_SUMMARY,
    href: null,
  },
  {
    id: "planned-project-2",
    date: "2027-02-01",
    endDate: null,
    kind: "project",
    status: "planned",
    title: "Planned project II",
    summary: DEFAULT_SUMMARY,
    href: "/projects",
  },
  {
    id: "planned-milestone",
    date: "2027-06-15",
    endDate: null,
    kind: "internship",
    status: "planned",
    title: "Planned milestone",
    summary: DEFAULT_SUMMARY,
    href: "/about",
  },
];
