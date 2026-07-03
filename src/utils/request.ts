/**
 * ScriptCat sandbox Proxy breaks when GM_xmlhttpRequest is called via a
 * captured reference (the $ import from vite-plugin-monkey).  Calling it
 * directly via `typeof` ensures the Proxy get trap fires fresh every time,
 * matching the behavior of hand-written userscripts that worked. */

// eslint-disable-next-line no-var, vars-on-top
declare var GM_xmlhttpRequest: (details: {
  data?: string;
  headers?: Record<string, string>;
  method: string;
  onerror?: () => void;
  onload?: (response: { responseText: string }) => void;
  url: string;
}) => void;

const delay = (ms: number): Promise<void> =>
  // eslint-disable-next-line promise/avoid-new
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getXhr = () => {
  const g = GM_xmlhttpRequest === undefined ? undefined : GM_xmlhttpRequest;
  if (!g) {
    throw new Error("[DOUBAN-PLUS] GM_xmlhttpRequest unavailable");
  }
  return g;
};

const gmRequest = (
  method: "GET" | "POST",
  url: string,
  referer?: string,
  extraHeaders?: Record<string, string>,
  data?: string
): Promise<string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    ...extraHeaders,
  };
  if (referer) {
    headers.Referer = referer;
  }
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    getXhr()({
      data,
      headers,
      method,
      onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
      onload: (r) => resolve(r.responseText),
      url,
    });
  });
};

const gmPostOnce = (
  url: string,
  data: string,
  referer?: string,
  extraHeaders?: Record<string, string>
): Promise<string> => gmRequest("POST", url, referer, extraHeaders, data);

const RETRY_DELAYS = [300, 800, 2000];

/** gmPost with automatic retry — masks intermittent ScriptCat Proxy failures. */
const gmPost = async (
  url: string,
  data: string,
  referer?: string,
  extraHeaders?: Record<string, string>
): Promise<string> => {
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await gmPostOnce(url, data, referer, extraHeaders);
    } catch (error) {
      if (attempt < RETRY_DELAYS.length) {
        console.warn(
          "[GM] POST failed (attempt",
          attempt + 1,
          "), retrying in",
          RETRY_DELAYS[attempt],
          "ms —",
          (error as Error).message
        );
        // eslint-disable-next-line no-await-in-loop
        await delay(RETRY_DELAYS[attempt]);
      } else {
        throw error;
      }
    }
  }
  throw new Error("[GM] POST failed after all retries");
};

const gmGet = (url: string, referer?: string): Promise<string> =>
  gmRequest("GET", url, referer);

const getCk = (): string =>
  (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";

export { getCk, gmGet, gmPost };
