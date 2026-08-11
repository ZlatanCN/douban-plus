import { describe, expect, it } from "vitest";

import { analyzeSources } from "../../scripts/css-audit/index.mjs";

const css = (text: string, path = "fixture.css") => [{ path, text }];

describe("static CSS audit", () => {
  it("reports an owned selector with no static usage evidence", () => {
    const result = analyzeSources({
      cssSources: css(`
        .atv-personage-award-aa {
          color: red;
        }
      `),
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-rule",
        selector: ".atv-personage-award-aa",
      })
    );
  });

  it("keeps selectors referenced by JSX class attributes", () => {
    const result = analyzeSources({
      cssSources: css(".atv-personage-award-aa { color: red; }"),
      runtimeSources: [
        {
          path: "award.tsx",
          text: 'const view = <div class="atv-personage-award-aa" />;',
        },
      ],
    });

    expect(result.findings).toStrictEqual([]);
  });

  it("does not call a dynamically composed class dead", () => {
    const result = analyzeSources({
      cssSources: css(".atv-award-state-active { color: red; }"),
      runtimeSources: [
        {
          path: "award.tsx",
          text: `const view = <div class={\`atv-award-state-\${status}\`} />;`,
        },
      ],
    });

    expect(result.findings).toStrictEqual([]);
    expect(result.unverified).toContainEqual(
      expect.objectContaining({ reason: "dynamic class template" })
    );
  });

  it("reports only the unused branch of a selector list", () => {
    const result = analyzeSources({
      cssSources: css(".atv-award-used, .atv-award-dead { color: red; }"),
      runtimeSources: [
        {
          path: "award.tsx",
          text: 'const view = <div class="atv-award-used" />;',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-selector-branch",
        selector: ".atv-award-dead",
      })
    );
    expect(result.findings).not.toContainEqual(
      expect.objectContaining({ selector: ".atv-award-used" })
    );
  });

  it("keeps host selectors visible as unverified", () => {
    const result = analyzeSources({
      cssSources: css(".subject-intro { color: red; }"),
    });

    expect(result.unverified).toContainEqual(
      expect.objectContaining({
        kind: "host-dependent",
        selector: ".subject-intro",
      })
    );
  });

  it("collects static DOM selector and class-list evidence", () => {
    const result = analyzeSources({
      cssSources: css(`
        .atv-query-target { color: red; }
        .atv-class-list-target { color: blue; }
        #atv-id-target { color: green; }
      `),
      runtimeSources: [
        {
          path: "runtime.ts",
          text: `
            document.querySelector(".atv-query-target");
            element.classList.add("atv-class-list-target");
            document.getElementById("atv-id-target");
          `,
        },
      ],
    });

    expect(result.findings).toStrictEqual([]);
  });

  it("follows custom-property dependencies and reports dead properties", () => {
    const result = analyzeSources({
      cssSources: css(`
        :root {
          --atv-dead-color: red;
          --atv-chain-color: var(--atv-live-color);
          --atv-live-color: blue;
        }
        .atv-color-consumer { color: var(--atv-chain-color); }
      `),
      runtimeSources: [
        {
          path: "consumer.tsx",
          text: 'const view = <div class="atv-color-consumer" />;',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-custom-property",
        name: "--atv-dead-color",
      })
    );
    expect(
      result.findings.filter(({ kind }) => kind === "dead-custom-property")
    ).toHaveLength(1);
  });

  it("reports keyframes that have no animation reference", () => {
    const result = analyzeSources({
      cssSources: css(`
        @keyframes atv-unused-motion { from { opacity: 0; } }
        @keyframes atv-used-motion { from { opacity: 0; } }
        .atv-motion-consumer {
          animation: atv-used-motion 160ms ease-out;
        }
      `),
      runtimeSources: [
        {
          path: "motion.tsx",
          text: 'const view = <div class="atv-motion-consumer" />;',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-keyframes",
        name: "atv-unused-motion",
      })
    );
    expect(result.findings).not.toContainEqual(
      expect.objectContaining({
        kind: "dead-keyframes",
        name: "atv-used-motion",
      })
    );
  });

  it("parses CSS templates only at explicit CSS sinks", () => {
    const result = analyzeSources({
      cssSources: [],
      runtimeSources: [
        {
          path: "theme.ts",
          text: [
            "const THEME_CSS = `.atv-css-in-ts { color: red; }`;",
            "const CONFIG_TEXT = `.atv-not-css { color: red; }`;",
            'const label = "{ var(--not-css) }";',
            "style.textContent = THEME_CSS;",
            'const view = <div class="atv-css-in-ts" />;',
          ].join("\n"),
        },
      ],
    });

    expect(result.findings).toStrictEqual([]);
  });

  it("distinguishes custom-property reads, writes, and inline CSS values", () => {
    const result = analyzeSources({
      cssSources: css(`
        :root {
          --atv-inline-live: red;
          --atv-read-live: blue;
          --atv-write-only: green;
        }
      `),
      runtimeSources: [
        {
          path: "runtime.tsx",
          text: `
            <div style={{ color: "var(--atv-inline-live)" }} />;
            getComputedStyle(element).getPropertyValue("--atv-read-live");
            element.style.setProperty("--atv-write-only", "purple");
          `,
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-custom-property",
        name: "--atv-write-only",
      })
    );
    expect(
      result.findings.filter(({ kind }) => kind === "dead-custom-property")
    ).toHaveLength(1);
  });

  it("reports unresolved project custom-property references", () => {
    const result = analyzeSources({
      cssSources: css(".atv-reference { color: var(--atv-missing); }"),
      runtimeSources: [
        {
          path: "reference.tsx",
          text: 'const view = <div class="atv-reference" />;',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "unresolved-custom-property",
        name: "--atv-missing",
      })
    );
  });

  it("does not treat ordinary strings as class usage", () => {
    const result = analyzeSources({
      cssSources: css(".atv-not-a-class { color: red; }"),
      runtimeSources: [
        {
          path: "labels.ts",
          text: 'const label = "atv-not-a-class";',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-rule",
        selector: ".atv-not-a-class",
      })
    );
  });

  it("does not keep variables or keyframes referenced only by dead CSS", () => {
    const result = analyzeSources({
      cssSources: css(`
        :root { --atv-dead-chain: red; }
        .atv-dead-component {
          color: var(--atv-dead-chain);
          animation: atv-dead-motion 160ms linear;
        }
        @keyframes atv-dead-motion { from { opacity: 0; } }
      `),
    });

    expect(result.findings).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "dead-custom-property",
          name: "--atv-dead-chain",
        }),
        expect.objectContaining({
          kind: "dead-keyframes",
          name: "atv-dead-motion",
        }),
      ])
    );
  });

  it("audits static CSS only when it reaches a style text sink", () => {
    const result = analyzeSources({
      cssSources: [],
      runtimeSources: [
        {
          path: "theme.ts",
          text: [
            "const CSS_TEXT = `.atv-unused-theme { color: red; }`;",
            "const label = CSS_TEXT;",
            "style.textContent = CSS_TEXT;",
          ].join("\n"),
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-rule",
        selector: ".atv-unused-theme",
      })
    );
  });

  it("audits CSS passed to a static GM_addStyle sink", () => {
    const result = analyzeSources({
      cssSources: [],
      runtimeSources: [
        {
          path: "theme.ts",
          text: 'GM_addStyle(".atv-unused-gm-style { color: red; }");',
        },
      ],
    });

    expect(result.findings).toContainEqual(
      expect.objectContaining({
        kind: "dead-rule",
        selector: ".atv-unused-gm-style",
      })
    );
  });

  it("exposes an unknown CSS sink as an unverified boundary", () => {
    const result = analyzeSources({
      cssSources: [],
      runtimeSources: [
        {
          path: "theme.ts",
          text: "style.textContent = getThemeCss();",
        },
      ],
    });

    expect(result.unverified).toContainEqual(
      expect.objectContaining({ reason: "dynamic CSS sink" })
    );
  });
});
