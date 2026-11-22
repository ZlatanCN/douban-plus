import type { MovieHomeData } from "@/modules/movie-home/domain";

type SearchFormProps = {
  search: MovieHomeData["search"];
};

const SearchForm = ({ search }: SearchFormProps) => (
  <search>
    <form action={search.action} class="atv-movie-home-search" method="get">
      <label class="atv-movie-home-search-label" htmlFor="atv-movie-home-query">
        搜索豆瓣电影
      </label>
      <div class="atv-movie-home-search-field">
        <input
          aria-label="搜索电影、电视剧、综艺或影人"
          autoComplete="off"
          enterKeyHint="search"
          id="atv-movie-home-query"
          maxLength={60}
          name={search.queryName}
          placeholder="搜索电影、电视剧、综艺、影人"
          type="search"
        />
        <input
          name={search.categoryName}
          type="hidden"
          value={search.categoryValue}
        />
        <button type="submit">搜索</button>
      </div>
    </form>
  </search>
);

export { SearchForm };
