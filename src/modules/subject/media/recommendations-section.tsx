import type { Recommendation } from "@/modules/subject/domain";
import { PosterImage } from "@/shared/components/common/poster-image";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";

type RecommendationsSectionProps = {
  recommendations: Recommendation[];
};

const RecommendationsSection = ({
  recommendations,
}: RecommendationsSectionProps) =>
  recommendations.length ? (
    <Section
      id="atv-recs"
      title={getSubjectSectionCopy("recommendations").sectionTitle}
    >
      <div class="atv-recs">
        {recommendations.map((item) => {
          const content = (
            <>
              <div class="atv-rec-poster">
                <PosterImage alt={item.title} poster={item.poster} />
              </div>
              <div class="atv-rec-title">{item.title}</div>
            </>
          );

          return item.link ? (
            <a
              class="atv-rec-card"
              href={item.link}
              key={item.link}
              rel="noopener"
              target="_blank"
            >
              {content}
            </a>
          ) : (
            <div class="atv-rec-card" key={item.title}>
              {content}
            </div>
          );
        })}
      </div>
    </Section>
  ) : null;

export { RecommendationsSection };
export type { RecommendationsSectionProps };
