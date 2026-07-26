import { describe, expect, it } from "vitest";

import { SubjectStickyNav } from "@/modules/subject/navigation/sticky-nav";

import { renderIntoRoot } from "../../helpers/render";

describe(SubjectStickyNav, () => {
  it("keeps the subject switcher outside the shared navigation primitive", () => {
    const root = renderIntoRoot(
      <SubjectStickyNav
        onJump={() => {}}
        sections={[]}
        subjectSwitcher={<button type="button">作品切换器</button>}
        title={{
          full: "肖申克的救赎 / The Shawshank Redemption",
          primary: "肖申克的救赎",
          seasonLabel: "",
        }}
      />
    );

    expect(
      root.querySelector(".atv-stickynav-subject-switcher")?.textContent
    ).toBe("作品切换器");
  });
});
