import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "postcss";
import { describe, expect, it } from "vitest";

const switcherCss = readFileSync(
  path.resolve(
    process.cwd(),
    "src/modules/subject/styles/subject-switcher.css"
  ),
  "utf-8"
);
const suggestionCss = readFileSync(
  path.resolve(
    process.cwd(),
    "src/modules/subject/styles/subject-suggestions.css"
  ),
  "utf-8"
);
const stylesheet = parse(switcherCss);
const suggestionStylesheet = parse(suggestionCss);

const declarationsFor = (
  selector: string,
  source = stylesheet
): Record<string, string> => {
  const declarations = new Map<string, string>();
  source.walkRules((rule) => {
    if (!rule.selector.split(",").some((item) => item.trim() === selector)) {
      return;
    }
    if (declarations.size > 0) {
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

describe("subject switcher layout", () => {
  it("expands left from the trigger without changing its navigation position", () => {
    const navAccessory = declarationsFor(".atv-stickynav-subject-switcher");
    const openNavAccessory = declarationsFor(
      '.atv-stickynav-subject-switcher[data-state="open"]'
    );
    const subjectSwitcher = declarationsFor(".atv-subject-switcher");
    const openSwitcher = declarationsFor(
      '.atv-subject-switcher[data-state="open"]'
    );
    const search = declarationsFor(".atv-subject-switcher-expanded");
    const expandedSearch = declarationsFor(
      '.atv-subject-switcher[data-state="open"] .atv-subject-switcher-expanded'
    );
    const searchField = declarationsFor(".atv-subject-switcher-field");
    const openSearchField = declarationsFor(
      '.atv-subject-switcher[data-state="open"] .atv-subject-switcher-field'
    );
    const snapSearch = declarationsFor(
      '.atv-subject-switcher[data-animation="none"] .atv-subject-switcher-expanded'
    );
    const snapSearchField = declarationsFor(
      '.atv-subject-switcher[data-animation="none"] .atv-subject-switcher-field'
    );
    const searchInput = declarationsFor(".atv-subject-switcher-input");
    const openSearchInput = declarationsFor(
      '.atv-subject-switcher[data-state="open"] .atv-subject-switcher-input'
    );
    const snapSearchInput = declarationsFor(
      '.atv-subject-switcher[data-animation="none"] .atv-subject-switcher-input'
    );

    expect({
      accessoryFlex: navAccessory.flex,
      accessoryMarginLeft: navAccessory["margin-left"],
      openAccessoryDeclarations: Object.keys(openNavAccessory).length,
      switcherPosition: subjectSwitcher.position,
      openSwitcherDeclarations: Object.keys(openSwitcher).length,
      searchPosition: search.position,
      searchTop: search.top,
      searchRight: search.right,
      searchWidth: search.width,
      searchClipPath: search["clip-path"],
      searchTransform: search.transform,
      closedTransition: search.transition,
      openSearchClipPath: expandedSearch["clip-path"],
      openTransition: expandedSearch.transition,
      snapTransition: snapSearch.transition,
      fieldClipPath: searchField["clip-path"],
      openFieldClipPath: openSearchField["clip-path"],
      fieldTransition: searchField.transition,
      openFieldTransition: openSearchField.transition,
      snapFieldTransition: snapSearchField.transition,
      inputClosedOpacity: searchInput.opacity,
      inputOpenOpacity: openSearchInput.opacity,
      inputOpenTransition: openSearchInput.transition,
      inputSnapTransition: snapSearchInput.transition,
    }).toStrictEqual({
      accessoryFlex: "0 0 auto",
      accessoryMarginLeft: "auto",
      openAccessoryDeclarations: 0,
      switcherPosition: "relative",
      openSwitcherDeclarations: 0,
      searchPosition: "absolute",
      searchTop: "50%",
      searchRight: "0",
      searchWidth: "min(44vw, 520px)",
      searchClipPath: undefined,
      searchTransform: "translateY(-50%)",
      closedTransition:
        "opacity 120ms var(--atv-ease-out), visibility 0s linear 160ms",
      openSearchClipPath: undefined,
      openTransition: "opacity 150ms var(--atv-ease-out), visibility 0s",
      snapTransition: "none",
      fieldClipPath: "inset(0 0 0 72% round 999px)",
      openFieldClipPath: "inset(0 round 999px)",
      fieldTransition: "clip-path 160ms var(--atv-ease-out)",
      openFieldTransition: "clip-path 220ms var(--atv-ease-out)",
      snapFieldTransition: "none",
      inputClosedOpacity: "0",
      inputOpenOpacity: "1",
      inputOpenTransition: "opacity 110ms var(--atv-ease-out) 60ms",
      inputSnapTransition: "none",
    });
  });
});

describe("subject suggestion results", () => {
  it("keeps results outside the animated search-field mask", () => {
    const expandedSearch = declarationsFor(".atv-subject-switcher-expanded");
    const openExpandedSearch = declarationsFor(
      '.atv-subject-switcher[data-state="open"] .atv-subject-switcher-expanded'
    );
    const searchField = declarationsFor(".atv-subject-switcher-field");
    const openSearchField = declarationsFor(
      '.atv-subject-switcher[data-state="open"] .atv-subject-switcher-field'
    );
    const suggestionRail = declarationsFor(
      ".atv-subject-suggestion-rail",
      suggestionStylesheet
    );

    expect({
      expandedClipPath: expandedSearch["clip-path"],
      openExpandedClipPath: openExpandedSearch["clip-path"],
      fieldClipPath: searchField["clip-path"],
      openFieldClipPath: openSearchField["clip-path"],
      suggestionPosition: suggestionRail.position,
    }).toStrictEqual({
      expandedClipPath: undefined,
      openExpandedClipPath: undefined,
      fieldClipPath: "inset(0 0 0 72% round 999px)",
      openFieldClipPath: "inset(0 round 999px)",
      suggestionPosition: "absolute",
    });
  });
});
