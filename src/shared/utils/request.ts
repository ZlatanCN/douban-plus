import { GM_xmlhttpRequest } from "$";

const DEFAULT_TIMEOUT_MS = 15_000;

const delay = (ms: number): Promise<void> =>
  // oxlint-disable-next-line promise/avoid-new
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getXhr = () => {
  const g = GM_xmlhttpRequest;
  if (!g) {
    throw new Error("[DOUBAN-PLUS] GM_xmlhttpRequest unavailable");
  }
  return g;
};

type GmResponse = {
  responseText: string;
  status: number;
  finalUrl: string;
};

type GmRequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const gmRequest = (
  method: "GET" | "POST",
  url: string,
  referer?: string,
  extraHeaders?: Record<string, string>,
  data?: string,
  options: GmRequestOptions = {}
): Promise<GmResponse> => {
  const { signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Request aborted", "AbortError"));
  }

  // oxlint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    let settled = false;
    let request: { abort?: () => void } | undefined;
    const abort = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", abort);
      request?.abort?.();
      reject(new DOMException("Request aborted", "AbortError"));
    };

    const resolveOnce = (response: GmResponse): void => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", abort);
      resolve(response);
    };

    const rejectOnce = (error: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener("abort", abort);
      reject(error);
    };

    signal?.addEventListener("abort", abort, { once: true });
    try {
      request = getXhr()({
        ...(data === undefined ? {} : { data }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(referer ? { Referer: referer } : {}),
          ...extraHeaders,
        },
        method,
        onabort: () =>
          rejectOnce(new DOMException("Request aborted", "AbortError")),
        onerror: () => rejectOnce(new Error("GM_xmlhttpRequest failed")),
        onload: (response) => {
          if (response.status < 200 || response.status >= 400) {
            rejectOnce(new Error(`HTTP ${response.status}`));
            return;
          }
          resolveOnce({
            finalUrl: response.finalUrl || url,
            responseText: response.responseText,
            status: response.status,
          });
        },
        ontimeout: () => rejectOnce(new Error("GM request timed out")),
        timeout: timeoutMs,
        url,
      }) as { abort?: () => void };
      if (signal?.aborted) {
        abort();
      }
    } catch (error) {
      rejectOnce(
        error instanceof Error ? error : new Error("GM request failed")
      );
    }
  });
};

const RETRY_DELAYS = [300, 800, 2000];

const postAttempt = async (
  url: string,
  body: string,
  referer: string | undefined,
  extraHeaders: Record<string, string> | undefined,
  attempt: number
): Promise<string> => {
  try {
    const response = await gmRequest("POST", url, referer, extraHeaders, body);
    return response.responseText;
  } catch (error) {
    const retryDelay = RETRY_DELAYS[attempt];
    if (retryDelay === undefined) {
      throw error;
    }
    await delay(retryDelay);
    return postAttempt(url, body, referer, extraHeaders, attempt + 1);
  }
};

const gmPost = (
  url: string,
  body: string,
  referer?: string,
  extraHeaders?: Record<string, string>
): Promise<string> => postAttempt(url, body, referer, extraHeaders, 0);

const gmGet = async (url: string, referer?: string): Promise<string> => {
  const response = await gmRequest("GET", url, referer);
  return response.responseText;
};

const gmGetResponse = (
  url: string,
  referer?: string,
  options?: GmRequestOptions
): Promise<GmResponse> =>
  gmRequest("GET", url, referer, undefined, undefined, options);

const getCk = (): string =>
  (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";

export { getCk, gmGet, gmGetResponse, gmPost };
