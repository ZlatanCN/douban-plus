import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "postcss";
import selectorParser from "postcss-selector-parser";
import { describe, expect, it } from "vitest";

const responsiveStylesheet = parse(
  readFileSync(
    path.resolve(process.cwd(), "src/modules/movie-home/styles/responsive.css"),
    "utf-8"
  )
);

const selectorTargetsClass = (selector: string, className: string): boolean => {
  let targetsClass = false;

  selectorParser((root) => {
    root.walkClasses((node) => {
      if (node.value === className) {
        targetsClass = true;
      }
    });
  }).processSync(selector);

  return targetsClass;
};

const movieHomeSectionHeaderSelectors = (): string[] => {
  const selectors: string[] = [];
  responsiveStylesheet.walkRules((rule) => {
    selectors.push(
      ...rule.selectors.filter((selector) =>
        selectorTargetsClass(selector, "atv-section-h-row")
      )
    );
  });
  return selectors;
};

const readMovieHomeStyle = (name: string): string =>
  readFileSync(
    path.resolve(process.cwd(), `src/modules/movie-home/styles/${name}`),
    "utf-8"
  );

const declarationsFor = (selector: string): Record<string, string> => {
  const declarations = new Map<string, string>();
  responsiveStylesheet.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) {
      return;
    }
    rule.walkDecls((declaration) => {
      declarations.set(
        declaration.prop,
        declaration.value.trim().replaceAll(/\s+/gu, " ")
      );
    });
  });
  return Object.fromEntries(declarations);
};

describe("movie homepage responsive sections", () => {
  it("stacks section headers only on the movie homepage", () => {
    const selectors = movieHomeSectionHeaderSelectors();

    expect(selectors).toStrictEqual([".atv-movie-home .atv-section-h-row"]);
    expect(
      selectors.every((selector) => selector.startsWith(".atv-movie-home "))
    ).toBeTruthy();
    expect(declarationsFor(".atv-movie-home .atv-section-h-row")).toMatchObject(
      {
        "align-items": "flex-start",
        "flex-direction": "column",
        gap: "12px",
      }
    );
  });
});

describe("movie homepage interaction feedback", () => {
  it("gives every homepage link composited pressed feedback with reduced-motion handling", () => {
    const layoutCss = readMovieHomeStyle("layout.css");
    const contentCss = readMovieHomeStyle("content.css");
    const editorialCss = readMovieHomeStyle("editorial.css");
    const allCss = `${layoutCss}\n${contentCss}\n${editorialCss}`;

    expect(allCss).toContain(".atv-movie-home a:active");
    expect(allCss).toMatch(
      /\.atv-movie-home a:active\s*\{[^}]*opacity:\s*0\.72;/su
    );
    expect(allCss).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{/u
    );
    expect(allCss).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)\s*\{/u
    );
  });

  it("releases the native host desktop minimum only for the enhanced movie homepage", () => {
    const layoutCss = readMovieHomeStyle("layout.css");

    expect(layoutCss).toMatch(
      /html:has\(body\.atv-enhanced \.atv-movie-home\)\s*\{[^}]*min-width:\s*0;/su
    );
    expect(layoutCss).toMatch(
      /body\.atv-enhanced:has\(\.atv-movie-home\)\s*\{[^}]*min-width:\s*0;/su
    );
    expect(layoutCss).toMatch(
      /body\.atv-enhanced:has\(\.atv-movie-home\)\s*\{[^}]*width:\s*100%;/su
    );
  });
});
