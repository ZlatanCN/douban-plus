import type { MovieHomeData } from "@/modules/movie-home/domain";
import { Section } from "@/shared/components/layout/section";

import { HotMovies } from "./hot-movies";
import { SearchForm } from "./search-form";

type MovieHomePageProps = {
  data: MovieHomeData;
  initialPage: number;
  onPageChange: (page: number) => void;
};

const MovieHomePage = ({
  data,
  initialPage,
  onPageChange,
}: MovieHomePageProps) => (
  <div class="atv-movie-home">
    <header class="atv-movie-home-header">
      <a class="atv-movie-home-brand" href="https://movie.douban.com/">
        豆瓣电影
      </a>
      <SearchForm search={data.search} />
      <nav aria-label="豆瓣电影导航" class="atv-movie-home-nav">
        <ul>
          {data.navigation.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>

    <main>
      <HotMovies
        data={data.hotMovies}
        initialPage={initialPage}
        onPageChange={onPageChange}
      />

      {data.ranking?.items.length ? (
        <Section
          id="atv-movie-home-ranking"
          moreLink={{
            href: data.ranking.more.href,
            text: data.ranking.more.label,
          }}
          title="一周口碑榜"
        >
          <ol class="atv-movie-home-ranking">
            {data.ranking.items.map((item) => (
              <li key={item.href}>
                <span>{item.rank}</span>
                <a href={item.href}>{item.title}</a>
              </li>
            ))}
          </ol>
          {data.ranking.explanation ? (
            <a
              class="atv-movie-home-explanation"
              href={data.ranking.explanation.href}
            >
              {data.ranking.explanation.label}
            </a>
          ) : null}
        </Section>
      ) : null}

      {data.lists?.items.length ? (
        <Section id="atv-movie-home-lists" title="热门片单">
          <ul class="atv-movie-home-lists">
            {data.lists.items.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.title}</a>
                <span>{item.recommendations}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {data.recommendations?.items.length ? (
        <Section id="atv-movie-home-recommendations" title="热门推荐">
          <div class="atv-movie-home-recommendations">
            {data.recommendations.items.map((item) => (
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
      ) : null}

      {data.reviews?.items.length ? (
        <Section id="atv-movie-home-reviews" title="最受欢迎的影评">
          <div class="atv-movie-home-review-links">
            <a href={data.reviews.more.href}>{data.reviews.more.label}</a>
            <a href={data.reviews.latest.href}>{data.reviews.latest.label}</a>
          </div>
          <div class="atv-movie-home-reviews">
            {data.reviews.items.map((review) => (
              <article class="atv-movie-home-review" key={review.href}>
                {review.poster ? (
                  <img alt="" loading="lazy" src={review.poster} />
                ) : null}
                <div>
                  <h3>
                    <a href={review.href}>{review.title}</a>
                  </h3>
                  <p class="atv-movie-home-review-meta">
                    <a href={review.author.href}>{review.author.label}</a>
                    <span>评论</span>
                    <a href={review.subject.href}>{review.subject.label}</a>
                  </p>
                  <p>
                    {review.summary} <a href={review.fullTextHref}>全文</a>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Section>
      ) : null}
    </main>
  </div>
);

export { MovieHomePage };
