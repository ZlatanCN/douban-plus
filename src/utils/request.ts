import { GM_xmlhttpRequest } from "$";

const gmPost = (url: string, data: string, referer?: string): Promise<string> =>
  // eslint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (referer) {
      headers.Referer = referer;
    }
    GM_xmlhttpRequest({
      data,
      headers,
      method: "POST",
      onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
      onload: (r) => resolve(r.responseText),
      url,
    });
  });

const getCk = (): string =>
  (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";

export { getCk, gmPost };
