import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPersonage } from "@/modules/personage/runtime/mount";

import { createTestDoc } from "../../helpers/doc";

describe(mountPersonage, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("adopts a biography that the native source expands after mounting", async () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">张艺谋 Yimou Zhang</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27260166/"
    );
    const source = doc.querySelector<HTMLElement>(".subject-intro .content");
    const toggle = doc.querySelector<HTMLAnchorElement>(".fold-switch");

    toggle?.addEventListener("click", () => {
      source?.replaceChildren(
        Object.assign(doc.createElement("p"), {
          textContent: "原生展开后才提供的完整人物简介",
        })
      );
      if (toggle) {
        toggle.textContent = "(收起)";
      }
    });
    Object.defineProperty(doc, "readyState", {
      configurable: true,
      value: "complete",
    });

    mountPersonage(doc);

    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography-content")?.textContent
      ).toBe("原生展开后才提供的完整人物简介")
    );

    cleanup();
  });

  it("retries biography expansion until the native handler is ready", async () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">张艺谋 Yimou Zhang</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27260166/"
    );
    const source = doc.querySelector<HTMLElement>(".subject-intro .content");
    const toggle = doc.querySelector<HTMLAnchorElement>(".fold-switch");

    const firstClick = vi.fn<() => void>();
    toggle?.addEventListener("click", firstClick);
    mountPersonage(doc);

    // The first automatic click happens before Douban finishes registering
    // its delegated handler, matching the empty-Hero refresh race.
    await vi.waitFor(() => expect(firstClick).toHaveBeenCalledOnce());

    toggle?.addEventListener("click", () => {
      source?.replaceChildren(
        Object.assign(doc.createElement("p"), {
          textContent: "处理器就绪后提供的完整人物简介",
        })
      );
      if (toggle) {
        toggle.textContent = "(折叠)";
      }
    });

    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography-content")?.textContent
      ).toBe("处理器就绪后提供的完整人物简介")
    );

    cleanup();
  });

  it("expands a truncated biography synchronously upon mount", async () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">张艺谋 Yimou Zhang</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27260166/"
    );
    const source = doc.querySelector<HTMLElement>(".subject-intro .content");
    const toggle = doc.querySelector<HTMLAnchorElement>(".fold-switch");

    // Simulate real intro.js behavior: synchronous content swap on click
    toggle?.addEventListener("click", () => {
      source?.replaceChildren(
        Object.assign(doc.createElement("p"), {
          textContent: "同步展开后提供的完整人物简介",
        })
      );
      if (toggle) {
        toggle.textContent = "(收起)";
      }
    });

    mountPersonage(doc);

    // The layout effect clicks the fold-switch and re-extracts synchronously,
    // so the full bio is available immediately after mount
    await vi.waitFor(() =>
      expect(
        doc.querySelector(".atv-personage-biography-content")?.textContent
      ).toBe("同步展开后提供的完整人物简介")
    );

    cleanup();
  });

  it("mounts immediately when readyState is interactive, without waiting for the load event", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">冯小刚 Xiaogang Feng</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27481219/"
    );

    Object.defineProperty(doc, "readyState", {
      configurable: true,
      value: "interactive",
    });

    mountPersonage(doc);

    // Mounts immediately — no deferral for readyState
    expect(doc.querySelector("#atv-douban-root")).not.toBeNull();
    expect(doc.body.classList).toContain("atv-enhanced");
    // Bio remains truncated because the fold-switch has no click handler
    expect(
      doc.querySelector(".atv-personage-biography-content")?.textContent
    ).toBe("截断的原生简介");

    cleanup();
  });

  it("renders the enhanced page even when biography expansion cannot complete", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">冯小刚 Xiaogang Feng</div></div>
        <section class="subject-mod subject-intro">
          <div class="content"><p>截断的原生简介</p></div>
          <div class="fold-switch-block"><a class="fold-switch" href="javascript:;;">(展开)</a></div>
        </section>
      `,
      "/personage/27481219/"
    );

    mountPersonage(doc);

    // Enhanced root is rendered even though the fold-switch has no click handler
    expect(doc.querySelector("#atv-douban-root")).not.toBeNull();
    expect(doc.body.classList).toContain("atv-enhanced");
    expect(
      doc.querySelector(".atv-personage-biography-content")?.textContent
    ).toBe("截断的原生简介");

    cleanup();
  });
});
