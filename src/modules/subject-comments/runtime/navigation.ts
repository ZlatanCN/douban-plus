import { useNativeNavigation } from "@/shared/runtime/native-navigation";
import type {
  NativeNavigationResult,
  NativeNavigationState,
  NativePageLoader,
} from "@/shared/runtime/native-navigation";

import type { SubjectCommentsPageData } from "../domain";
import { extractSubjectCommentsPage } from "../extract/page";

type SubjectCommentsPageLoader = NativePageLoader<SubjectCommentsPageData>;
type SubjectCommentsNavigationResult =
  NativeNavigationResult<SubjectCommentsPageData>;
type SubjectCommentsNavigationState =
  NativeNavigationState<SubjectCommentsPageData>;

const MOVIE_ORIGIN = "https://movie.douban.com";

const isSubjectCommentsUrl = (url: URL): boolean =>
  url.origin === MOVIE_ORIGIN &&
  /^\/subject\/\d+\/comments\/?$/u.test(url.pathname);

const fetchSubjectCommentsPage: SubjectCommentsPageLoader = async (
  href,
  signal
) => {
  const requestedUrl = new URL(href, MOVIE_ORIGIN);
  if (!isSubjectCommentsUrl(requestedUrl)) {
    throw new Error("短评导航目标无效");
  }

  const response = await fetch(requestedUrl.href, {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new Error(`短评页面请求失败：${response.status}`);
  }

  const responseHref = response.url || requestedUrl.href;
  const responseUrl = new URL(responseHref, MOVIE_ORIGIN);
  if (!isSubjectCommentsUrl(responseUrl)) {
    throw new Error("短评页面响应无效");
  }

  const sourceDoc = new DOMParser().parseFromString(
    await response.text(),
    "text/html"
  );
  const data = extractSubjectCommentsPage(sourceDoc, responseUrl.href);
  const nativeContent = sourceDoc.querySelector<HTMLElement>("#content");
  if (!data || !nativeContent) {
    throw new Error("短评页面数据不完整");
  }
  return { data, href: responseUrl.href, nativeContent };
};

const getSubjectCommentsTitle = ({
  data,
}: SubjectCommentsNavigationResult): string => `${data.title} — 全部短评`;

const useSubjectCommentsNavigation = (
  doc: Document,
  initialData: SubjectCommentsPageData
): SubjectCommentsNavigationState =>
  useNativeNavigation({
    doc,
    getTitle: getSubjectCommentsTitle,
    initialData,
    loadPage: fetchSubjectCommentsPage,
    refreshLabel: "同步短评",
  });

export {
  fetchSubjectCommentsPage,
  useSubjectCommentsNavigation,
  type SubjectCommentsNavigationState,
};
