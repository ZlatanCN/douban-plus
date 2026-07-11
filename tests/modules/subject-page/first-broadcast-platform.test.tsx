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
    const root = renderSingle(<FirstBroadcastPlatform platform="Cinemax" />);

    expect(root.dataset.provider).toBe("unknown");
    expect(root.querySelector("svg")).not.toBeNull();
    expect(root.textContent).toContain("Cinemax");
  });

  it("uses the supplied Netflix symbol", () => {
    const root = renderSingle(<FirstBroadcastPlatform platform="Netflix" />);

    expect(root.dataset.provider).toBe("netflix");
    expect(root.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 551.111 1000"
    );
  });

  it("uses the curated brand color for a colorable logo", () => {
    const root = renderSingle(<FirstBroadcastPlatform platform="Paramount+" />);

    expect(
      root.querySelector<HTMLElement>(".atv-first-broadcast-platform-mark")
        ?.style.color
    ).toBe("#0064FF");
  });

  it.each([
    ["Hulu", "hulu", "0 0 251 83"],
    ["Disney+", "disney-plus", "0 0 534 302"],
    ["Prime Video", "prime-video", "0 0 800.3 246.3"],
  ])("renders %s as a wide supplied wordmark", (platform, key, viewBox) => {
    const root = renderSingle(<FirstBroadcastPlatform platform={platform} />);

    expect(root.dataset.provider).toBe(key);
    expect(
      root.querySelector(".atv-first-broadcast-platform-mark")?.classList
    ).toContain("is-wordmark");
    expect(root.querySelector("svg")?.getAttribute("viewBox")).toBe(viewBox);
  });
});
