const isFresh = (score: number): boolean => score >= 60;

const ratingStateClass = (hasRating: boolean, resolved: boolean): string => {
  if (hasRating) {
    return "is-loaded";
  }
  if (resolved) {
    return "is-empty";
  }
  return "is-loading";
};

export { isFresh, ratingStateClass };
