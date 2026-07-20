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
      <div
        class={`atv-carousel atv-personage-work-rail${rail.works.length === 5 ? " is-complete" : ""}`}
      >
        {rail.works.map((work) => (
          <a
            class="atv-personage-work-card"
            href={work.href}
            key={work.href}
            rel="noopener"
            target="_blank"
          >
            <div class="atv-personage-work-poster">
              <PosterImage alt={work.title} poster={work.poster} />
              {work.rating ? (
                <span class="atv-personage-work-rating">{work.rating}</span>
              ) : null}
            </div>
            <span class="atv-personage-work-title">{work.title}</span>
          </a>
        ))}
      </div>
    </Section>
  );
};

export { PersonageWorkRail };
export type { PersonageWorkRailProps };
