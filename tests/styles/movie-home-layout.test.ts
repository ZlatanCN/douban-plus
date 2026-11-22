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
