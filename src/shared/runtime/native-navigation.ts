import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";

type NativeNavigationSource = "history" | "sync" | "user";

type NativeNavigationTarget = {
  href: string;
  label: string;
  source: NativeNavigationSource;
};

type NativeNavigationResult<Data> = {
  data: Data;
  href: string;
  nativeContent: HTMLElement;
};

type NativePageLoader<Data> = (
  href: string,
  signal: AbortSignal
) => Promise<NativeNavigationResult<Data>>;

type NativeNavigationOptions<Data> = {
  doc: Document;
  getTitle: (result: NativeNavigationResult<Data>) => string;
  loadPage: NativePageLoader<Data>;
  onFailure: (target: NativeNavigationTarget) => void;
  onPending: (target: NativeNavigationTarget) => void;
  onSuccess: (
    result: NativeNavigationResult<Data>,
    target: NativeNavigationTarget
  ) => void;
};

type NativeNavigationState<Data> = {
  data: Data;
  dismissFailure: () => void;
  failure: NativeNavigationTarget | null;
  navigate: (href: string, label: string) => void;
  pending: NativeNavigationTarget | null;
  refresh: () => Promise<boolean>;
  retry: () => void;
  version: number;
};

type UseNativeNavigationOptions<Data> = {
  doc: Document;
  getTitle: (result: NativeNavigationResult<Data>) => string;
  initialData: Data;
  loadPage: NativePageLoader<Data>;
  refreshLabel: string;
};

const replaceNativeContent = (
  doc: Document,
  sourceContent: HTMLElement
): void => {
  const currentContent = doc.querySelector<HTMLElement>("#content");
  if (!currentContent) {
    throw new Error("当前原生页面缺少内容容器");
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
    // Detached documents can have a different origin. Live pages validate
    // same-origin URLs before they enter this module.
  }
};

const createNativeNavigation = <Data>({
  doc,
  getTitle,
  loadPage,
  onFailure,
  onPending,
  onSuccess,
}: NativeNavigationOptions<Data>) => {
  let activeController: AbortController | null = null;
  let lastSuccessfulHref = doc.location.href;
  let sequence = 0;

  const navigate = async (target: NativeNavigationTarget): Promise<boolean> => {
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
      doc.title = getTitle(result);
      if (target.source === "user") {
        writeHistory(doc, "pushState", result.href);
      }
      onSuccess(result, target);
      return true;
    } catch (error: unknown) {
      if (controller.signal.aborted || requestSequence !== sequence) {
        return false;
      }
      if (!isAbortError(error) && doc.location.href !== previousHref) {
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

const useNativeNavigation = <Data>({
  doc,
  getTitle,
  initialData,
  loadPage,
  refreshLabel,
}: UseNativeNavigationOptions<Data>): NativeNavigationState<Data> => {
  const [data, setData] = useState(initialData);
  const [pending, setPending] = useState<NativeNavigationTarget | null>(null);
  const [failure, setFailure] = useState<NativeNavigationTarget | null>(null);
  const [version, setVersion] = useState(0);
  const retryTargetRef = useRef<NativeNavigationTarget | null>(null);
  const navigator = useMemo(
    () =>
      createNativeNavigation({
        doc,
        getTitle,
        loadPage,
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
    [doc, getTitle, loadPage]
  );

  useEffect(() => {
    const view = doc.defaultView;
    if (!view) {
      return () => navigator.dispose();
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
        label: refreshLabel,
        source: "sync",
      }),
    [doc, navigator, refreshLabel]
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
  createNativeNavigation,
  useNativeNavigation,
  type NativeNavigationResult,
  type NativeNavigationState,
  type NativeNavigationTarget,
  type NativePageLoader,
};
