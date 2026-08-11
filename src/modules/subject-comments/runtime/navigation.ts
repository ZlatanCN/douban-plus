import {
  fetchNativePage,
  useNativeNavigation,
} from "@/shared/runtime/native-navigation";
import type {
  NativeNavigationResult,
  NativeNavigationState,
  NativePageLoader,
} from "@/shared/runtime/native-navigation";

import type { SubjectCommentsPageData } from "../domain";
import { extractSubjectCommentsPage, subjectIdFromPath } from "../extract/page";

type SubjectCommentsPageLoader = NativePageLoader<SubjectCommentsPageData>;
type SubjectCommentsNavigationResult =
  NativeNavigationResult<SubjectCommentsPageData>;
type SubjectCommentsNavigationState =
  NativeNavigationState<SubjectCommentsPageData>;

const MOVIE_ORIGIN = "https://movie.douban.com";

const isSubjectCommentsUrl = (url: URL): boolean =>
  url.origin === MOVIE_ORIGIN && subjectIdFromPath(url.pathname) !== null;

const fetchSubjectCommentsPage: SubjectCommentsPageLoader = (href, signal) =>
  fetchNativePage({
    extract: extractSubjectCommentsPage,
    href,
    incompleteMessage: "短评页面数据不完整",
    invalidResponseMessage: "短评页面响应无效",
    invalidTargetMessage: "短评导航目标无效",
    isValidUrl: isSubjectCommentsUrl,
    origin: MOVIE_ORIGIN,
    requestErrorMessage: (status) => `短评页面请求失败：${status}`,
    signal,
  });

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
