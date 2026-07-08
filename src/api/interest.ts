import type { InterestState } from "../types";
import { getCk, gmPost } from "../utils/request";

const API_INTEREST = "https://movie.douban.com/j/subject";
const API_REMOVE = "https://movie.douban.com/subject";

interface InterestResult {
  ok: boolean;
  error?: string;
}

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

export { postInterest, removeInterest };
export type { InterestResult };
