import { getCk, gmPost } from "@/utils/request";

const API_REVIEW_VOTE = "https://movie.douban.com/j/review";

type ReviewVoteResult = {
  ok: boolean;
  usefulCount?: number;
  uselessCount?: number;
};

type ReviewVoteResponse = {
  useful_count: number;
  useless_count: number;
  r: number;
};

const postReviewVote = async (
  rid: string,
  type: "useful" | "useless",
  subjectId?: string
): Promise<ReviewVoteResult> => {
  const ck = getCk();
  if (!ck) {
    return { ok: false };
  }

  try {
    const text = await gmPost(
      `${API_REVIEW_VOTE}/${rid}/${type}`,
      `ck=${ck}`,
      subjectId ? `https://movie.douban.com/subject/${subjectId}/` : undefined,
      { "x-csrf-token": `${ck} ck` }
    );
    const data: ReviewVoteResponse = JSON.parse(text);
    if (data.r === 0) {
      return {
        ok: true,
        usefulCount: data.useful_count,
        uselessCount: data.useless_count,
      };
    }
    return { ok: false };
  } catch (error) {
    console.warn("[ATV-Douban] postReviewVote error:", error);
    return { ok: false };
  }
};

export { postReviewVote };
export type { ReviewVoteResult };
