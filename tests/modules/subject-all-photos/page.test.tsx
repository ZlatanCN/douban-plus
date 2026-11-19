import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SubjectAllPhotosPage } from "@/modules/subject-all-photos/presentation/page";

import { pageData, resolvedPageData } from "./page-test-data";

describe(SubjectAllPhotosPage, () => {
  const root = document.createElement("div");

  afterEach(() => {
    render(null, root);
    root.remove();
  });

  it("renders the archive, native exits, and functional image labels", () => {
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    expect(root.querySelector("h1")?.textContent).toBe("权力的游戏 第一季");
    expect(root.textContent).toContain("2,610 张");
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-photo-archive-upload")?.href
    ).toBe(pageData.uploadHref);
    expect(
      root.querySelector<HTMLAnchorElement>(".atv-photo-archive-all")?.href
    ).toBe(pageData.groups[0]?.allHref);
    expect(
      root
        .querySelector<HTMLAnchorElement>(".atv-photo-archive-tile")
        ?.getAttribute("aria-label")
    ).toBe("查看《权力的游戏 第一季》剧照第 1 张");
  });

  it("links the single counted category to its preview group", () => {
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    const category = root.querySelector<HTMLAnchorElement>(
      ".atv-photo-archive-index a"
    );

    expect(category?.getAttribute("href")).toBe("#atv-photo-archive-section-1");
    expect(category?.textContent).toContain("剧照");
    expect(category?.textContent).toContain("2,610");
    expect(
      root.querySelector(category?.getAttribute("href") ?? "")
    ).not.toBeNull();
  });

  it("links every native category to its existing preview group", () => {
    const multiCategoryData = {
      ...resolvedPageData,
      groups: [
        ...resolvedPageData.groups,
        {
          allHref: "https://movie.douban.com/subject/3016187/photos?type=P",
          count: 98,
          label: "海报",
          photos: [],
        },
      ],
    };

    render(
      <SubjectAllPhotosPage data={multiCategoryData} doc={document} />,
      root
    );

    const categories = [
      ...root.querySelectorAll<HTMLAnchorElement>(".atv-photo-archive-index a"),
    ];

    expect(
      categories.map((category) => {
        const href = category.getAttribute("href");
        return {
          count: category.querySelector(".atv-photo-archive-index-count")
            ?.textContent,
          href,
          label: category.querySelector(".atv-photo-archive-index-label")
            ?.textContent,
          targetExists: Boolean(root.querySelector(href ?? "")),
        };
      })
    ).toStrictEqual([
      {
        count: "2,610 张",
        href: "#atv-photo-archive-section-1",
        label: "剧照",
        targetExists: true,
      },
      {
        count: "98 张",
        href: "#atv-photo-archive-section-2",
        label: "海报",
        targetExists: true,
      },
    ]);
  });

  it("uses sticky navigation behavior when a category link is activated", () => {
    document.body.append(root);
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    const category = root.querySelector<HTMLAnchorElement>(
      ".atv-photo-archive-index a"
    );
    const group = root.querySelector<HTMLElement>(
      "#atv-photo-archive-section-1"
    );
    const scrollIntoView = vi.fn<HTMLElement["scrollIntoView"]>();

    if (!category || !group) {
      throw new Error("Expected the category link and its preview group");
    }
    group.scrollIntoView = scrollIntoView;

    const defaultWasNotPrevented = category.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 })
    );

    expect(defaultWasNotPrevented).toBeFalsy();
    expect(window.location.hash).toBe("#atv-photo-archive-section-1");
    expect(group.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(group);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it.each([
    { name: "middle-button", button: 1 },
    { name: "Alt-modified", altKey: true },
    { name: "Control-modified", ctrlKey: true },
    { name: "Command-modified", metaKey: true },
    { name: "Shift-modified", shiftKey: true },
  ])("keeps $name category clicks native", ({ name, ...options }) => {
    document.body.append(root);
    window.history.replaceState(null, "", window.location.pathname);
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    const category = root.querySelector<HTMLAnchorElement>(
      ".atv-photo-archive-index a"
    );
    const group = root.querySelector<HTMLElement>(
      "#atv-photo-archive-section-1"
    );
    const scrollIntoView = vi.fn<HTMLElement["scrollIntoView"]>();
    const focus = vi.fn<HTMLElement["focus"]>();

    if (!category || !group) {
      throw new Error("Expected the category link and its preview group");
    }
    group.scrollIntoView = scrollIntoView;
    group.focus = focus;

    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    const defaultWasNotPrevented = category.dispatchEvent(event);

    expect(defaultWasNotPrevented).toBeTruthy();
    expect(category.getAttribute("href")).toBe("#atv-photo-archive-section-1");
    expect(group.getAttribute("tabindex")).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  });

  it("renders archive images as responsive proportion-preserving sources", () => {
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    const item = root.querySelector<HTMLElement>(".atv-photo-archive-item");

    expect(item).not.toBeNull();
    expect(
      item?.style.getPropertyValue("--atv-photo-archive-aspect-ratio")
    ).toBe(String(2 / 3));
    expect(
      root.querySelector<HTMLImageElement>(".atv-photo-archive-tile img")?.src
    ).toBe("https://img3.doubanio.com/view/photo/s/public/p792876892.webp");
    expect(
      root.querySelector<HTMLImageElement>(".atv-photo-archive-tile img")
        ?.srcset
    ).toBe(
      "https://img3.doubanio.com/view/photo/s/public/p792876892.webp 270w, https://img3.doubanio.com/view/photo/m/public/p792876892.webp 540w"
    );
  });

  it("labels each photo group with its visible heading", () => {
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    const group = root.querySelector(".atv-photo-archive-group");
    const headingId = group?.getAttribute("aria-labelledby");

    expect(headingId).toBeTruthy();
    expect(root.querySelector(".atv-photo-archive-group h2")?.id).toBe(
      headingId
    );
  });

  it("uses group labels in sticky navigation without a repeated category kicker", () => {
    render(
      <SubjectAllPhotosPage data={resolvedPageData} doc={document} />,
      root
    );

    expect(root.querySelector(".atv-stickynav")).not.toBeNull();
    expect(root.querySelector(".atv-stickynav-jumps")?.textContent).toContain(
      "剧照"
    );
    expect(root.textContent).not.toContain("影像分类");
  });
});
