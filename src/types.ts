/* ── Generic Types ─────────────────────────────────────── */

/** A name + URL pair, used by streaming sources and links */
type Link = {
  name: string;
  url: string;
};

/* ── Extract Return Types ─────────────────────────────── */

/** Return type of extractTitle() */
type TitleInfo = {
  full: string;
  primary: string;
  original: string;
};

/** Return type of extractRating() */
type RatingInfo = {
  score: number;
  count: number;
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

/** Return type of extractRecommendations() */
type Recommendation = {
  title: string;
  poster: string;
  link: string;
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
};

/* ── Aggregate Data Type ──────────────────────────────── */

/** The complete data object assembled in render() */
type DoubanData = {
  subjectId: string;
  title: TitleInfo;
  year: string;
  poster: string | null;
  rating: RatingInfo | null;
  summary: string | null;
  info: InfoBlock;
  celebrities: Celebrity[];
  photos: Photo[];
  recommendations: Recommendation[];
  comments: Comment[];
  awards: Award[];
  streaming: Streaming[];
  isTV: boolean;
};

/* ── Exports ──────────────────────────────────────────── */

export type {
  Award,
  Celebrity,
  Comment,
  DoubanData,
  InfoBlock,
  Link,
  Photo,
  RatingInfo,
  Recommendation,
  Streaming,
  TitleInfo,
};
