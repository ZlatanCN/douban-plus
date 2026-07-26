import { render } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SubjectAllPhotosPageData } from "@/modules/subject-all-photos/domain";
import { archivePhotoSource } from "@/modules/subject-all-photos/domain/photo-source";
import { extractSubjectAllPhotosPage } from "@/modules/subject-all-photos/extract/page";
import { SubjectAllPhotosPage } from "@/modules/subject-all-photos/presentation/page";
import {
  isSubjectAllPhotosPage,
  mountSubjectAllPhotos,
} from "@/modules/subject-all-photos/runtime/mount";
import {
  FALLBACK_ASPECT_RATIO,
  loadPhotoAspectRatio,
  PREVIEW_GEOMETRY_TIMEOUT_MS,
  resolvePreviewGeometry,
} from "@/modules/subject-all-photos/runtime/resolve-preview-geometry";

import { createTestDoc } from "../../helpers/doc";

const pageData: SubjectAllPhotosPageData = {
  groups: [
    {
      allHref: "https://movie.douban.com/subject/3016187/photos?type=S",
      count: 2610,
      label: "剧照",
      photos: [
        {
          href: "https://movie.douban.com/photos/photo/792876892/",
          src: "https://img3.doubanio.com/view/photo/sqxs/public/p792876892.webp",
        },
      ],
    },
  ],
  subjectHref: "https://movie.douban.com/subject/3016187/",
  title: "权力的游戏 第一季",
  uploadHref: "https://movie.douban.com/subject/3016187/photos/add",
};

const resolvedPageData = {
  ...pageData,
  groups: pageData.groups.map((group) => ({
    ...group,
    photos: group.photos.map((photo) => ({ ...photo, aspectRatio: 2 / 3 })),
  })),
};

const resolveThreeHalves = (): Promise<number> => Promise.resolve(3 / 2);
const resolveUnavailableGeometry = (): Promise<null> => Promise.resolve(null);
const pendingImages: {
  naturalHeight: number;
  naturalWidth: number;
  onerror: (() => void) | null;
  onload: (() => void) | null;
  src: string;
}[] = [];
const PendingImage = function PendingImage() {
  const image = {
    addEventListener: () => {},
    naturalHeight: 0,
    naturalWidth: 0,
    onerror: null,
    onload: null,
    removeEventListener: () => {},
    src: "",
  };
  pendingImages.push(image);
  return image;
};

describe(archivePhotoSource, () => {
  it("uses proportion-preserving responsive renditions for native square thumbnails", () => {
    expect(
      archivePhotoSource(
        "https://img3.doubanio.com/view/photo/sqxs/public/p792876892.webp"
      )
    ).toStrictEqual({
      sizes: "(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 14vw",
      src: "https://img3.doubanio.com/view/photo/s/public/p792876892.webp",
      srcSet:
        "https://img3.doubanio.com/view/photo/s/public/p792876892.webp 270w, https://img3.doubanio.com/view/photo/m/public/p792876892.webp 540w",
    });
  });

  it("keeps an unrecognised image source untouched", () => {
    expect(
      archivePhotoSource("https://img.example.com/photo.webp")
    ).toStrictEqual({ src: "https://img.example.com/photo.webp" });
  });
});

describe(resolvePreviewGeometry, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves aspect ratios only for the existing preview set", async () => {
    await expect(
      resolvePreviewGeometry(pageData, resolveThreeHalves)
    ).resolves.toStrictEqual({
      ...pageData,
      groups: [
        {
          ...pageData.groups[0],
          photos: [{ ...pageData.groups[0]?.photos[0], aspectRatio: 3 / 2 }],
        },
      ],
    });
  });

  it("reserves a stable square when a preview geometry is unavailable", async () => {
    const result = await resolvePreviewGeometry(
      pageData,
      resolveUnavailableGeometry
    );

    expect(result.groups[0]?.photos[0]?.aspectRatio).toBe(
      FALLBACK_ASPECT_RATIO
    );
  });

  it("cancels a preview image that does not settle before the deadline", async () => {
    vi.useFakeTimers();
    pendingImages.length = 0;
    const { cleanup, doc } = createTestDoc("<main></main>");
    Object.defineProperty(doc.defaultView ?? window, "Image", {
      configurable: true,
      value: PendingImage,
    });

    const resolveAspectRatio = loadPhotoAspectRatio(doc);
    const result = resolveAspectRatio(
      pageData.groups[0]?.photos[0] ?? {
        href: "",
        src: "",
      }
    );
    await vi.advanceTimersByTimeAsync(PREVIEW_GEOMETRY_TIMEOUT_MS);

    await expect(result).resolves.toBeNull();
    expect(pendingImages[0]?.src).toBe("");

    cleanup();
  });
});

describe(extractSubjectAllPhotosPage, () => {
  it("extracts native preview groups and every preserved exit", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div id="wrapper">
          <main id="content">
            <h1>权力的游戏 第一季的全部图片</h1>
            <div class="article">
              <div class="mod">
                <div class="hd"><h2>剧照 · · · · · · <span class="pl">( <a href="https://movie.douban.com/subject/3016187/photos?type=S">共2610张</a> )</span></h2></div>
                <div class="bd"><ul class="pic-col5">
                  <li><a href="https://movie.douban.com/photos/photo/792876892/"><img src="https://img3.doubanio.com/view/photo/sqxs/public/p792876892.webp"></a></li>
                  <li class="last more-pics"><a href="/subject/3016187/photos?type=S"><img src="morepic.png"></a></li>
                </ul></div>
              </div>
            </div>
            <aside class="aside">
              <a href="https://movie.douban.com/subject/3016187/photos/add">+ 上传剧照&海报&壁纸</a>
              <a href="https://movie.douban.com/subject/3016187/">去 权力的游戏 第一季 的页面</a>
            </aside>
          </main>
        </div>
      `,
      "/subject/3016187/all_photos"
    );

    expect(extractSubjectAllPhotosPage(doc)).toStrictEqual(pageData);

    cleanup();
  });

  it("refuses incomplete pages so the native gallery remains available", () => {
    const { cleanup, doc } = createTestDoc(
      '<div id="wrapper"><main id="content"><h1>作品甲的全部图片</h1></main></div>',
      "/subject/123/all_photos"
    );

    expect(extractSubjectAllPhotosPage(doc)).toBeNull();

    cleanup();
  });
});

describe(SubjectAllPhotosPage, () => {
  const root = document.createElement("div");

  afterEach(() => {
    render(null, root);
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

describe(mountSubjectAllPhotos, () => {
  it("matches only subject gallery overview paths", () => {
    expect(
      isSubjectAllPhotosPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/all_photos",
      })
    ).toBeTruthy();
    expect(
      isSubjectAllPhotosPage({
        hostname: "movie.douban.com",
        pathname: "/subject/3016187/photos",
      })
    ).toBeFalsy();
  });

  it("mounts only after valid extraction", async () => {
    const ready = createTestDoc(
      `
        <div id="wrapper"><main id="content">
          <h1>作品甲的全部图片</h1>
          <div class="article"><div class="mod"><h2>剧照 <a href="https://movie.douban.com/subject/123/photos?type=S">共1张</a></h2><ul class="pic-col5"><li><a href="https://movie.douban.com/photos/photo/1/"><img src="https://img.example.com/1.webp"></a></li></ul></div></div>
          <aside class="aside"><a href="https://movie.douban.com/subject/123/photos/add">上传剧照</a><a href="https://movie.douban.com/subject/123/">去作品页面</a></aside>
        </main></div>
      `,
      "/subject/123/all_photos"
    );
    const fallback = createTestDoc(
      '<div id="wrapper"><main id="content"><h1>作品乙的全部图片</h1></main></div>',
      "/subject/456/all_photos"
    );

    mountSubjectAllPhotos(ready.doc, (data) =>
      Promise.resolve({
        ...data,
        groups: data.groups.map((group) => ({
          ...group,
          photos: group.photos.map((photo) => ({
            ...photo,
            aspectRatio: 1,
          })),
        })),
      })
    );
    mountSubjectAllPhotos(fallback.doc);

    await Promise.resolve();

    expect(ready.doc.body.classList).toContain("atv-enhanced");
    expect(ready.doc.querySelector("#atv-douban-root h1")?.textContent).toBe(
      "作品甲"
    );
    expect(fallback.doc.body.classList).not.toContain("atv-enhanced");
    expect(fallback.doc.querySelector("#atv-douban-root")).toBeNull();

    ready.cleanup();
    fallback.cleanup();
  });
});
