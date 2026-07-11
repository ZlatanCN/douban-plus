import { describe, expect, it } from "vitest";

import { FirstBroadcastPlatform } from "@/modules/subject-page/hero/first-broadcast-platform";

import { renderSingle } from "../../helpers/render";

describe(FirstBroadcastPlatform, () => {
  it("renders a local brand logo with the platform name", () => {
    const root = renderSingle(<FirstBroadcastPlatform platform="Apple TV+" />);

    expect({
      ariaLabel: root.getAttribute("aria-label"),
      hasLink: Boolean(root.querySelector("a")),
      hasLogo: Boolean(root.querySelector("svg")),
      provider: root.dataset.provider,
      text: root.textContent,
    }).toStrictEqual({
      ariaLabel: "首播平台：Apple TV+",
      hasLink: false,
      hasLogo: true,
      provider: "apple-tv",
      text: "首播平台Apple TV+",
    });
  });

  it("keeps an unknown platform readable with a generic icon", () => {
    const root = renderSingle(<FirstBroadcastPlatform platform="小众电视网" />);

    expect(root.dataset.provider).toBe("unknown");
    expect(root.querySelector("svg")).not.toBeNull();
    expect(root.textContent).toContain("小众电视网");
  });
});
