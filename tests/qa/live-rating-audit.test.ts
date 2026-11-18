import { describe, expect, it } from "vitest";

import { classifyDiagnostic } from "./live-rating-audit-classification";

describe("live rating audit classification", () => {
  it("keeps request restrictions and missing outcomes unverified", () => {
    expect(
      classifyDiagnostic({
        cacheAgeMs: null,
        errorCode: "network-failure",
        reason: "request-error",
        source: "rt",
        stage: "request",
        target: null,
      })
    ).toBe("unverified");
    expect(classifyDiagnostic(undefined)).toBe("unverified");
    expect(
      classifyDiagnostic(
        {
          cacheAgeMs: null,
          errorCode: "invalid-page",
          reason: "parse-error",
          source: "mc",
          stage: "parse",
          target: null,
        },
        [
          {
            finalUrl: "https://www.metacritic.com/",
            restricted: true,
            requestUrl: "https://www.metacritic.com/movie/sample/",
            status: 200,
          },
        ]
      )
    ).toBe("unverified");
    expect(
      classifyDiagnostic({
        cacheAgeMs: null,
        errorCode: null,
        reason: "source-no-rating",
        source: "rt",
        stage: "rating",
        target: "m/sample",
      })
    ).toBe("pass");
  });
});
