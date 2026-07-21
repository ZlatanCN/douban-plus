import { PosterImage } from "@/components/common/poster-image";
import { Section } from "@/components/layout/section";

import type { PersonageWorkRail as PersonageWorkRailData } from "./types";

type PersonageWorkRailProps = {
  id: string;
  rail: PersonageWorkRailData | null;
  title: string;
};

const PersonageWorkRail = ({ id, rail, title }: PersonageWorkRailProps) => {
  if (!rail?.works.length) {
    return null;
  }

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
      <div class="atv-personage-work-rail">
        {rail.works.map((work, index) => (
          <a
            class="atv-personage-work-card"
            href={work.href}
            key={work.href}
            rel="noopener"
            target="_blank"
          >
            <div class="atv-personage-work-poster">
              <span class="atv-work-index">{index + 1}</span>
              {work.rating ? (
                <span class="atv-work-rating">{work.rating}</span>
              ) : null}
              <PosterImage alt={work.title} poster={work.poster} />
            </div>
            <span class="atv-personage-work-title">{work.title}</span>
            {work.year ? (
              <span class="atv-personage-work-year">{work.year}</span>
            ) : null}
          </a>
        ))}
      </div>
    </Section>
  );
};

export { PersonageWorkRail };
export type { PersonageWorkRailProps };
