type Review = {
  avatar: string;
  content: string;
  id: string;
  link: string;
  name: string;
  ratingWord: string;
  spoiler: boolean;
  stars: number;
  time: string;
  title: string;
  usefulCount: number;
  uselessCount: number;
};

type ReviewVoteCallback = (
  rid: string,
  type: "useful" | "useless"
) => Promise<{ ok: boolean; usefulCount?: number; uselessCount?: number }>;

type AccountActionGuard = () => boolean;

export type { AccountActionGuard, Review, ReviewVoteCallback };
