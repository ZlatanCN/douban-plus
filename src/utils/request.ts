import { GM_xmlhttpRequest as _gmXhr } from "$";

// Ambient declare for the bare-identifier fallback (ScriptCat sandbox Proxy).
declare const GM_xmlhttpRequest: (options: {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  data?: string;
  onerror: () => void;
  onload: (response: { responseText: string }) => void;
}) => void;

/** Lazy-resolve GM_xmlhttpRequest — cached after first call.
 *  - Dev mode:       resolved from $ import (monkeyWindow.GM_xmlhttpRequest)
 *  - Build (TM):     resolved from $ import (typeof works in TM sandbox)
 *  - Build (ScriptCat): $ import returns undefined → bare identifier → Proxy get */
let _xhr: typeof _gmXhr | undefined;
const getXhr = (): typeof _gmXhr => {
  if (_xhr) {
    return _xhr;
  }
  _xhr = _gmXhr;
  if (_xhr) {
    return _xhr;
  }
  // ScriptCat bare-identifier fallback (triggers sandbox Proxy get trap)
  try {
    _xhr = GM_xmlhttpRequest as unknown as typeof _gmXhr;
  } catch {
    /* not in ScriptCat */
  }
  if (!_xhr) {
    throw new Error("[DOUBAN-PLUS] GM_xmlhttpRequest unavailable");
  }
  return _xhr;
};

const gmPost = (
  url: string,
  data: string,
  referer?: string,
  extraHeaders?: Record<string, string>
): Promise<string> =>
  // eslint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      ...extraHeaders,
    };
    if (referer) {
      headers.Referer = referer;
    }
    getXhr()({
      data,
      headers,
      method: "POST",
      onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
      onload: (r) => resolve(r.responseText),
      url,
    });
  });

const gmGet = (url: string, referer?: string): Promise<string> =>
  // eslint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    if (referer) {
      headers.Referer = referer;
    }
    getXhr()({
      headers,
      method: "GET",
      onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
      onload: (r) => resolve(r.responseText),
      url,
    });
  });

const getCk = (): string =>
  (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";

export { getCk, gmGet, gmPost };
