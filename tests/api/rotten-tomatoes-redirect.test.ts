import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGmGetResponse = vi.hoisted(() =>
  vi.fn<
    (
      url: string
    ) => Promise<{ finalUrl: string; responseText: string; status: number }>
  >()
);

vi.mock(import("../../src/shared/utils/request"), () => ({
  gmGetResponse: mockGmGetResponse,
}));

const { fetchRtRating } =
  await import("../../src/modules/subject/api/external-ratings/rotten-tomatoes");

const claim = (value: unknown) => ({
  mainsnak: { datavalue: { value }, snaktype: "value" },
  rank: "normal",
});

const rtPage = `<link rel="canonical" href="https://www.rottentomatoes.com/m/the_godfather_part_ii"><script type="application/ld+json">${JSON.stringify(
  { "@type": "Movie" }
)}</script><script data-json="mediaScorecard">${JSON.stringify({
  audienceScore: { ratingCount: "250,000+", scorePercent: "97" },
  criticsScore: { ratingCount: 130, scorePercent: "96" },
})}</script>`;

describe(fetchRtRating, () => {
  beforeEach(() => {
    mockGmGetResponse.mockReset();
    localStorage.clear();
  });

  it("accepts the Rotten Tomatoes canonical redirect for Godfather Part II", async () => {
    mockGmGetResponse.mockImplementation((url) => {
      const requestUrl = new URL(url);
      if (requestUrl.hostname === "www.wikidata.org") {
        if (requestUrl.searchParams.get("action") === "query") {
          const query = requestUrl.searchParams.get("srsearch");
          const search =
            query === "haswbstatement:P345=tt0071562"
              ? [{ title: "Q184768" }]
              : [];
          return Promise.resolve({
            finalUrl: url,
            responseText: JSON.stringify({ query: { search } }),
            status: 200,
          });
        }

        return Promise.resolve({
          finalUrl: url,
          responseText: JSON.stringify({
            entities: {
              Q184768: {
                claims: {
                  P31: [claim({ id: "Q11424" })],
                  P1258: [claim("m/godfather_part_ii")],
                  P345: [claim("tt0071562")],
                },
                id: "Q184768",
              },
            },
          }),
          status: 200,
        });
      }

      return Promise.resolve({
        finalUrl: "https://www.rottentomatoes.com/m/the_godfather_part_ii",
        responseText: rtPage,
        status: 200,
      });
    });

    await expect(
      fetchRtRating(
        {
          imdbId: "tt0071562",
          kind: "movie",
          season: null,
          seasonConflict: false,
          subjectId: "1299131",
          subjectTitle: "教父2",
          unsupportedEpisode: false,
        },
        new AbortController().signal
      )
    ).resolves.toMatchObject({
      rating: {
        audienceScore: 97,
        criticsScore: 96,
        object: {
          kind: "movie",
          rtId: "m/godfather_part_ii",
          subjectId: "1299131",
        },
        sourceUrl: "https://www.rottentomatoes.com/m/the_godfather_part_ii",
      },
      status: "refreshed",
    });

    expect(mockGmGetResponse).toHaveBeenCalledWith(
      "https://www.rottentomatoes.com/m/godfather_part_ii",
      "https://www.rottentomatoes.com/",
      expect.objectContaining({ timeoutMs: expect.any(Number) })
    );
  });
});
