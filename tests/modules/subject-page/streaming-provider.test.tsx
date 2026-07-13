import { describe, expect, it } from "vitest";

import { StreamingSection } from "@/modules/subject-page/media";
import {
  decodeStreamingHref,
  resolveStreamingProvider,
} from "@/modules/subject-page/media/streaming-provider";
import type { Streaming } from "@/types";

import { renderSingle } from "../../helpers/render";

const stream = (overrides: Partial<Streaming>): Streaming => ({
  href: "https://example.com/watch",
  name: "Example",
  ...overrides,
});

describe(resolveStreamingProvider, () => {
  it("resolves AMC from its direct host", () => {
    expect(
      resolveStreamingProvider(
        stream({ href: "https://www.amc.com/shows/example", name: "播放" })
      ).key
    ).toBe("amc");
  });

  it("uses curated Simple Icons assets when a provider has one", () => {
    const provider = resolveStreamingProvider(
      stream({
        href: "https://www.douban.com/link2/?url=https%3A%2F%2Fm.bilibili.com%2Fbangumi%2Fplay%2Fss47802",
        name: "哔哩哔哩",
      })
    );

    expect(provider.key).toBe("bilibili");
    expect(provider.Icon).toBeTypeOf("function");
    expect(provider.color).toBe("#00A1D6");
  });

  it("resolves wrapped Douban link2 URLs by target host", () => {
    const provider = resolveStreamingProvider(
      stream({
        href: "https://www.douban.com/link2/?url=https%3A%2F%2Fwww.netflix.com%2Ftitle%2F1",
        name: "播放",
      })
    );

    expect(provider.key).toBe("netflix");
  });

  it("falls back to source name when the provider is unknown", () => {
    const provider = resolveStreamingProvider(
      stream({
        href: "https://www.mgtv.com/billboard/example.html",
        name: "芒果TV",
      })
    );

    expect(provider.key).toBe("unknown");
    expect(provider.Icon).toBeUndefined();
    expect(provider.label).toBe("芒果TV");
  });

  it("falls back to the source name for unknown providers", () => {
    const provider = resolveStreamingProvider(
      stream({ href: "https://watch.example.test/", name: "小众影库" })
    );

    expect(provider).toMatchObject({
      color: "#41be5d",
      key: "unknown",
      label: "小众影库",
    });
  });
});

describe(decodeStreamingHref, () => {
  it("returns the wrapped target URL when Douban proxies the link", () => {
    expect(
      decodeStreamingHref(
        "https://www.douban.com/link2/?url=https%3A%2F%2Fwww.iqiyi.com%2Fv_1.html&type=online-video"
      )
    ).toBe("https://www.iqiyi.com/v_1.html");
  });
});

describe(StreamingSection, () => {
  it("renders streaming cards as logo plus text", () => {
    const root = renderSingle(
      <StreamingSection
        streaming={[
          stream({
            href: "https://m.bilibili.com/bangumi/play/ss47802",
            name: "哔哩哔哩",
          }),
          stream({ href: "https://v.qq.com/x/cover/1.html", name: "腾讯视频" }),
        ]}
      />
    );

    const cards = root.querySelectorAll<HTMLAnchorElement>(".atv-stream-card");
    expect(root.querySelector("h2")?.textContent).toBe("观看平台");
    expect(cards).toHaveLength(2);
    expect(root.querySelectorAll(".atv-stream-logo")).toHaveLength(0);
    expect(root.querySelector(".atv-stream-arrow")).toBeNull();
    for (const card of cards) {
      expect(card.classList.contains("atv-stream-card-combined")).toBeTruthy();
      expect(card.querySelector("svg")).not.toBeNull();
    }
    expect({
      provider: cards[0]?.dataset.provider,
      surface: cards[0]?.classList.contains("is-surface-dark"),
    }).toStrictEqual({ provider: "bilibili", surface: true });
  });

  it("renders unknown provider icons with the fallback mark", () => {
    const root = renderSingle(
      <StreamingSection
        streaming={[
          stream({
            href: "https://www.mgtv.com/billboard/example.html",
            name: "芒果TV",
          }),
        ]}
      />
    );

    const card = root.querySelector<HTMLAnchorElement>(".atv-stream-card");
    expect(card?.dataset.provider).toBe("unknown");
    expect(card?.querySelector("svg")).toBeNull();
    expect(card?.querySelector(".atv-stream-logo-fallback")?.textContent).toBe(
      "芒"
    );
  });

  it("uses the curated icon for a recognized provider over its source image", () => {
    const root = renderSingle(
      <StreamingSection
        streaming={[
          stream({
            href: "https://www.primevideo.com/detail/example",
            iconUrl: "https://example.com/prime.png",
            name: "Prime Video",
          }),
        ]}
      />
    );

    expect(root.querySelector(".atv-stream-vendor-icon")).toBeNull();
    expect(root.querySelector(".atv-stream-logo")?.classList).toContain(
      "is-catalog"
    );
    expect(root.querySelector(".atv-stream-logo")?.classList).toContain(
      "is-surface-dark"
    );
  });

  it("uses the extracted Douban iconUrl for a recognized provider without an SVG", () => {
    const root = renderSingle(
      <StreamingSection
        streaming={[
          stream({
            href: "https://www.miguvideo.com/example",
            iconUrl: "https://example.com/migu.png",
            name: "咪咕视频",
          }),
        ]}
      />
    );

    const icon = root.querySelector<HTMLImageElement>(
      ".atv-stream-vendor-icon"
    );
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("src")).toBe("https://example.com/migu.png");
  });
});
