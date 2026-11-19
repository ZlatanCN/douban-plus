import { describe, expect, it } from "vitest";

import { extractPersonageProfile } from "@/modules/personage/extract/profile";

import { createTestDoc } from "../../helpers/doc";

describe(extractPersonageProfile, () => {
  it("keeps missing and explicitly empty native picture sections distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-picture"><a href="/personage/27260187/photos">全部 0 张</a></section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.gallery).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.gallery).toStrictEqual({
      allImagesHref: "http://localhost:3000/personage/27260187/photos",
      images: [],
    });

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps missing and explicitly empty native collaborator sources distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="partners-mod-mod subject-mod"><ul class="partners-mod-list"></ul></section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.collaborators).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.collaborators).toStrictEqual({
      allCollaboratorsHref: null,
      collaborators: [],
    });

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps missing and explicitly empty native award sections distinct", () => {
    const missing = createTestDoc(
      '<div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>',
      "/personage/27260187/"
    );
    const empty = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-awards">
          <h2>获奖情况 <a href="awards">全部 0</a></h2>
          <ul></ul>
        </section>
      `,
      "/personage/27260187/"
    );

    expect(extractPersonageProfile(missing.doc)?.awards).toBeNull();
    expect(extractPersonageProfile(empty.doc)?.awards).toStrictEqual({
      allAwardsHref: "http://localhost:3000/awards",
      awards: [],
      totalCount: 0,
    });

    missing.cleanup();
    empty.cleanup();
  });

  it("keeps an empty recent-work source distinct from a populated representative-work source", () => {
    const { cleanup, doc } = createTestDoc(
      `
        <div class="subject-target"><div class="subject-name">郭涛 Tao Guo</div></div>
        <section class="subject-mod subject-creations">
          <h2>最近的 5 部作品 <a href="creations?sortby=time">更多影视作品</a></h2>
          <ul class="works"></ul>
        </section>
        <section class="subject-mod subject-creations">
          <h2>收藏人数最多的 5 部作品 <a href="creations?sortby=collection">更多影视作品</a></h2>
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

    expect(extractPersonageProfile(doc)?.recentWorks).toStrictEqual({
      allWorksHref: "http://localhost:3000/creations?sortby=time",
      works: [],
    });
    expect(extractPersonageProfile(doc)?.representativeWorks).toStrictEqual({
      allWorksHref: "http://localhost:3000/creations?sortby=collection",
      works: [
        {
          href: "https://movie.douban.com/subject/3/",
          poster: "https://img.example.com/to-live.jpg",
          rating: null,
          title: "活着",
          year: null,
        },
      ],
    });

    cleanup();
  });
});
