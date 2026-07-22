import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SeriesItem } from "@/modules/subject/domain";
import * as seriesRuntime from "@/modules/subject/runtime/use-series-runtime";

import { buildDoc, createTestDoc } from "../helpers/doc";

const initialSeries: SeriesItem = {
  link: "https://movie.douban.com/subject/initial/",
  poster: "",
  rating: "8.0",
  title: "初始系列",
};

const emptySeries: SeriesItem[] = [];

const SeriesRuntimeProbe = ({
  doc,
  initial = emptySeries,
}: {
  doc: Document;
  initial?: SeriesItem[];
}) => {
  const result = seriesRuntime.useSeriesRuntime(initial, doc);
  return (
    <output
      data-items={result.items.map((item) => item.title).join("|")}
      data-current-items={result.items
        .filter((item) => item.isCurrent)
        .map((item) => item.title)
        .join("|")}
      data-more-link={result.moreLink?.href ?? ""}
      data-more-text={result.moreLink?.text ?? ""}
    />
  );
};

const roots: Element[] = [];

const renderProbe = (doc: Document, initial?: SeriesItem[]): HTMLElement => {
  const root = document.createElement("div");
  roots.push(root);
  render(<SeriesRuntimeProbe doc={doc} initial={initial} />, root);
  return root;
};

const lateSeriesMarkup = `
  <div class="items-swiper-title"><span class="pl"><a href="https://movie.douban.com/subject/series/">(查看全部)</a></span></div>
  <div class="items-swiper">
    <div class="items-swiper-item">
      <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/2/"><img src="https://img.example.com/2.jpg"></a></div>
      <div class="items-swiper-item-title"><a>第二季</a><span class="items-swiper-item-rating">9.3</span></div>
    </div>
    <div class="items-swiper-item">
      <div class="items-swiper-item-pic"><a href="https://movie.douban.com/subject/1/"><img src="https://img.example.com/1.jpg"></a></div>
      <div class="items-swiper-item-title"><a>第一季</a><span class="items-swiper-item-rating">9.5</span></div>
    </div>
  </div>
`;

describe("Series runtime", () => {
  afterEach(() => {
    for (const root of roots) {
      render(null, root);
    }
    roots.length = 0;
    vi.unstubAllGlobals();
  });

  it("exposes only the series runtime result interface", () => {
    expect(Object.keys(seriesRuntime)).toStrictEqual(["useSeriesRuntime"]);
  });

  it("keeps initial extracted series when the native series container is absent", async () => {
    const root = renderProbe(buildDoc("<body></body>"), [initialSeries]);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.items).toBe("初始系列")
    );
    expect(root.querySelector("output")?.dataset.moreLink).toBe("");
  });

  it("adopts existing native series and its more link", async () => {
    const root = renderProbe(
      buildDoc(`<body><div id="series-items">${lateSeriesMarkup}</div></body>`)
    );

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.items).toBe("第一季|第二季")
    );
    expect(root.querySelector("output")?.dataset.moreText).toBe("查看全部");
  });

  it("resolves the current series from the host document location", async () => {
    const { cleanup, doc } = createTestDoc(
      `<body><div id="series-items">${lateSeriesMarkup}</div></body>`,
      "/subject/1/"
    );
    const root = renderProbe(doc);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.currentItems).toBe("第一季")
    );
    cleanup();
  });

  it("adopts late native series and its more link", async () => {
    const doc = buildDoc('<body><div id="series-items"></div></body>');
    const root = renderProbe(doc);
    const container = doc.querySelector("#series-items");
    if (!container) {
      throw new Error("Expected series container in fixture");
    }
    container.innerHTML = lateSeriesMarkup;

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.dataset.items).toBe("第一季|第二季")
    );
    expect(root.querySelector("output")?.dataset.moreLink).toBe(
      "https://movie.douban.com/subject/series/"
    );
  });

  it("disconnects the native series observer when the result unmounts", async () => {
    const disconnect = vi.fn<() => void>();
    const observe = vi.fn<() => void>();
    vi.stubGlobal(
      "MutationObserver",
      class {
        disconnect = disconnect;
        observe = observe;
      }
    );
    const root = renderProbe(
      buildDoc('<body><div id="series-items"></div></body>')
    );

    await vi.waitFor(() =>
      expect(observe.mock.calls.length).toBeGreaterThan(0)
    );
    render(null, root);

    await vi.waitFor(() => expect(disconnect).toHaveBeenCalledOnce());
  });
});
