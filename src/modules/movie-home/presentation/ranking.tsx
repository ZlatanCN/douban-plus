import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

type RankingProps = {
  ranking: NonNullable<MovieHomeData["ranking"]>;
};

const Ranking = ({ ranking }: RankingProps) => {
  if (ranking.items.length === 0) {
    return null;
  }

  return (
    <Section
      id="atv-movie-home-ranking"
      moreLink={{
        href: ranking.more.href,
        text: ranking.more.label,
      }}
      title="一周口碑榜"
    >
      <ol class="atv-movie-home-ranking">
        {ranking.items.map((item) => (
          <li key={item.href}>
            <span>{item.rank}</span>
            <a href={item.href}>{item.title}</a>
          </li>
        ))}
      </ol>
      {ranking.explanation ? (
        <a class="atv-movie-home-explanation" href={ranking.explanation.href}>
          {ranking.explanation.label}
        </a>
      ) : null}
    </Section>
  );
};

export { Ranking };
