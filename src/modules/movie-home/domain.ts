type WebLink = {
  href: string;
  label: string;
};

type MovieHomeMovie = {
  poster: string | null;
  rating: string | null;
  subjectHref: string;
  ticketHref: string | null;
  title: string;
};

type MovieHomeRank = {
  href: string;
  rank: string;
  title: string;
};

type MovieHomeListItem = {
  href: string;
  recommendations: string;
  title: string;
};

type MovieHomeRecommendation = {
  href: string;
  image: string;
  summary: string;
  title: string;
};

type MovieHomeReview = {
  author: WebLink;
  fullTextHref: string;
  href: string;
  poster: string | null;
  subject: WebLink;
  summary: string;
  title: string;
};

type MovieHomeData = {
  hotMovies: {
    nowPlaying: WebLink;
    movies: MovieHomeMovie[];
    upcoming: WebLink;
  };
  lists: {
    items: MovieHomeListItem[];
  } | null;
  navigation: WebLink[];
  ranking: {
    explanation: WebLink | null;
    items: MovieHomeRank[];
    more: WebLink;
  } | null;
  recommendations: {
    items: MovieHomeRecommendation[];
  } | null;
  reviews: {
    items: MovieHomeReview[];
    latest: WebLink;
    more: WebLink;
  } | null;
  search: {
    action: string;
    categoryName: string;
    categoryValue: string;
    queryName: string;
  };
};

export type {
  MovieHomeData,
  MovieHomeListItem,
  MovieHomeMovie,
  MovieHomeRank,
  MovieHomeRecommendation,
  MovieHomeReview,
  WebLink,
};
