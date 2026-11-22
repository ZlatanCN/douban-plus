import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

type RecommendationsProps = {
  recommendations: NonNullable<MovieHomeData["recommendations"]>;
};

const Recommendations = ({ recommendations }: RecommendationsProps) => {
  if (recommendations.items.length === 0) {
    return null;
  }

  return (
    <Section id="atv-movie-home-recommendations" title="热门推荐">
      <div class="atv-movie-home-recommendations">
        {recommendations.items.map((item) => (
          <a
            aria-label={`${item.title}：${item.summary}`}
            href={item.href}
            key={item.href}
          >
            <img alt="" loading="lazy" src={item.image} />
            <span>
              <strong>{item.title}</strong>
              <span>{item.summary}</span>
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
};

export { Recommendations };
