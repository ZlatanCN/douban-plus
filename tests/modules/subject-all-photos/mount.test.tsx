import { describe, expect, it } from "vitest";

import {
  isSubjectAllPhotosPage,
  mountSubjectAllPhotos,
} from "@/modules/subject-all-photos/runtime/mount";

import { createTestDoc } from "../../helpers/doc";

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
