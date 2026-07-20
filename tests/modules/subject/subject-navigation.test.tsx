import { describe, expect, it } from "vitest";

import { SubjectStickyNav } from "@/modules/subject/subject-navigation";

import { renderIntoRoot } from "../../helpers/render";

describe(SubjectStickyNav, () => {
  it("keeps the subject switcher and previous-work title outside the shared navigation primitive", () => {
    const root = renderIntoRoot(
      <SubjectStickyNav
        onJump={() => {}}
        sections={[]}
        subjectSwitcher={<button type="button">作品切换器</button>}
        subjectSwitcherOpen
        title={{
          full: "肖申克的救赎 / The Shawshank Redemption",
          primary: "肖申克的救赎",
        }}
      />
    );

    expect(root.querySelector(".atv-stickynav")?.classList).toContain(
      "has-subject-switcher-open"
    );
    expect(root.querySelector(".atv-stickynav-title")?.textContent).toBe(
      "上一部"
    );
    expect(
      root.querySelector(".atv-stickynav-subject-switcher")?.textContent
    ).toBe("作品切换器");
  });
});
