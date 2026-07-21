import { describe, expect, it, vi } from "vitest";

import type { ImageModalSource } from "@/components/modal";
import { PersonageGallerySection } from "@/modules/personage/gallery";
import type { PersonageGallery } from "@/modules/personage/types";

import { renderIntoRoot } from "../../helpers/render";

const populatedGallery: PersonageGallery = {
  allImagesHref: "https://www.douban.com/personage/27260187/photos",
  images: [
    {
      alt: "郭涛活动照",
      largeSrc: "https://img.example.com/view/photo/l/public/guo-1.webp",
      src: "https://img.example.com/view/photo/photo/public/guo-1.webp",
    },
    {
      alt: "",
      largeSrc: "https://img.example.com/view/photo/l/public/guo-2.webp",
      src: "https://img.example.com/view/photo/photo/public/guo-2.webp",
    },
  ],
};

describe(PersonageGallerySection, () => {
  it("does not render a section when the native picture source is absent", () => {
    const root = renderIntoRoot(
      <PersonageGallerySection gallery={null} name="郭涛" />
    );

    expect(root.firstElementChild).toBeNull();
  });

  it("renders an intentional empty state and preserves the native gallery exit", () => {
    const root = renderIntoRoot(
      <PersonageGallerySection
        gallery={{ ...populatedGallery, images: [] }}
        name="郭涛"
      />
    );
    const exit = root.querySelector<HTMLAnchorElement>(".atv-section-more");

    expect(root.querySelector("#atv-personage-gallery h2")?.textContent).toBe(
      "图集"
    );
    expect(
      root.querySelector(".atv-personage-gallery-empty")?.textContent
    ).toBe("暂无公开图片");
    expect([exit?.href, exit?.target, exit?.rel]).toStrictEqual([
      "https://www.douban.com/personage/27260187/photos",
      "_blank",
      "noopener",
    ]);
  });

  it("opens a selected image in the shared preview flow", () => {
    const onOpenImage = vi.fn<(image: ImageModalSource) => void>();
    const root = renderIntoRoot(
      <PersonageGallerySection
        gallery={populatedGallery}
        name="郭涛"
        onOpenImage={onOpenImage}
      />
    );
    const images = root.querySelectorAll<HTMLImageElement>(
      ".atv-personage-gallery-rail img"
    );
    const buttons = root.querySelectorAll<HTMLButtonElement>(
      ".atv-personage-gallery-rail button"
    );
    buttons[1]?.click();

    expect(images).toHaveLength(2);
    expect(buttons[0]?.classList).toContain("atv-image-preview-trigger");
    expect(images[1]?.alt).toBe("郭涛的图片 2");
    expect(onOpenImage).toHaveBeenCalledExactlyOnceWith({
      alt: "郭涛的图片 2",
      previewSrc: "https://img.example.com/view/photo/photo/public/guo-2.webp",
      src: "https://img.example.com/view/photo/l/public/guo-2.webp",
    });
    expect(root.querySelectorAll(".atv-personage-gallery-rail a")).toHaveLength(
      0
    );
  });

  it("uses each loaded image's natural ratio while keeping the rail height fixed", async () => {
    const root = renderIntoRoot(
      <PersonageGallerySection gallery={populatedGallery} name="郭涛" />
    );
    const image = root.querySelector<HTMLImageElement>(
      ".atv-personage-gallery-rail img"
    );

    Object.defineProperties(image ?? {}, {
      naturalHeight: { value: 450 },
      naturalWidth: { value: 600 },
    });
    image?.dispatchEvent(new Event("load"));
    await Promise.resolve();

    expect(
      image
        ?.closest("li")
        ?.style.getPropertyValue("--atv-personage-gallery-aspect-ratio")
    ).toBe(String(600 / 450));
  });

  it("renders the source-limited preview rail instead of an uneven grid", () => {
    const root = renderIntoRoot(
      <PersonageGallerySection gallery={populatedGallery} name="郭涛" />
    );

    expect(root.querySelector(".atv-personage-gallery-rail")).not.toBeNull();
    expect(root.querySelector(".atv-personage-gallery-grid")).toBeNull();
  });
});
