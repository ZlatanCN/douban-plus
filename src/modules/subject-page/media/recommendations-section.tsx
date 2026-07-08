import { PosterImage } from "../../../components/common/poster-image";
import { Section } from "../../../components/layout/section";
import type { Recommendation } from "../../../types";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

const RecommendationsSection = ({
  recommendations,
}: RecommendationsSectionProps) =>
  recommendations.length ? (
    <Section id="atv-recs" title="相似作品">
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
