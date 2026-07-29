import { getCk, gmPost } from "@/shared/utils/request";

import type { ReviewVoteCallback } from "./domain";

const postReviewVote: (
  subjectId: string,
  rid: string,
  type: "useful" | "useless"
) => ReturnType<ReviewVoteCallback> = async (subjectId, rid, type) => {
  const ck = getCk();
  if (!ck) {
    return { ok: false };
  }
  try {
    const text = await gmPost(
      `https://movie.douban.com/j/review/${rid}/${type}`,
      `ck=${ck}`,
      `https://movie.douban.com/subject/${subjectId}/`,
      { "x-csrf-token": `${ck} ck` }
    );
    const data = JSON.parse(text) as {
      r: number;
      useful_count?: number;
      useless_count?: number;
    };
    return data.r === 0
      ? {
          ok: true,
          ...(typeof data.useful_count === "number"
            ? { usefulCount: data.useful_count }
            : {}),
          ...(typeof data.useless_count === "number"
            ? { uselessCount: data.useless_count }
            : {}),
        }
      : { ok: false };
  } catch {
    return { ok: false };
  }
};
export { postReviewVote };
