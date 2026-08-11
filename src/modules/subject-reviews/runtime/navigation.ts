import {
  fetchNativePage,
  useNativeNavigation,
} from "@/shared/runtime/native-navigation";
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

const fetchSubjectReviewsPage: SubjectReviewsPageLoader = (href, signal) =>
  fetchNativePage({
    extract: extractSubjectReviewsPage,
    href,
    incompleteMessage: "影评页面数据不完整",
    invalidResponseMessage: "影评页面响应无效",
    invalidTargetMessage: "影评导航目标无效",
    isValidUrl: isSubjectReviewsUrl,
    origin: MOVIE_ORIGIN,
    requestErrorMessage: (status) => `影评页面请求失败：${status}`,
    signal,
  });

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
