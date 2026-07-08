import { getCk, gmPost } from "../utils/request";

const API_VOTE = "https://movie.douban.com/j/comment/vote";

interface VoteResult {
  ok: boolean;
  count?: number;
}

const postVote = async (
  cid: string,
  subjectId?: string
): Promise<VoteResult> => {
  const ck = getCk();
  if (!ck) {
    return { ok: false };
  }

  try {
    const text = await gmPost(
      API_VOTE,
      `id=${cid}&ck=${ck}`,
      subjectId ? `https://movie.douban.com/subject/${subjectId}/` : undefined
    );
    const data: { count: number; r: number } = JSON.parse(text);
    if (data.r === 0) {
      return { count: data.count, ok: true };
    }
    return { ok: false };
  } catch (error) {
    console.warn("[ATV-Douban] postVote error:", error);
    return { ok: false };
  }
};

export { postVote };
export type { VoteResult };
