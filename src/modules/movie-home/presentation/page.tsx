import type { MovieHomeData } from "@/modules/movie-home/domain";

import { HotMovies } from "./hot-movies";
import { Lists } from "./lists";
import { Ranking } from "./ranking";
import { Recommendations } from "./recommendations";
import { Reviews } from "./reviews";
import { SearchForm } from "./search-form";

type MovieHomePageProps = {
  data: MovieHomeData;
  initialPage: number;
};

const MovieHomePage = ({ data, initialPage }: MovieHomePageProps) => (
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
      <HotMovies data={data.hotMovies} initialPage={initialPage} />
      {data.ranking ? <Ranking ranking={data.ranking} /> : null}
      {data.lists ? <Lists lists={data.lists} /> : null}
      {data.recommendations ? (
        <Recommendations recommendations={data.recommendations} />
      ) : null}
      {data.reviews ? <Reviews reviews={data.reviews} /> : null}
    </main>
  </div>
);

export { MovieHomePage };
