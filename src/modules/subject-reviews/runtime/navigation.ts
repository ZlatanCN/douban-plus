import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import type { SubjectReviewsPageData } from "../domain";
import { extractSubjectReviewsPage } from "../extract/page";

type SubjectReviewsNavigationSource = "history" | "sync" | "user";

type SubjectReviewsNavigationTarget = {
  href: string;
  label: string;
  source: SubjectReviewsNavigationSource;
};

type SubjectReviewsNavigationResult = {
  data: SubjectReviewsPageData;
  href: string;
  nativeContent: HTMLElement;
};

type SubjectReviewsPageLoader = (
  href: string,
  signal: AbortSignal
) => Promise<SubjectReviewsNavigationResult>;

type SubjectReviewsNavigatorOptions = {
  doc: Document;
  loadPage: SubjectReviewsPageLoader;
  onFailure: (target: SubjectReviewsNavigationTarget) => void;
  onPending: (target: SubjectReviewsNavigationTarget) => void;
  onSuccess: (
    result: SubjectReviewsNavigationResult,
    target: SubjectReviewsNavigationTarget
  ) => void;
};

type SubjectReviewsNavigator = {
  dispose: () => void;
  navigate: (target: SubjectReviewsNavigationTarget) => Promise<boolean>;
};

type NavigationState = {
  data: SubjectReviewsPageData;
  dismissFailure: () => void;
  failure: SubjectReviewsNavigationTarget | null;
  navigate: (href: string, label: string) => void;
  pending: SubjectReviewsNavigationTarget | null;
  refresh: () => Promise<boolean>;
  retry: () => void;
  version: number;
};

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

const replaceNativeContent = (
  doc: Document,
  sourceContent: HTMLElement
): void => {
  const currentContent = doc.querySelector<HTMLElement>("#content");
  if (!currentContent) {
    throw new Error("当前影评页缺少原生内容容器");
  }
  currentContent.replaceWith(doc.importNode(sourceContent, true));
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const writeHistory = (
  doc: Document,
  method: "pushState" | "replaceState",
  href: string
): void => {
  try {
    doc.defaultView?.history[method](null, "", href);
  } catch {
    // Detached documents can have a different origin. Live navigation is
    // constrained to the validated, same-origin review directory.
  }
};

const createSubjectReviewsNavigator = ({
  doc,
  loadPage,
  onFailure,
  onPending,
  onSuccess,
}: SubjectReviewsNavigatorOptions): SubjectReviewsNavigator => {
  let activeController: AbortController | null = null;
  let lastSuccessfulHref = doc.location.href;
  let sequence = 0;

  const navigate = async (
    target: SubjectReviewsNavigationTarget
  ): Promise<boolean> => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    sequence += 1;
    const requestSequence = sequence;
    const previousHref = lastSuccessfulHref;
    onPending(target);

    try {
      const result = await loadPage(target.href, controller.signal);
      if (controller.signal.aborted || requestSequence !== sequence) {
        return false;
      }
      replaceNativeContent(doc, result.nativeContent);
      lastSuccessfulHref = result.href;
      doc.title = `${result.data.title} — 全部${result.data.reviewKind}`;
      if (target.source === "user") {
        writeHistory(doc, "pushState", result.href);
      }
      onSuccess(result, target);
      return true;
    } catch (error: unknown) {
      if (controller.signal.aborted || requestSequence !== sequence) {
        return false;
      }
      if (target.source === "history" && !isAbortError(error)) {
        writeHistory(doc, "replaceState", previousHref);
      }
      if (!isAbortError(error)) {
        onFailure(target);
      }
      return false;
    }
  };

  return {
    dispose: () => {
      activeController?.abort();
      activeController = null;
      sequence += 1;
    },
    navigate,
  };
};

const useSubjectReviewsNavigation = (
  doc: Document,
  initialData: SubjectReviewsPageData
): NavigationState => {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState<SubjectReviewsNavigationTarget | null>(
    null
  );
  const [failure, setFailure] = useState<SubjectReviewsNavigationTarget | null>(
    null
  );
  const [version, setVersion] = useState(0);
  const retryTargetRef = useRef<SubjectReviewsNavigationTarget | null>(null);
  const navigator = useMemo(
    () =>
      createSubjectReviewsNavigator({
        doc,
        loadPage: fetchSubjectReviewsPage,
        onFailure: (target) => {
          retryTargetRef.current = target;
          setPending(null);
          setFailure(target);
        },
        onPending: (target) => {
          setFailure(null);
          setPending(target);
        },
        onSuccess: (result, target) => {
          retryTargetRef.current = null;
          setData(result.data);
          setPending(null);
          setFailure(null);
          if (target.source !== "sync") {
            setVersion((current) => current + 1);
          }
        },
      }),
    [doc]
  );

  useEffect(() => {
    const view = doc.defaultView;
    if (!view) {
      return;
    }
    const onPopState = (): void => {
      void navigator.navigate({
        href: view.location.href,
        label: "历史记录",
        source: "history",
      });
    };
    view.addEventListener("popstate", onPopState);
    return () => {
      view.removeEventListener("popstate", onPopState);
      navigator.dispose();
    };
  }, [doc, navigator]);

  const navigate = useCallback(
    (href: string, label: string): void => {
      void navigator.navigate({ href, label, source: "user" });
    },
    [navigator]
  );
  const retry = useCallback((): void => {
    const target = retryTargetRef.current;
    if (target) {
      void navigator.navigate({ ...target, source: "user" });
    }
  }, [navigator]);
  const dismissFailure = useCallback((): void => setFailure(null), []);
  const refresh = useCallback(
    (): Promise<boolean> =>
      navigator.navigate({
        href: doc.location.href,
        label: "同步影评",
        source: "sync",
      }),
    [doc, navigator]
  );

  return {
    data,
    dismissFailure,
    failure,
    navigate,
    pending,
    refresh,
    retry,
    version,
  };
};

export {
  createSubjectReviewsNavigator,
  fetchSubjectReviewsPage,
  useSubjectReviewsNavigation,
};
export type {
  NavigationState,
  SubjectReviewsNavigationResult,
  SubjectReviewsNavigationTarget,
  SubjectReviewsPageLoader,
};
