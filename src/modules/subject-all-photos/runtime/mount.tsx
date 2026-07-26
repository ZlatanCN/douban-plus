import { render } from "preact";

import { extractSubjectAllPhotosPage } from "@/modules/subject-all-photos/extract/page";
import { SubjectAllPhotosPage } from "@/modules/subject-all-photos/presentation/page";
import { installEnhancedRoot } from "@/shared/runtime/enhanced-document";
import type { PageLocation, PageMount } from "@/shared/runtime/page-mount";

import {
  loadPhotoAspectRatio,
  resolvePreviewGeometry,
} from "./resolve-preview-geometry";

type PrepareSubjectAllPhotosPage = (
  data: Parameters<typeof resolvePreviewGeometry>[0],
  doc: Document
) => ReturnType<typeof resolvePreviewGeometry>;

const prepareSubjectAllPhotosPage: PrepareSubjectAllPhotosPage = (data, doc) =>
  resolvePreviewGeometry(data, loadPhotoAspectRatio(doc));

const mountPreparedSubjectAllPhotos = async (
  doc: Document,
  data: Parameters<PrepareSubjectAllPhotosPage>[0],
  preparePage: PrepareSubjectAllPhotosPage
): Promise<void> => {
  const resolvedData = await preparePage(data, doc);
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  if (
    installEnhancedRoot(doc, (root) =>
      render(<SubjectAllPhotosPage data={resolvedData} doc={doc} />, root)
    )
  ) {
    doc.title = `${resolvedData.title} — 全部图片`;
  }
};

const isSubjectAllPhotosPage = (location: PageLocation): boolean =>
  location.hostname === "movie.douban.com" &&
  /^\/subject\/\d+\/all_photos\/?$/u.test(location.pathname);

const mountSubjectAllPhotos = (
  doc: Document = document,
  preparePage: PrepareSubjectAllPhotosPage = prepareSubjectAllPhotosPage
): void => {
  if (doc.querySelector("#atv-douban-root")) {
    return;
  }

  const data = extractSubjectAllPhotosPage(doc);
  if (!data) {
    console.warn("[ATV-Douban] 图集页面数据提取失败，保留原生页面");
    return;
  }

  void mountPreparedSubjectAllPhotos(doc, data, preparePage);
};

const subjectAllPhotosPage: PageMount = {
  matches: isSubjectAllPhotosPage,
  mount: mountSubjectAllPhotos,
};

export { isSubjectAllPhotosPage, mountSubjectAllPhotos, subjectAllPhotosPage };
export type { PrepareSubjectAllPhotosPage };
