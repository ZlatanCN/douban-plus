import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const reviewContentCss = readFileSync(
  path.resolve(process.cwd(), "src/styles/review-content.css"),
  "utf-8"
);

describe("review content styles", () => {
  it("renders embedded Douban subject references as dedicated film cards", () => {
    expect(reviewContentCss).toContain(
      ".atv-review-modal-body .subject-container"
    );
    expect(reviewContentCss).toContain(".atv-review-modal-body .subject-cover");
    expect(reviewContentCss).toContain(
      ".atv-review-modal-body .subject-caption"
    );
    expect(reviewContentCss).toContain(
      ".atv-review-modal-body .rating-star2::before"
    );
  });

  it("keeps the subject reference link free of generic underline states", () => {
    expect(reviewContentCss).toContain(
      ".atv-review-modal-body .subject-wrapper > a:link,"
    );
    expect(reviewContentCss).toContain(
      ".atv-review-modal-body .subject-wrapper > a:visited"
    );
  });
});
