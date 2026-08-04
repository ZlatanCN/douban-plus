import { useNativeNavigation } from "@/shared/runtime/native-navigation";
import type {
  NativeNavigationResult,
  NativeNavigationState,
  NativePageLoader,
} from "@/shared/runtime/native-navigation";

import type { SubjectReviewsPageData } from "../domain";
import { extractSubjectReviewsPage } from "../extract/page";

type SubjectReviewsPageLoader = NativePageLoader<SubjectReviewsPageData>;
type SubjectReviewsNavigationResult =
  NativeNavigationResult<SubjectReviewsPageData>;
type SubjectReviewsNavigationState =
  NativeNavigationState<SubjectReviewsPageData>;

const MOVIE_ORIGIN = "https://movie.douban.com";

const isSubjectReviewsUrl = (url: URL): boolean =>
  url.origin === MOVIE_ORIGIN &&
  /^\/subject\/\d+\/reviews\/?$/u.test(url.pathname);

const fetchSubjectReviewsPage: SubjectReviewsPageLoader = async (
  href,
  signal
) => {
  const requestedUrl = new URL(href, MOVIE_ORIGIN);
  if (!isSubjectReviewsUrl(requestedUrl)) {
    throw new Error("影评导航目标无效");
  }

  const response = await fetch(requestedUrl.href, {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new Error(`影评页面请求失败：${response.status}`);
  }

  const responseHref = response.url || requestedUrl.href;
  const responseUrl = new URL(responseHref, MOVIE_ORIGIN);
  if (!isSubjectReviewsUrl(responseUrl)) {
    throw new Error("影评页面响应无效");
  }

  const sourceDoc = new DOMParser().parseFromString(
    await response.text(),
    "text/html"
  );
  const data = extractSubjectReviewsPage(sourceDoc, responseUrl.href);
  const nativeContent = sourceDoc.querySelector<HTMLElement>("#content");
  if (!data || !nativeContent) {
    throw new Error("影评页面数据不完整");
  }
  return { data, href: responseUrl.href, nativeContent };
};

const getSubjectReviewsTitle = ({
  data,
}: SubjectReviewsNavigationResult): string =>
  `${data.title} — 全部${data.reviewKind}`;

const useSubjectReviewsNavigation = (
  doc: Document,
  initialData: SubjectReviewsPageData
): SubjectReviewsNavigationState =>
  useNativeNavigation({
    doc,
    getTitle: getSubjectReviewsTitle,
    initialData,
    loadPage: fetchSubjectReviewsPage,
    refreshLabel: "同步影评",
  });

export {
  fetchSubjectReviewsPage,
  useSubjectReviewsNavigation,
  type SubjectReviewsNavigationState,
};
