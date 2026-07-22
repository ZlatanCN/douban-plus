import { PosterImage } from "@/shared/components/common/poster-image";
import { Section } from "@/shared/components/layout/section";

import type { PersonageWork, PersonageWorkRail } from "../domain";

type PersonageTimelineProps = {
  id: string;
  rail: PersonageWorkRail | null;
  title: string;
};

/** Group works by year, descending. Works without a year go under "其他". */
const groupByYear = (works: PersonageWork[]): [string, PersonageWork[]][] => {
  const map = new Map<string, PersonageWork[]>();
  for (const work of works) {
    const key = work.year ?? "其他";
    let group = map.get(key);
    if (!group) {
      group = [];
      map.set(key, group);
    }
    group.push(work);
  }
  return [...map.entries()].toSorted(([a], [b]) => {
    // Years sort descending; "其他" goes last
    if (a === "其他") {
      return 1;
    }
    if (b === "其他") {
      return -1;
    }
    return Number(b) - Number(a);
  });
};

const WorkCard = ({ index, work }: { index: number; work: PersonageWork }) => (
  <a
    class="atv-timeline-card"
    href={work.href}
    rel="noopener"
    style={{ "--stagger-index": String(index) } as Record<string, string>}
    target="_blank"
  >
    <div class="atv-timeline-card-poster">
      <PosterImage alt={work.title} poster={work.poster} />
      {work.rating ? (
        <span class="atv-timeline-card-rating">{work.rating}</span>
      ) : null}
    </div>
    <span class="atv-timeline-card-title">{work.title}</span>
  </a>
);

const PersonageTimeline = ({ id, rail, title }: PersonageTimelineProps) => {
  if (!rail?.works.length) {
    return null;
  }

  const groups = groupByYear(rail.works);

  return (
    <Section
      id={id}
      {...(rail.allWorksHref
        ? {
            moreLink: {
              href: rail.allWorksHref,
              text: "查看全部 →",
            },
          }
        : {})}
      title={title}
    >
      <div
        class="atv-timeline"
        style={
          { "--group-count": String(groups.length) } as Record<string, string>
        }
      >
        {groups.map(([year, works], gi) => (
          <div
            class="atv-timeline-year-group"
            key={year}
            style={{ "--group-index": String(gi) } as Record<string, string>}
          >
            <span class="atv-timeline-year-num">{year}</span>
            <div class="atv-timeline-row">
              {works.map((work, wi) => (
                <WorkCard index={wi} key={work.href} work={work} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export { PersonageTimeline };
export type { PersonageTimelineProps };
