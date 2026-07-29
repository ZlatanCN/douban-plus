/* ── Generic Types ─────────────────────────────────────── */

import type {
  AccountActionGuard as ReaderAccountActionGuard,
  Review as ReaderReview,
  ReviewVoteCallback as ReaderReviewVoteCallback,
} from "@/domains/review-reader";
import type { InterestState } from "@/shared/components/interest-form";

export type {
  InterestActionResult,
  InterestFormCallbacks as ModalCallbacks,
  InterestFormSnapshot,
  InterestFormState,
  InterestMarkingActions,
  InterestState,
  InterestWriteOptions,
} from "@/shared/components/interest-form";

type Review = ReaderReview;
type ReviewVoteCallback = ReaderReviewVoteCallback;
type AccountActionGuard = ReaderAccountActionGuard;

/* ── Extract Return Types ─────────────────────────────── */

/** Return type of extractTitle() */
type TitleInfo = {
  full: string;
  primary: string;
  original: string;
  seasonLabel: string;
};

/** Return type of fetchImdbRating() — score 0-10, count = number of votes */
type ImdbRating = {
  score: number;
  count: number;
};

/** Return type of fetchMcRating() — weighted critic score 0-100, review count */
type McRating = {
  score: number;
  reviewCount: number;
};

/** Rotten Tomatoes ratings — Tomatometer (critics) and Popcornmeter (audience), each score 0-100 */
type RtRating = {
  criticsScore: number;
  criticsCount: number;
  audienceScore: number;
  audienceCount: number;
};

type RatingInfo = {
  score: number;
  count: number;
};

/** An optional position in a Douban editorial subject collection. */
type RankLabel = {
  position: string;
  title: string;
  href: string;
};

/** Return type of extractInfo() — the "info" block from #info */
type InfoBlock = {
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
};

/** Return type of extractCelebrities() */
type Celebrity = {
  name: string;
  role: string;
  avatar: string;
  link: string;
};

/** Return type of extractPhotos() */
type Photo = {
  thumbUrl: string;
  hdUrl: string;
  link: string;
};

/** Return type of extractTrailers() */
type Trailer = {
  /** Thumbnail image URL from background-image CSS */
  thumbUrl: string;
  /** URL to the trailer page on Douban (e.g. /trailer/324711/) */
  trailerPageUrl: string;
  /** Title text (e.g. "预告片", "预告片1") */
  title: string;
};

/** Return type of extractRecommendations() */
type Recommendation = {
  title: string;
  poster: string;
  link: string;
};

/** A native Douban group topic associated with the current subject. */
type DiscussionTopic = {
  href: string;
  title: string;
  author?: DiscussionAuthor;
  replies?: number;
  activity?: DiscussionActivity;
};

/** A discussion author, with an optional safe profile destination. */
type DiscussionAuthor = {
  name: string;
  href?: string;
};

/** Raw activity text plus the presentation-safe parts of a parsed timestamp. */
type DiscussionActivity = {
  raw: string;
  date?: string;
  dateTime?: string;
  time?: string;
};

/** A native destination for the current subject's entire discussion collection. */
type DiscussionCollectionLink = {
  href: string;
  total?: number;
};

/** Group discussion summary extracted from the native subject page. */
type DiscussionData = {
  topics: DiscussionTopic[];
  startDiscussionHref?: string;
  allDiscussions?: DiscussionCollectionLink;
};

/** Return type of extractComments() */
type Comment = {
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
};

/** Return type of extractAwards() */
type Award = {
  org: string;
  orgLink: string;
  name: string;
  person: string;
  personLink: string;
};

/** Return type of extractStreaming() */
type Streaming = {
  name: string;
  href: string;
  /** Provider icon URL from Douban's own vendor-icon img, if available */
  iconUrl?: string;
};

/** Return type of extractSeries() */
type SeriesItem = {
  title: string;
  poster: string;
  rating: string;
  link: string;
};

/* ── Aggregate Data Type ──────────────────────────────── */

/** The complete data object assembled in render() */
type DoubanData = {
  subjectId: string;
  title: TitleInfo;
  year: string;
  poster: string | null;
  rating: RatingInfo | null;
  rankLabel: RankLabel | null;
  summary: string | null;
  info: InfoBlock;
  celebrities: Celebrity[];
  photos: Photo[];
  trailers: Trailer[];
  recommendations: Recommendation[];
  comments: Comment[];
  discussions: DiscussionData;
  reviews: Review[];
  awards: Award[];
  streaming: Streaming[];
  series: SeriesItem[];
  /** Interest state (wish/do/collect) extracted once at render time */
  interest: InterestState;
  isTV: boolean;
};

/* ── Narrow Builder Interfaces ──────────────────────────── */

/** A section link for the sticky navigation bar */
type NavSection = {
  id: string;
  label: string;
};

/** Data slice for buildHero — exactly the fields the hero section renders */
type HeroData = {
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
  rankLabel: RankLabel | null;
  imdbId: string | null;
  interest: InterestState;
  summary: string | null;
};

/** Callback seam for hero interest actions — replaces direct api/extract imports */
type InterestOpenOptions = {
  action?: string;
  status?: Exclude<InterestState["status"], "none">;
};

type HeroCallbacks = {
  handleOpenInterest: (
    state: InterestState,
    options?: InterestOpenOptions
  ) => void;
};

/** Data slice for buildPhotos */
type PhotosData = {
  photos: Photo[];
  trailers: Trailer[];
  subjectId: string;
};

/** Data slice for buildComments */
type CommentsData = {
  comments: Comment[];
  subjectId: string;
};

/** Data slice for buildReviews */
type ReviewData = {
  reviews: Review[];
  subjectId: string;
  /** true for TV series → use "剧评" instead of "影评" */
  isTV: boolean;
  handleReviewVote?: ReviewVoteCallback;
  canReviewVote?: AccountActionGuard;
};

/** Data slice for buildDetails */
type DetailsData = {
  info: InfoBlock;
  isTV: boolean;
  awards: Award[];
};

/** Data slice for buildStickyNav */
type StickyNavData = {
  title: Pick<TitleInfo, "primary" | "full">;
  sections: NavSection[];
};

/* ── Interest / Mark Types ────────────────────────────── */

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
  DiscussionActivity,
  DiscussionAuthor,
  DiscussionCollectionLink,
  DiscussionData,
  DiscussionTopic,
  DoubanData,
  HeroCallbacks,
  HeroData,
  ImdbRating,
  InfoBlock,
  InterestOpenOptions,
  McRating,
  RtRating,
  NavSection,
  Photo,
  PhotosData,
  RatingInfo,
  RankLabel,
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
