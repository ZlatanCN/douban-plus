import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

import type { SubjectCommentsPageData } from "../domain";
import { extractSubjectCommentsPage } from "../extract/page";

type SubjectCommentsNavigationSource = "history" | "user";

type SubjectCommentsNavigationTarget = {
  href: string;
  label: string;
  source: SubjectCommentsNavigationSource;
};

type SubjectCommentsNavigationResult = {
  data: SubjectCommentsPageData;
  href: string;
  nativeContent: HTMLElement;
};

type SubjectCommentsPageLoader = (
  href: string,
  signal: AbortSignal
) => Promise<SubjectCommentsNavigationResult>;

type SubjectCommentsNavigatorOptions = {
  doc: Document;
  loadPage: SubjectCommentsPageLoader;
  onFailure: (target: SubjectCommentsNavigationTarget) => void;
  onPending: (target: SubjectCommentsNavigationTarget) => void;
  onSuccess: (result: SubjectCommentsNavigationResult) => void;
};

type SubjectCommentsNavigator = {
  dispose: () => void;
  navigate: (target: SubjectCommentsNavigationTarget) => void;
};

type SubjectCommentsNavigationFailure = {
  target: SubjectCommentsNavigationTarget;
};

type SubjectCommentsNavigationState = {
  data: SubjectCommentsPageData;
  dismissFailure: () => void;
  failure: SubjectCommentsNavigationFailure | null;
  navigate: (href: string, label: string) => void;
  pending: SubjectCommentsNavigationTarget | null;
  retry: () => void;
  version: number;
};

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

const replaceNativeContent = (
  doc: Document,
  sourceContent: HTMLElement
): void => {
  const currentContent = doc.querySelector<HTMLElement>("#content");
  if (!currentContent) {
    throw new Error("当前短评页缺少原生内容容器");
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
    // Detached documents used by integrations can have a different origin.
    // The live page only supplies same-origin, validated URLs.
  }
};

const createSubjectCommentsNavigator = ({
  doc,
  loadPage,
  onFailure,
  onPending,
  onSuccess,
}: SubjectCommentsNavigatorOptions): SubjectCommentsNavigator => {
  let activeController: AbortController | null = null;
  let sequence = 0;
  let lastSuccessfulHref = doc.location.href;

  const navigate = (target: SubjectCommentsNavigationTarget): void => {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    sequence += 1;
    const requestSequence = sequence;
    const previousHref = lastSuccessfulHref;
    onPending(target);

    const load = async (): Promise<void> => {
      try {
        const result = await loadPage(target.href, controller.signal);
        if (controller.signal.aborted || requestSequence !== sequence) {
          return;
        }

        replaceNativeContent(doc, result.nativeContent);
        lastSuccessfulHref = result.href;
        doc.title = `${result.data.title} — 全部短评`;
        if (target.source === "user") {
          writeHistory(doc, "pushState", result.href);
        }
        onSuccess(result);
      } catch (error: unknown) {
        if (controller.signal.aborted || requestSequence !== sequence) {
          return;
        }
        if (target.source === "history" && !isAbortError(error)) {
          writeHistory(doc, "replaceState", previousHref);
        }
        if (!isAbortError(error)) {
          onFailure(target);
        }
      }
    };
    void load();
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

const useSubjectCommentsNavigation = (
  doc: Document,
  initialData: SubjectCommentsPageData
): SubjectCommentsNavigationState => {
  const [data, setData] = useState(initialData);
  const [pending, setPending] =
    useState<SubjectCommentsNavigationTarget | null>(null);
  const [failure, setFailure] =
    useState<SubjectCommentsNavigationFailure | null>(null);
  const [version, setVersion] = useState(0);
  const retryTargetRef = useRef<SubjectCommentsNavigationTarget | null>(null);
  const navigator = useMemo(
    () =>
      createSubjectCommentsNavigator({
        doc,
        loadPage: fetchSubjectCommentsPage,
        onFailure: (target) => {
          retryTargetRef.current = target;
          setPending(null);
          setFailure({ target });
        },
        onPending: (target) => {
          setFailure(null);
          setPending(target);
        },
        onSuccess: (result) => {
          retryTargetRef.current = null;
          setData(result.data);
          setPending(null);
          setFailure(null);
          setVersion((current) => current + 1);
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
      navigator.navigate({
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
      navigator.navigate({ href, label, source: "user" });
    },
    [navigator]
  );

  const retry = useCallback((): void => {
    const target = retryTargetRef.current;
    if (target) {
      navigator.navigate({ ...target, source: "user" });
    }
  }, [navigator]);

  const dismissFailure = useCallback((): void => setFailure(null), []);

  return {
    data,
    dismissFailure,
    failure,
    navigate,
    pending,
    retry,
    version,
  };
};

export {
  createSubjectCommentsNavigator,
  fetchSubjectCommentsPage,
  useSubjectCommentsNavigation,
  type SubjectCommentsNavigationState,
  type SubjectCommentsNavigationResult,
  type SubjectCommentsNavigationTarget,
  type SubjectCommentsPageLoader,
};
