import type { MovieHomeMovie } from "@/modules/movie-home/domain";
import { PosterImage } from "@/shared/components/common/poster-image";

type MovieGridProps = {
  movies: MovieHomeMovie[];
};

const MovieCard = ({ movie }: { movie: MovieHomeMovie }) => (
  <article class="atv-movie-home-movie">
    <a
      aria-label={`查看《${movie.title}》详情`}
      class="atv-movie-home-poster"
      href={movie.subjectHref}
    >
      {movie.poster ? (
        <PosterImage alt={movie.title} poster={movie.poster} />
      ) : (
        <div class="atv-movie-home-poster-fallback" aria-hidden="true">
          海报暂缺
        </div>
      )}
    </a>
    <div class="atv-movie-home-movie-body">
      <h3 class="atv-movie-home-movie-title">
        <a href={movie.subjectHref}>{movie.title}</a>
      </h3>
      <div class="atv-movie-home-movie-meta">
        <span class="atv-movie-home-rating">
          {movie.rating ? `豆瓣 ${movie.rating}` : "暂无评分"}
        </span>
        {movie.ticketHref ? (
          <a class="atv-movie-home-ticket" href={movie.ticketHref}>
            选座购票
          </a>
        ) : null}
      </div>
    </div>
  </article>
);

const MovieGrid = ({ movies }: MovieGridProps) => (
  <div class="atv-movie-home-grid">
    {movies.map((movie) => (
      <MovieCard key={movie.subjectHref} movie={movie} />
    ))}
  </div>
);

export { MovieGrid };
