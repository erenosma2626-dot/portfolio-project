import { describe, expect, it } from "vitest";
import type { RoadmapEvent } from "@/content/roadmap";
import { clusterEvents } from "./cluster";
import { dayIndex } from "./dates";
import type { View } from "./timescale";

describe("roadmap clusterEvents", () => {
  const v: View = {
    start: dayIndex("2026-01-01"),
    end: dayIndex("2026-12-31"), // 365 gün
  };

  const sampleEvents: RoadmapEvent[] = [
    {
      id: "ev-out-before",
      date: "2025-11-01",
      endDate: null,
      kind: "writing",
      status: "done",
      title: "Out Before",
      summary: "Out of view window",
      href: null,
    },
    {
      id: "ev-1",
      date: "2026-03-01",
      endDate: null,
      kind: "project",
      status: "done",
      title: "Event 1",
      summary: "Summary 1",
      href: "/projects",
    },
    {
      id: "ev-2",
      date: "2026-03-02",
      endDate: null,
      kind: "internship",
      status: "done",
      title: "Event 2",
      summary: "Summary 2",
      href: "/about",
    },
    {
      id: "ev-3",
      date: "2026-07-01",
      endDate: null,
      kind: "writing",
      status: "done",
      title: "Event 3",
      summary: "Summary 3",
      href: null,
    },
    {
      id: "ev-out-after",
      date: "2027-05-01",
      endDate: null,
      kind: "project",
      status: "planned",
      title: "Out After",
      summary: "Out of view window",
      href: "/projects",
    },
  ];

  it("boş liste verildiğinde boş küme dizisi dönmelidir", () => {
    expect(clusterEvents(v, [], 0.04)).toEqual([]);
  });

  it("pencere dışındaki olayları filtrelemelidir (project < 0 veya > 1)", () => {
    const onlyOutside = [sampleEvents[0], sampleEvents[4]];
    expect(clusterEvents(v, onlyOutside, 0.04)).toEqual([]);
  });

  it("yakın olayları tek bir kümede birleştirmeli ve uzak olayları ayrı tutmalıdır", () => {
    const clusters = clusterEvents(v, sampleEvents, 0.04);

    expect(clusters).toHaveLength(2);

    // İlk küme: ev-1 ve ev-2
    expect(clusters[0].events).toHaveLength(2);
    expect(clusters[0].events.map((e) => e.id)).toEqual(["ev-1", "ev-2"]);
    const expectedP1 = (dayIndex("2026-03-01") - v.start) / (v.end - v.start);
    const expectedP2 = (dayIndex("2026-03-02") - v.start) / (v.end - v.start);
    expect(clusters[0].at).toBeCloseTo((expectedP1 + expectedP2) / 2, 4);

    // İkinci küme: ev-3
    expect(clusters[1].events).toHaveLength(1);
    expect(clusters[1].events[0].id).toBe("ev-3");
    const expectedP3 = (dayIndex("2026-07-01") - v.start) / (v.end - v.start);
    expect(clusters[1].at).toBeCloseTo(expectedP3, 4);
  });

  it("kümeleme 'at' konumu kümedeki olayların project değerlerinin ortalaması olmalıdır", () => {
    const wideView: View = {
      start: dayIndex("2026-01-01"),
      end: dayIndex("2026-01-01") + 100,
    };
    const evA: RoadmapEvent = {
      id: "a",
      date: "2026-01-02",
      endDate: null,
      kind: "writing",
      status: "done",
      title: "A",
      summary: "S",
      href: null,
    };
    const evB: RoadmapEvent = {
      id: "b",
      date: "2026-01-04",
      endDate: null,
      kind: "writing",
      status: "done",
      title: "B",
      summary: "S",
      href: null,
    };

    const clusters = clusterEvents(wideView, [evA, evB], 0.04);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].events).toEqual([evA, evB]);
    expect(clusters[0].at).toBeCloseTo((0.01 + 0.03) / 2, 5);
  });
});
