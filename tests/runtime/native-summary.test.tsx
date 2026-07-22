import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as nativeSummary from "@/modules/subject/runtime/use-native-summary";

import { buildDoc } from "../helpers/doc";

const NativeSummaryProbe = ({
  fallback,
  doc,
}: {
  fallback: string | null;
  doc: Document;
}) => {
  const summary = nativeSummary.useNativeSummary(fallback, doc);
  return <output>{summary}</output>;
};

const roots: Element[] = [];

const renderProbe = (fallback: string | null, doc: Document): Element => {
  const root = document.createElement("div");
  roots.push(root);
  render(<NativeSummaryProbe doc={doc} fallback={fallback} />, root);
  return root;
};

describe("Native summary adoption", () => {
  afterEach(() => {
    for (const root of roots) {
      render(null, root);
    }
    roots.length = 0;
  });

  it("exposes only the native-summary interface", () => {
    expect(Object.keys(nativeSummary)).toStrictEqual(["useNativeSummary"]);
  });

  it("adopts the expanded visible summary from a Douban document", async () => {
    const doc = buildDoc(`<!DOCTYPE html><body>
      <div id="link-report-intra">
        <span class="short"><span property="v:summary">截断内容</span><a class="j a_show_full" href="javascript:void(0)">(展开全部)</a></span>
        <span class="all" style="display:none">完整的豆瓣剧情简介</span>
      </div>
    </body>`);
    const short = doc.querySelector<HTMLElement>(".short");
    const full = doc.querySelector<HTMLElement>(".all");
    doc.querySelector("a.a_show_full")?.addEventListener("click", () => {
      if (short && full) {
        short.style.display = "none";
        full.style.display = "inline";
      }
    });
    const root = renderProbe("提取时的简介", doc);

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.textContent).toBe(
        "完整的豆瓣剧情简介"
      )
    );
  });

  it("keeps the supplied summary when no native expansion is available", async () => {
    const root = renderProbe("提取时的简介", buildDoc("<body></body>"));

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.textContent).toBe("提取时的简介")
    );
  });

  it("keeps the visible native summary when it has no expansion trigger", async () => {
    const root = renderProbe(
      "提取时的简介",
      buildDoc(
        '<body><div id="link-report-intra"><span property="v:summary">原生可见简介</span></div></body>'
      )
    );

    await vi.waitFor(() =>
      expect(root.querySelector("output")?.textContent).toBe("原生可见简介")
    );
  });
});
