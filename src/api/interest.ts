import type {
  InterestActionResult,
  InterestFormSnapshot,
  InterestState,
  InterestWriteOptions,
} from "@/types";
import { normalizeInterestTags } from "@/utils/interest-tags";
import { getCk, gmGet, gmPost } from "@/utils/request";

const API_INTEREST = "https://movie.douban.com/j/subject";
const API_REMOVE = "https://movie.douban.com/subject";

type InterestResponse = {
  html?: unknown;
  interest_status?: unknown;
  my_tags?: unknown;
  popular_tags?: unknown;
  tags?: unknown;
};

const isInterestStatus = (
  value: unknown
): value is Exclude<InterestFormSnapshot["status"], "none"> =>
  value === "wish" || value === "do" || value === "collect";

const snapshotStatus = (value: unknown): InterestFormSnapshot["status"] => {
  if (value === "" || value === null || value === undefined) {
    return "none";
  }
  if (isInterestStatus(value)) {
    return value;
  }
  throw new Error("返回的作品标记状态无效");
};

const formSettingsFromHtml = (
  html: unknown
): Pick<InterestFormSnapshot, "isPrivate" | "shareToBroadcast"> => {
  if (typeof html !== "string") {
    return { isPrivate: false, shareToBroadcast: false };
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  return {
    isPrivate: !!doc.querySelector<HTMLInputElement>("#inp-private")?.checked,
    shareToBroadcast:
      !!doc.querySelector<HTMLInputElement>("#share-shuo")?.checked,
  };
};

const fetchInterestSnapshot = async (
  subjectId: string
): Promise<InterestFormSnapshot> => {
  if (!getCk()) {
    throw new Error("未登录");
  }

  try {
    const response = JSON.parse(
      await gmGet(
        `${API_INTEREST}/${subjectId}/interest`,
        `https://movie.douban.com/subject/${subjectId}/`
      )
    ) as InterestResponse;
    return {
      ...formSettingsFromHtml(response.html),
      myTags: normalizeInterestTags(
        Array.isArray(response.my_tags) ? response.my_tags : []
      ),
      popularTags: normalizeInterestTags(
        Array.isArray(response.popular_tags) ? response.popular_tags : []
      ),
      status: snapshotStatus(response.interest_status),
      tags: normalizeInterestTags(
        Array.isArray(response.tags) ? response.tags : []
      ),
    };
  } catch (error) {
    console.warn("[ATV-Douban] fetchInterestSnapshot error:", error);
    throw new Error("无法读取完整标记", { cause: error });
  }
};

const postInterest = async (
  subjectId: string,
  interest: "wish" | "do" | "collect",
  options?: Partial<InterestWriteOptions>
): Promise<InterestActionResult> => {
  const ck = getCk();
  if (!ck) {
    return { error: "未登录", ok: false };
  }

  const params = new URLSearchParams({
    ck,
    comment: options?.comment ?? "",
    foldcollect: "F",
    interest,
    rating: typeof options?.rating === "number" ? String(options.rating) : "",
    tags: options?.tags?.join(" ") ?? "",
    ...(options?.isPrivate ? { private: "on" } : {}),
    ...(options?.shareToBroadcast && !options.isPrivate
      ? { "share-shuo": "douban" }
      : {}),
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
): Promise<InterestActionResult> => {
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

export { fetchInterestSnapshot, postInterest, removeInterest };
export type { InterestActionResult as InterestResult } from "@/types";
