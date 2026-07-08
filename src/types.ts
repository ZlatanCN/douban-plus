/* ── Generic Types ─────────────────────────────────────── */

/** A name + URL pair, used by streaming sources and links */
interface Link {
  name: string;
  url: string;
}

/* ── Extract Return Types ─────────────────────────────── */

/** Return type of extractTitle() */
interface TitleInfo {
  full: string;
  primary: string;
  original: string;
}

/** Return type of fetchImdbRating() — score 0-10, count = number of votes */
interface ImdbRating {
  score: number;
  count: number;
}

/** Return type of fetchMcRating() — weighted critic score 0-100, review count */
interface McRating {
  score: number;
  reviewCount: number;
}

/** Rotten Tomatoes ratings — Tomatometer (critics) and Popcornmeter (audience), each score 0-100 */
interface RtRating {
  criticsScore: number;
  criticsCount: number;
  audienceScore: number;
  audienceCount: number;
}

/** Return type of extractRating() */
interface RatingInfo {
  score: number;
  count: number;
}

/** Return type of extractInfo() — the "info" block from #info */
interface InfoBlock {
  director: { text: string; href: string }[];
  writers: { text: string; href: string }[];
  cast: { text: string; href: string }[];
  genres: string[];
  country: string;
  language: string;
  releaseDate: string;
  firstAired: string;
  runtime: string;
  episodes: string;
  seasons: string;
  episodeRuntime: string;
  aliases: string;
  imdb: string;
}

/** Return type of extractCelebrities() */
interface Celebrity {
  name: string;
  role: string;
  avatar: string;
  link: string;
}

/** Return type of extractPhotos() */
interface Photo {
  thumbUrl: string;
  hdUrl: string;
  link: string;
}

/** Return type of extractTrailers() */
interface Trailer {
  /** Thumbnail image URL from background-image CSS */
  thumbUrl: string;
  /** URL to the trailer page on Douban (e.g. /trailer/324711/) */
  trailerPageUrl: string;
  /** Title text (e.g. "预告片", "预告片1") */
  title: string;
}

/** Return type of extractRecommendations() */
interface Recommendation {
  title: string;
  poster: string;
  link: string;
}

/** Return type of extractComments() */
interface Comment {
  name: string;
  link: string;
  content: string;
  stars: number;
  ratingWord: string;
  time: string;
  votes: number;
  avatar: string;
  /** data-cid from .comment-item — used to proxy-click the original "有用" link */
  cid: string;
  /** true if the current user already voted (a.j.vote-comment replaced by "已投票") */
  voted: boolean;
}

/** Return type of extractReviews() */
interface Review {
  /** DOM element id or data-rid */
  id: string;
  /** Review title from h2 a text */
  title: string;
  /** Review content (short excerpt) */
  content: string;
  /** Author display name */
  name: string;
  /** Link to author's Douban profile */
  link: string;
  /** Author avatar URL */
  avatar: string;
  /** Star rating (0-5 scale, e.g. 4.5) */
  stars: number;
  /** Rating word like "力荐", "推荐" */
  ratingWord: string;
  /** Publish time string */
  time: string;
  /** Number of "有用" (useful) votes */
  usefulCount: number;
  /** Number of "没用" (useless) votes */
  uselessCount: number;
  /** Whether this review has a spoiler warning (.spoiler-tip) */
  spoiler: boolean;
}

/** Return type of extractAwards() */
interface Award {
  org: string;
  orgLink: string;
  name: string;
  person: string;
  personLink: string;
}

/** Return type of extractStreaming() */
interface Streaming {
  name: string;
  href: string;
}

/** Return type of extractSeries() */
interface SeriesItem {
  title: string;
  poster: string;
  rating: string;
  link: string;
}

/* ── Aggregate Data Type ──────────────────────────────── */

/** The complete data object assembled in render() */
interface DoubanData {
  subjectId: string;
  title: TitleInfo;
  year: string;
  poster: string | null;
  rating: RatingInfo | null;
  summary: string | null;
  info: InfoBlock;
  celebrities: Celebrity[];
  photos: Photo[];
  trailers: Trailer[];
  recommendations: Recommendation[];
  comments: Comment[];
  reviews: Review[];
  awards: Award[];
  streaming: Streaming[];
  series: SeriesItem[];
  /** Interest state (wish/do/collect) extracted once at render time */
  interest: InterestState;
  isTV: boolean;
}

/* ── Narrow Builder Interfaces ──────────────────────────── */

/** A section link for the sticky navigation bar */
interface NavSection {
  id: string;
  label: string;
}

/** Data slice for buildHero — exactly the fields the hero section renders */
interface HeroData {
  photos: Photo[];
  subjectId: string;
  poster: string | null;
  title: TitleInfo;
  year: string;
  isTV: boolean;
  info: Pick<
    InfoBlock,
    "seasons" | "episodes" | "episodeRuntime" | "country" | "genres" | "runtime"
  >;
  rating: RatingInfo | null;
  imdbId: string | null;
  interest: InterestState;
  summary: string | null;
}

/** Callback seam for hero interest actions — replaces direct api/extract imports */
interface HeroCallbacks {
  handleWishClick: () => void;
  handleWatchingClick: () => void;
  handleCollectClick: () => void;
  handleOpenInterest: (state: InterestState) => void;
}

/** Data slice for buildPhotos */
interface PhotosData {
  photos: Photo[];
  trailers: Trailer[];
  subjectId: string;
}

/** Data slice for buildComments */
interface CommentsData {
  comments: Comment[];
  subjectId: string;
}

/** Callback seam for review voting. */
type ReviewVoteCallback = (
  rid: string,
  type: "useful" | "useless"
) => Promise<{ ok: boolean; usefulCount?: number; uselessCount?: number }>;
type AccountActionGuard = () => boolean;

/** Data slice for buildReviews */
interface ReviewData {
  reviews: Review[];
  subjectId: string;
  /** true for TV series → use "剧评" instead of "影评" */
  isTV: boolean;
  handleReviewVote?: ReviewVoteCallback;
  canReviewVote?: AccountActionGuard;
}

/** Data slice for buildDetails */
interface DetailsData {
  info: InfoBlock;
  isTV: boolean;
  awards: Award[];
}

/** Data slice for buildStickyNav */
interface StickyNavData {
  title: Pick<TitleInfo, "primary" | "full">;
  sections: NavSection[];
}

/* ── Interest / Mark Types ────────────────────────────── */

/** Parsed interest state from the real Douban page */
interface InterestState {
  loggedIn: boolean;
  marked: boolean;
  status: "none" | "wish" | "do" | "collect";
  rating: number;
  date: string;
  tags: string[];
  ck: string;
  /** true if this page has a "在看" (watching) option — i.e. it's a TV series */
  hasWatching: boolean;
  /** user's short review text, e.g. "哎呀，还挺好看啊" (S3 only) */
  comment: string;
  /** vote count text from the .pl child span, e.g. "1有用" (S3 only) */
  usefulCount: string;
}

/** Form data the user fills in the interest modal */
interface InterestFormState {
  status: "wish" | "do" | "collect";
  rating: number;
  comment: string;
}

/** Callback seam — modal calls these instead of importing API directly */
interface ModalCallbacks {
  onSave: (form: InterestFormState) => Promise<{ ok: boolean; error?: string }>;
  onRemove: (
    status: InterestState["status"]
  ) => Promise<{ ok: boolean; error?: string }>;
}

/** Map from interest value to Chinese label */
const INTEREST_LABELS: Record<InterestState["status"], string> = {
  collect: "看过",
  do: "在看",
  none: "未标记",
  wish: "想看",
};

/* ── Exports ──────────────────────────────────────────── */

export type {
  AccountActionGuard,
  Award,
  Celebrity,
  Comment,
  CommentsData,
  DetailsData,
  DoubanData,
  HeroCallbacks,
  HeroData,
  ImdbRating,
  InfoBlock,
  McRating,
  RtRating,
  InterestFormState,
  InterestState,
  Link,
  ModalCallbacks,
  NavSection,
  Photo,
  PhotosData,
  RatingInfo,
  Recommendation,
  Review,
  ReviewData,
  ReviewVoteCallback,
  SeriesItem,
  StickyNavData,
  Streaming,
  TitleInfo,
  Trailer,
};
export { INTEREST_LABELS };
