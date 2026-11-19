import type { SubjectAllPhotosPageData } from "@/modules/subject-all-photos/domain";

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

export { pageData, resolvedPageData };
