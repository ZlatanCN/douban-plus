import godfather from "../fixtures/metacritic/godfather-part-ii-user-score.html?raw";
import { makeClaim, makeData, mockNetwork } from "./subject-runtime-test-utils";

const godfatherUrl = "https://www.metacritic.com/movie/the-godfather-part-ii/";

const godfatherData = () =>
  makeData({
    info: {
      ...makeData().info,
      imdb: "tt0071562",
      releaseDate: "1974-12-12(美国)",
    },
    subjectId: "1299131",
    title: {
      full: "教父2 The Godfather Part II",
      original: "The Godfather: Part II",
      primary: "教父2",
      seasonLabel: "",
    },
    year: "1974",
  });

const mockGodfatherNetwork = (page: string = godfather): string[] => {
  const requests: string[] = [];
  mockNetwork((url) => {
    requests.push(url);
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return {
          body: JSON.stringify({ query: { search: [{ title: "Q184768" }] } }),
        };
      }
      return {
        body: JSON.stringify({
          entities: {
            Q184768: {
              claims: {
                P31: [makeClaim({ id: "Q11424" })],
                P1712: [makeClaim("movie/the-godfather-part-ii")],
                P345: [makeClaim("tt0071562")],
                P4529: [makeClaim("1299131")],
              },
              id: "Q184768",
            },
          },
        }),
      };
    }
    if (url === godfatherUrl) {
      return { body: page };
    }
    return { body: "", status: 404 };
  });
  return requests;
};

export { godfatherData, mockGodfatherNetwork };
