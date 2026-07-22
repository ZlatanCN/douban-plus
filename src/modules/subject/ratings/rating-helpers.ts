const scoreClass = (score: number): string => {
  if (score >= 61) {
    return "is-high";
  }
  if (score >= 40) {
    return "is-medium";
  }
  return "is-low";
};

const mcWordRatingChinese = (score: number): string => {
  if (score >= 81) {
    return "普遍赞誉";
  }
  if (score >= 61) {
    return "大体好评";
  }
  if (score >= 40) {
    return "褒贬不一";
  }
  if (score >= 20) {
    return "大体差评";
  }
  return "普遍差评";
};

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

export { isFresh, mcWordRatingChinese, ratingStateClass, scoreClass };
