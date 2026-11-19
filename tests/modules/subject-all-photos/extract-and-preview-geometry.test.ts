import { afterEach, describe, expect, it, vi } from "vitest";

import { archivePhotoSource } from "@/modules/subject-all-photos/domain/photo-source";
import { extractSubjectAllPhotosPage } from "@/modules/subject-all-photos/extract/page";
import {
  FALLBACK_ASPECT_RATIO,
  loadPhotoAspectRatio,
  PREVIEW_GEOMETRY_TIMEOUT_MS,
  resolvePreviewGeometry,
} from "@/modules/subject-all-photos/runtime/resolve-preview-geometry";

import { createTestDoc } from "../../helpers/doc";
import { pageData } from "./page-test-data";

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
