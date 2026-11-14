import type { DoubanData, RtObjectKind } from "@/modules/subject/domain";

import type { ResolutionContext } from "./types";

const chineseNumber = (value: string): number | null => {
  if (/^\d+$/u.test(value)) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  }
  const digits: Record<string, number> = {
    一: 1,
    七: 7,
    三: 3,
    九: 9,
    二: 2,
    五: 5,
    八: 8,
    六: 6,
    十: 10,
    四: 4,
  };
  if (value === "十") {
    return 10;
  }
  if (value.startsWith("十")) {
    const ones = digits[value.slice(1)];
    return ones ? 10 + ones : null;
  }
  if (value.endsWith("十")) {
    const tens = digits[value.slice(0, -1)];
    return tens ? tens * 10 : null;
  }
  const [tens, ones] = value.split("十");
  if (tens && ones && digits[tens] && digits[ones]) {
    return digits[tens] * 10 + digits[ones];
  }
  return digits[value] ?? null;
};

const seasonNumbers = (value: string): number[] => {
  const numbers: number[] = [];
  const markers = [
    /\bseason\s*(?<number>\d+)\b/giu,
    /\bS(?<number>\d+)\b/giu,
    /第(?<number>\d+|[一二三四五六七八九十]+)季/gu,
  ];
  for (const marker of markers) {
    for (const match of value.matchAll(marker)) {
      const number = chineseNumber(match.groups?.number ?? "");
      if (number !== null) {
        numbers.push(number);
      }
    }
  }
  return numbers;
};

const selectedSeasonNumbers = (value: string | null | undefined): number[] => {
  if (!value) {
    return [];
  }
  const explicit = seasonNumbers(value);
  if (explicit.length > 0) {
    return explicit;
  }
  const selected = value.match(/^\s*(?<number>\d+)\s*$/u)?.groups?.number;
  const number = selected ? chineseNumber(selected) : null;
  return number === null ? [] : [number];
};

const cleanEnglishTitle = (value: string): string | null => {
  const cleaned = value
    .replace(/\s*\(\d{4}\)\s*$/u, "")
    .replace(/\s*(?:\bseason\s*\d+|\bS\d+)\s*$/iu, "")
    .replaceAll(/第[一二三四五六七八九十\d]+季/gu, "")
    .trim();
  return /[A-Za-z]/u.test(cleaned) ? cleaned : null;
};

const isEpisodeLabel = (value: string): boolean =>
  /(?:\b(?:episode|ep\.?|e)\s*\d+\b|第(?:\d+|[一二三四五六七八九十]+)集)/iu.test(
    value
  );

const buildContext = (data: DoubanData): ResolutionContext => {
  const titles = [data.title.seasonLabel, data.title.full, data.title.original];
  const seasons = [
    ...titles.flatMap(seasonNumbers),
    ...selectedSeasonNumbers(data.info.selectedSeason),
  ];
  const uniqueSeasons = [...new Set(seasons)];
  const seasonConflict = uniqueSeasons.length > 1;
  const season = uniqueSeasons.length === 1 ? (uniqueSeasons[0] ?? null) : null;
  const unsupportedEpisode = data.isTV && titles.some(isEpisodeLabel);
  let kind: RtObjectKind = "movie";
  if (data.isTV) {
    kind = season === null ? "series" : "season";
  }
  const englishTitle =
    cleanEnglishTitle(data.title.original) ??
    cleanEnglishTitle(data.title.primary) ??
    cleanEnglishTitle(data.title.full);

  return {
    englishTitle,
    imdbId: data.info.imdb || null,
    isTV: data.isTV,
    kind,
    season,
    seasonConflict,
    subjectId: data.subjectId,
    subjectTitle: data.title.full,
    unsupportedEpisode,
    year: data.isTV ? null : data.year || null,
  };
};

export { buildContext };
