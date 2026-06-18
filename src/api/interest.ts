import { GM_xmlhttpRequest } from "$";

import type { InterestState } from "../types";

const API_INTEREST = "https://movie.douban.com/j/subject";
const API_REMOVE = "https://movie.douban.com/subject";

const gmPost = (url: string, data: string, referer: string): Promise<string> =>
  // eslint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: referer,
      },
      method: "POST",
      onerror: () => reject(new Error("GM_xmlhttpRequest failed")),
      onload: (r) => resolve(r.responseText),
      url,
    });
  });

const getCk = (): string =>
  (document.cookie.match(/\bck=(?<ck>[^;]+)/u) || [])[1] || "";

type InterestResult = { ok: boolean; error?: string };

const postInterest = async (
  subjectId: string,
  interest: "wish" | "do" | "collect",
  options?: { rating?: number; comment?: string; tags?: string[] }
): Promise<InterestResult> => {
  const ck = getCk();
  if (!ck) {
    return { error: "未登录", ok: false };
  }

  const params = new URLSearchParams({
    ck,
    comment: options?.comment ?? "",
    foldcollect: "F",
    interest,
    private: "",
    rating: typeof options?.rating === "number" ? String(options.rating) : "",
    tags: options?.tags?.join(",") ?? "",
  });

  try {
    const text = await gmPost(
      `${API_INTEREST}/${subjectId}/interest`,
      params.toString(),
      `https://movie.douban.com/subject/${subjectId}/`
    );
    const data = JSON.parse(text);
    if (data.r === 0) {
      return { ok: true };
    }
    return { error: data.msg || "操作失败", ok: false };
  } catch (error) {
    console.warn("[ATV-Douban] postInterest error:", error);
    return { error: String(error), ok: false };
  }
};

const removeInterest = async (
  subjectId: string,
  currentStatus: InterestState["status"]
): Promise<InterestResult> => {
  if (currentStatus === "none") {
    return { ok: true };
  }

  const ck = getCk();
  if (!ck) {
    return { error: "未登录", ok: false };
  }

  const params = new URLSearchParams({ ck });

  try {
    await gmPost(
      `${API_REMOVE}/${subjectId}/remove`,
      params.toString(),
      `https://movie.douban.com/subject/${subjectId}/`
    );
    // Remove endpoint returns HTML, not JSON — if no network error, it succeeded
    return { ok: true };
  } catch (error) {
    console.warn("[ATV-Douban] removeInterest error:", error);
    return { error: String(error), ok: false };
  }
};

export { getCk, postInterest, removeInterest };
export type { InterestResult };
