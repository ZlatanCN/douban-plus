import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const presentationRoot = path.resolve(
  process.cwd(),
  "src/modules/movie-home/presentation"
);

describe("movie homepage presentation ownership", () => {
  it("keeps page composition separate from each page-owned content section", async () => {
    const pageSource = await readFile(
      path.join(presentationRoot, "page.tsx"),
      "utf-8"
    );
    const sectionSources = await Promise.all(
      ["hot-movies", "ranking", "lists", "recommendations", "reviews"].map(
        (name) => readFile(path.join(presentationRoot, `${name}.tsx`), "utf-8")
      )
    );

    expect(pageSource).not.toContain("<Section");
    expect(
      sectionSources.every((source) => source.includes("<Section"))
    ).toBeTruthy();
  });
});
