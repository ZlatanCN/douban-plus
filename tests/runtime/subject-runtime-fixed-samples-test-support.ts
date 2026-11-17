import { expect, vi } from "vitest";

import { extractDoubanData } from "@/modules/subject/runtime/extract-data";

import shawshankDouban from "../fixtures/douban-ratings/shawshank-identity.html?raw";
import sampleManifest from "../fixtures/external-ratings/v1/manifest.json";
import wikidataEntity from "../fixtures/external-ratings/v1/wikidata/entity-q172241.json";
import wikidataSearch from "../fixtures/external-ratings/v1/wikidata/search-by-douban-id.json";
import shawshankMc from "../fixtures/metacritic/shawshank.html?raw";
import shawshankRt from "../fixtures/rotten-tomatoes/shawshank.html?raw";
import { mockNetwork } from "./subject-runtime-test-utils";

const sample =
  sampleManifest.samples.find(({ id }) => id === "shawshank-movie") ??
  (() => {
    throw new Error("The fixed sample manifest is missing shawshank-movie.");
  })();

const sampleData = () => {
  const fixtureDocument = new DOMParser().parseFromString(
    shawshankDouban,
    "text/html"
  );
  const extracted = extractDoubanData(fixtureDocument);
  return { ...extracted, subjectId: sample.work.doubanSubjectId };
};

const withoutCanonicalLink = (html: string): string => {
  const page = new DOMParser().parseFromString(html, "text/html");
  page.querySelector('link[rel="canonical"]')?.remove();
  return page.documentElement.outerHTML;
};

const mockSampleNetwork = (
  variantId: string | null,
  requests: string[]
): void => {
  mockNetwork((url) => {
    requests.push(url);
    if (url.includes("wikidata.org/w/api.php")) {
      const requestUrl = new URL(url);
      if (requestUrl.searchParams.get("action") === "query") {
        return { body: JSON.stringify(wikidataSearch) };
      }
      const [sourceEntity] = Object.values(
        structuredClone(wikidataEntity).entities
      );
      if (!sourceEntity) {
        throw new Error("The captured Wikidata entity fragment is empty.");
      }
      const removedClaim = {
        "without-metacritic-id": "P1712",
        "without-rotten-tomatoes-id": "P1258",
        "without-wikidata-instance-of": "P31",
      }[variantId ?? ""];
      let claims: Record<string, unknown> = { ...sourceEntity.claims };
      if (removedClaim) {
        claims = Object.fromEntries(
          Object.entries(sourceEntity.claims).filter(
            ([property]) => property !== removedClaim
          )
        );
      }
      return {
        body: JSON.stringify({
          entities: {
            [sample.work.wikidataId]: { ...sourceEntity, claims },
          },
        }),
      };
    }
    if (url === sample.sources.rottenTomatoes.url) {
      const body =
        variantId === "controlled-rotten-tomatoes-no-rating"
          ? shawshankRt.replace(
              /<script type="application\/json" data-json="mediaScorecard">[\s\S]*?<\/script>/u,
              '<script type="application/json" data-json="mediaScorecard">{"criticsScore":null,"audienceScore":null}</script>'
            )
          : shawshankRt;
      return { body };
    }
    if (url === sample.sources.metacritic.url) {
      let body = shawshankMc;
      if (variantId === "without-metacritic-canonical") {
        body = withoutCanonicalLink(shawshankMc);
      } else if (variantId === "controlled-metacritic-invalid-score") {
        body = shawshankMc.replace('"ratingValue": 82', '"ratingValue": ""');
      }
      return { body };
    }
    return { body: "", status: 404 };
  });
};

const identityLookupRequests = (requests: string[]) => {
  const wikiRequests = requests.filter((url) =>
    url.includes("wikidata.org/w/api.php")
  );
  return {
    entities: wikiRequests.filter(
      (url) => new URL(url).searchParams.get("action") === "wbgetentities"
    ),
    searches: wikiRequests.filter(
      (url) => new URL(url).searchParams.get("action") === "query"
    ),
  };
};

const visibleRtScores = (root: HTMLElement): string[] =>
  [...root.querySelectorAll(".atv-rt-score-value")].map(
    (node) => node.textContent?.trim() ?? ""
  );

const assertSourceOutcomes = async (
  root: HTMLElement,
  requests: string[],
  expected: { metacritic: string; rottenTomatoes: string }
): Promise<void> => {
  const expectedRtScores =
    expected.rottenTomatoes === "rating"
      ? [
          `${sample.expected.rottenTomatoes.criticsScore}%`,
          `${sample.expected.rottenTomatoes.audienceScore}%`,
        ]
      : [];
  const expectedMcScore =
    expected.metacritic === "rating"
      ? String(sample.expected.metacritic.score)
      : null;

  await vi.waitFor(() => {
    const lookups = identityLookupRequests(requests);
    expect(lookups.searches.length).toBeGreaterThanOrEqual(2);
    expect(lookups.entities.length).toBeGreaterThanOrEqual(2);
  });
  const expectedRtPage = expected.rottenTomatoes !== "unavailable";
  const expectedMcPage = expected.metacritic !== "unavailable";
  if (expectedRtPage) {
    await vi.waitFor(() =>
      expect(requests).toContain(sample.sources.rottenTomatoes.url)
    );
  }
  if (expectedMcPage) {
    await vi.waitFor(() =>
      expect(requests).toContain(sample.sources.metacritic.url)
    );
  }
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  if (expected.rottenTomatoes === "rating") {
    await vi.waitFor(() =>
      expect(visibleRtScores(root)).toStrictEqual(expectedRtScores)
    );
  }
  if (expected.metacritic === "rating") {
    await vi.waitFor(() =>
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe(expectedMcScore)
    );
  }

  expect(visibleRtScores(root)).toStrictEqual(expectedRtScores);
  expect(
    root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
      ?.textContent ?? null
  ).toBe(expectedMcScore);
  expect(requests.includes(sample.sources.rottenTomatoes.url)).toBe(
    expectedRtPage
  );
  expect(requests.includes(sample.sources.metacritic.url)).toBe(expectedMcPage);
};

export {
  assertSourceOutcomes,
  mockSampleNetwork,
  sample,
  sampleData,
  visibleRtScores,
};
