import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mountPersonage } from "@/modules/personage/runtime/mount";

import { createTestDoc } from "../../helpers/doc";

const personageFixture = readFileSync(
  path.resolve(process.cwd(), "tests/fixtures/personage-full.html"),
  "utf-8"
);

describe(mountPersonage, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("mounts a Hero and activates the enhanced document only after extraction succeeds", () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);

    expect(doc.body.classList).toContain("atv-enhanced");
    expect(
      doc.querySelector("#atv-douban-root .atv-personage-hero")
    ).not.toBeNull();
    expect([
      doc.querySelector(".atv-personage-hero h1")?.textContent,
      doc.querySelector(".atv-personage-original-name")?.textContent,
    ]).toStrictEqual(["彼特·丁拉基", "Peter Dinklage"]);
    expect(
      doc.querySelectorAll(
        '.atv-personage-biography > .atv-personage-biography-content:not([aria-hidden="true"]) p'
      )
    ).toHaveLength(2);
    expect(doc.title).toBe("彼特·丁拉基 Peter Dinklage");

    cleanup();
  });

  it("leaves a personage document unchanged when the Hero data cannot be extracted", () => {
    const { cleanup, doc } = createTestDoc(
      '<div id="wrapper"><div id="content"><h1>原生页面</h1></div></div>',
      "/personage/27224733/"
    );

    mountPersonage(doc);

    expect(doc.body.classList).not.toContain("atv-enhanced");
    expect(doc.querySelector("#atv-douban-root")).toBeNull();

    cleanup();
  });

  it("opens the portrait in the shared image modal", async () => {
    const { cleanup, doc } = createTestDoc(
      personageFixture,
      "/personage/27224733/"
    );

    mountPersonage(doc);
    doc
      .querySelector<HTMLButtonElement>(".atv-personage-portrait-trigger")
      ?.click();
    await Promise.resolve();

    expect(
      doc.querySelector("#atv-poster-modal .atv-modal-img")?.getAttribute("src")
    ).toBe("https://img.example.com/peter.jpg");
    expect(
      doc.querySelector(".atv-personage-portrait-trigger")?.classList
    ).toContain("atv-image-preview-trigger");

    cleanup();
  });

  it("renders a populated representative-work rail when the recent-work rail is empty", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品</h2><ul class="works"></ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/3/" title="活着">
                <img src="https://img.example.com/to-live.jpg" />
              </a>
            </li>
          </ul>
        </section>
      `,
      "/personage/27260187/"
    );

    mountPersonage(doc);

    expect(doc.querySelector("#atv-personage-recent-works")).toBeNull();
    expect(
      doc.querySelector("#atv-personage-representative-works h2")?.textContent
    ).toBe("作品选");

    cleanup();
  });

  it("adopts work rails that arrive after the personage page first mounts", async () => {
    const { cleanup, doc } = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );

    mountPersonage(doc);
    doc.body.insertAdjacentHTML(
      "beforeend",
      `
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/3/" title="活着">
                <img src="https://img.example.com/to-live.jpg" />
              </a>
            </li>
          </ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品</h2>
          <ul class="works">
            <li class="creation">
              <a class="movie img_wrap" href="https://movie.douban.com/subject/4/" title="霸王别姬">
                <img src="https://img.example.com/farewell.jpg" />
              </a>
            </li>
          </ul>
        </section>
      `
    );
    await vi.waitFor(() =>
      expect(doc.querySelector("#atv-personage-recent-works")).not.toBeNull()
    );
    expect(
      doc.querySelector("#atv-personage-representative-works")
    ).not.toBeNull();

    cleanup();
  });
});
