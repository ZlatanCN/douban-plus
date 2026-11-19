import { readFileSync } from "node:fs";
import path from "node:path";

import { render } from "preact";
import { describe, expect, it, vi } from "vitest";

import { SubjectPageRuntime } from "@/modules/subject/runtime/page-runtime";

import { renderIntoRoot } from "../helpers/render";
import { makeData, setupSubjectRuntimeHooks } from "./subject-runtime-test-utils";

vi.hoisted(() => {
  globalThis.GM_xmlhttpRequest = vi.fn<
    NonNullable<typeof globalThis.GM_xmlhttpRequest>
  >() as never;
});

const ratingStyles = [
  "src/shared/styles/tokens.css",
  "src/modules/subject/styles/ratings.css",
]
  .map((source) =>
    readFileSync(path.resolve(process.cwd(), source), "utf-8")
  )
  .join("\n");

describe("SubjectPageRuntime rating surface", () => {
  setupSubjectRuntimeHooks();

  it("renders ratings on a local opaque surface over the full Hero", () => {
    const styles = document.createElement("style");
    styles.textContent = ratingStyles;
    document.head.append(styles);

    const root = renderIntoRoot(
      <SubjectPageRuntime data={makeData()} doc={document} />
    );
    document.body.append(root);

    try {
      const panel = root.querySelector<HTMLElement>(".atv-rating-panel");
      expect(root.querySelector(".atv-hero")).not.toBeNull();
      expect(panel).not.toBeNull();
      expect(getComputedStyle(panel as HTMLElement).backgroundColor).toBe(
        "#0c0a09"
      );
    } finally {
      render(null, root);
      root.remove();
      styles.remove();
    }
  });
});
