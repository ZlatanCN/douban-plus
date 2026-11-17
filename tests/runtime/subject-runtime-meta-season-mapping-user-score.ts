// Controlled page markup for the first-episode IMDb -> season-two identity test.
// It is not a captured Metacritic audience-score response.
const controlledSeasonUserScore = (season: number): string =>
  [1, 2]
    .map(
      () =>
        `<div data-testid="global-score-wrapper"><div data-testid="global-score-header">User score</div><a data-testid="global-score-review-count-link" href="/tv/game-of-thrones/user-reviews/?season=season-${season}">Based on 42 User Ratings</a><div data-testid="global-score-value-wrapper" aria-label="User score 8.2 out of 10" title="User score 8.2 out of 10"><span data-testid="global-score-value">8.2</span></div></div>`
    )
    .join("");

const guessedSeasonUrl =
  "https://www.metacritic.com/tv/a-song-of-ice-and-fire-game-of-thrones/season-2";
const guessedSeriesUrl =
  "https://www.metacritic.com/tv/a-song-of-ice-and-fire-game-of-thrones";
const metacriticSeasonUrl =
  "https://www.metacritic.com/tv/game-of-thrones/season-2/";
const canonicalSeasonUrl =
  "https://www.metacritic.com/tv/game-of-thrones/season-02/";

export {
  canonicalSeasonUrl,
  controlledSeasonUserScore,
  guessedSeasonUrl,
  guessedSeriesUrl,
  metacriticSeasonUrl,
};
