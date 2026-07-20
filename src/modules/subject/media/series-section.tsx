import { PosterImage } from "@/components/common/poster-image";
import { Section } from "@/components/layout/section";
import type { ResolvedSeriesItem } from "@/modules/subject/types";

import { getSubjectSectionCopy } from "../section-copy";

type SeriesSectionProps = {
  items: ResolvedSeriesItem[];
  moreLink?: { href: string; text: string };
};

const SeriesSection = ({ items, moreLink }: SeriesSectionProps) =>
  items.length ? (
    <Section
      id="atv-series"
      {...(moreLink ? { moreLink } : {})}
      title={getSubjectSectionCopy("series").sectionTitle}
    >
      <div class="atv-carousel atv-series-carousel">
        {items.map((item) => {
          const className = `atv-series-card${item.isCurrent ? " is-active" : ""}`;
          const key = item.link || item.title;
          const content = (
            <>
              <div class="atv-series-poster">
                <PosterImage alt={item.title} poster={item.poster} />
                {item.rating ? (
                  <span class="atv-series-badge">{item.rating}</span>
                ) : null}
              </div>
              <div class="atv-series-info">
                <span class="atv-series-title">{item.title}</span>
              </div>
            </>
          );

          return item.link ? (
            <a
              class={className}
              href={item.link}
              key={key}
              rel="noopener"
              target="_blank"
            >
              {content}
            </a>
          ) : (
            <div class={className} key={key}>
              {content}
            </div>
          );
        })}
      </div>
    </Section>
  ) : null;

export { SeriesSection };
export type { SeriesSectionProps };
