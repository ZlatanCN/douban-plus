import { makeClaim, mockNetwork } from "./subject-runtime-test-utils";

type SeasonResponseOptions = {
  pageParentUrl: string;
  pageSeasonNumber: number;
  userReviewSeason: number;
};

const capturedSeasonPage = (
  source: string,
  { pageParentUrl, pageSeasonNumber, userReviewSeason }: SeasonResponseOptions
): string => {
  const page = new DOMParser().parseFromString(source, "text/html");
  const script = page.querySelector('script[type="application/ld+json"]');
  if (script?.textContent) {
    const schema = JSON.parse(script.textContent) as {
      partOfSeries: { url: string };
      seasonNumber: number;
    };
    schema.partOfSeries.url = pageParentUrl;
    schema.seasonNumber = pageSeasonNumber;
    script.textContent = JSON.stringify(schema);
  }
  for (const link of page.querySelectorAll<HTMLAnchorElement>(
    '[data-testid="global-score-review-count-link"]'
  )) {
    link.setAttribute(
      "href",
      `/tv/game-of-thrones/user-reviews/?season=season-${userReviewSeason}`
    );
  }
  return page.documentElement.outerHTML;
};

const mockGameOfThronesNetwork = (
  requests: string[],
  seasonPage: () => string
): void => {
  mockNetwork((url) => {
    requests.push(url);
    if (url === "https://graphql.imdb.com/") {
      return {
        body: JSON.stringify({
          data: {
            title: {
              id: "tt1971833",
              ratingsSummary: { aggregateRating: 8.6, voteCount: 52_000 },
              series: {
                series: {
                  id: "tt0944947",
                  titleText: { text: "Game of Thrones" },
                },
              },
              titleText: { text: "The North Remembers" },
            },
          },
        }),
      };
    }
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        const identifier = requestUrl.searchParams.get("srsearch") ?? "";
        const search = identifier.includes("P345=tt1971833")
          ? [{ title: "Q7754352" }]
          : [];
        return { body: JSON.stringify({ query: { search } }) };
      }
      const ids = (requestUrl.searchParams.get("ids") ?? "").split("|");
      if (ids.includes("Q7754352")) {
        return {
          body: JSON.stringify({
            entities: {
              Q7754352: {
                claims: {
                  P31: [makeClaim({ id: "Q21191270" })],
                  P345: [makeClaim("tt1971833")],
                  P4908: [
                    {
                      ...makeClaim({ id: "Q302358" }),
                      qualifiers: { P1545: [makeClaim("1")] },
                    },
                  ],
                },
              },
            },
          }),
        };
      }
      if (ids.includes("Q302358")) {
        return {
          body: JSON.stringify({
            entities: {
              Q302358: {
                claims: {
                  P1545: [makeClaim("2")],
                  P1712: [makeClaim("tv/game-of-thrones/season-2")],
                  P179: [makeClaim({ id: "Q23572" })],
                  P31: [makeClaim({ id: "Q3464665" })],
                },
              },
            },
          }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q23572: {
              id: "Q23572",
              claims: {
                P31: [makeClaim({ id: "Q5398426" })],
                P345: [makeClaim("tt0944947")],
              },
            },
          },
        }),
      };
    }
    if (url === metacriticSeasonUrl) {
      return { body: seasonPage() };
    }
    if (url === guessedSeasonUrl) {
      return { body: "", status: 404 };
    }
    if (url === guessedSeriesUrl) {
      return {
        body: '<script type="application/ld+json">{"aggregateRating":{"ratingValue":84,"reviewCount":200}}</script>',
      };
    }
    return { body: "", status: 404 };
  });
};

const guessedSeasonUrl =
  "https://www.metacritic.com/tv/a-song-of-ice-and-fire-game-of-thrones/season-2";
const guessedSeriesUrl =
  "https://www.metacritic.com/tv/a-song-of-ice-and-fire-game-of-thrones";
const metacriticSeasonUrl =
  "https://www.metacritic.com/tv/game-of-thrones/season-2/";
const canonicalSeasonUrl =
  "https://www.metacritic.com/tv/game-of-thrones/season-2/";

export {
  capturedSeasonPage,
  canonicalSeasonUrl,
  guessedSeasonUrl,
  guessedSeriesUrl,
  mockGameOfThronesNetwork,
  metacriticSeasonUrl,
};
