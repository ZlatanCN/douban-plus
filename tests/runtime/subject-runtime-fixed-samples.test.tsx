import { readFile } from "node:fs/promises";
import path from "node:path";

import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { extractDoubanData } from "@/modules/subject/runtime/extract-data";
import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import shawshankDouban from "../fixtures/douban-ratings/shawshank-identity.html?raw";
import sampleManifest from "../fixtures/external-ratings/v1/manifest.json";
import runtimePairManifest from "../fixtures/external-ratings/v1/runtime-pairs.json";
import wikidataEntity from "../fixtures/external-ratings/v1/wikidata/entity-q172241.json";
import wikidataSearch from "../fixtures/external-ratings/v1/wikidata/search-by-douban-id.json";
import shawshankMc from "../fixtures/metacritic/shawshank.html?raw";
import shawshankRt from "../fixtures/rotten-tomatoes/shawshank.html?raw";
import { renderIntoRoot } from "../helpers/render";
import {
  mockNetwork,
  setupSubjectRuntimeHooks,
} from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const sample = sampleManifest.samples.find(
  ({ id }) => id === "shawshank-movie"
);

if (!sample) {
  throw new Error("The fixed sample manifest is missing shawshank-movie.");
}

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

describe("SubjectPageRuntime fixed rating samples", () => {
  setupSubjectRuntimeHooks();

  it("extracts the pinned Douban identity fragment and renders both captured provider pages", async () => {
    const data = sampleData();
    expect(data).toMatchObject({
      isTV: false,
      subjectId: sample.work.doubanSubjectId,
      title: {
        full: "肖申克的救赎 The Shawshank Redemption",
        original: "The Shawshank Redemption",
      },
      year: "1994",
    });

    const requests: string[] = [];
    mockSampleNetwork(null, requests);
    const root = renderIntoRoot(
      <SubjectPageRuntime data={data} doc={document} />
    );

    await vi.waitFor(() => {
      expect(visibleRtScores(root)).toStrictEqual([
        `${sample.expected.rottenTomatoes.criticsScore}%`,
        `${sample.expected.rottenTomatoes.audienceScore}%`,
      ]);
      expect(
        root.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
          ?.textContent
      ).toBe(String(sample.expected.metacritic.score));
    });
    expect(requests).toContain(sample.sources.rottenTomatoes.url);
    expect(root.querySelector<HTMLAnchorElement>(".atv-rt-source")?.href).toBe(
      sample.expected.rottenTomatoes.sourceUrl
    );
    expect(requests).toContain(sample.sources.metacritic.url);
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-metacritic-source")?.href
    ).toBe(sample.expected.metacritic.sourceUrl);
    render(null, root);
  });

  it.each(sample.controlledVariants)(
    "pairs the full source sample with the $id ablation",
    async (variant) => {
      const fullRequests: string[] = [];
      mockSampleNetwork(null, fullRequests);
      const fullRoot = renderIntoRoot(
        <SubjectPageRuntime data={sampleData()} doc={document} />
      );
      await vi.waitFor(() => {
        expect(visibleRtScores(fullRoot)).toStrictEqual([
          `${sample.expected.rottenTomatoes.criticsScore}%`,
          `${sample.expected.rottenTomatoes.audienceScore}%`,
        ]);
        expect(
          fullRoot.querySelector(".atv-rating-panel-mc .atv-rating-panel-score")
            ?.textContent
        ).toBe(String(sample.expected.metacritic.score));
      });
      expect(fullRequests).toContain(sample.sources.rottenTomatoes.url);
      expect(fullRequests).toContain(sample.sources.metacritic.url);
      render(null, fullRoot);

      localStorage.clear();
      const ablatedRequests: string[] = [];
      mockSampleNetwork(variant.id, ablatedRequests);
      const ablatedRoot = renderIntoRoot(
        <SubjectPageRuntime data={sampleData()} doc={document} />
      );
      await assertSourceOutcomes(
        ablatedRoot,
        ablatedRequests,
        variant.expected
      );
      render(null, ablatedRoot);
    }
  );

  it.each(runtimePairManifest.pairs)(
    "links $id to its same-sample SubjectPageRuntime pair",
    async (pair) => {
      expect(pair.testRefs.length).toBeGreaterThan(0);
      const sourceFiles = await Promise.all(
        pair.testRefs.map(async (reference) => ({
          reference,
          source: await readFile(
            path.resolve(process.cwd(), reference.file),
            "utf-8"
          ),
        }))
      );
      for (const { reference, source } of sourceFiles) {
        expect(source).toContain(reference.case);
      }
      const fragments =
        ("sourceFragments" in pair ? pair.sourceFragments : undefined) ?? [];
      const capturedFragments = await Promise.all(
        fragments.map((fragment) =>
          readFile(path.resolve(process.cwd(), fragment), "utf-8")
        )
      );
      expect(capturedFragments).toHaveLength(fragments.length);
    }
  );
});
