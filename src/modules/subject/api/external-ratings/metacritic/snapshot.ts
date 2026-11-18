import type { McObject, McRating } from "@/modules/subject/domain";

const STORAGE_KEY = "dp:metacritic-snapshots:v2";
const FRESH_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

type SnapshotStore = Record<string, McRating>;

const identityKey = (object: McObject): string =>
  JSON.stringify([
    object.subjectId,
    object.kind,
    object.season,
    object.seriesId,
    object.seriesMetacriticId,
    object.metacriticId,
  ]);

const readStore = (): SnapshotStore => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}"
    );
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as SnapshotStore;
  } catch {
    return {};
  }
};

const writeStore = (store: SnapshotStore): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage is an optional performance feature; fetched ratings still render.
  }
};

const withoutKey = (store: SnapshotStore, key: string): SnapshotStore =>
  Object.fromEntries(
    Object.entries(store).filter(([entryKey]) => entryKey !== key)
  );

const isMcScoreSide = (
  side: unknown,
  maximum: number,
  requireInteger: boolean
): side is {
  displayScore: string;
  reviewCount: number | null;
  score: number;
} => {
  if (!side || typeof side !== "object") {
    return false;
  }
  const candidate = side as {
    displayScore?: unknown;
    reviewCount?: unknown;
    score?: unknown;
  };
  return Boolean(
    typeof candidate.score === "number" &&
    Number.isFinite(candidate.score) &&
    candidate.score >= 0 &&
    candidate.score <= maximum &&
    (!requireInteger || Number.isInteger(candidate.score)) &&
    typeof candidate.displayScore === "string" &&
    /^\d+(?:\.\d+)?$/u.test(candidate.displayScore) &&
    Number(candidate.displayScore) === candidate.score &&
    (candidate.reviewCount === null ||
      (typeof candidate.reviewCount === "number" &&
        Number.isSafeInteger(candidate.reviewCount) &&
        candidate.reviewCount >= 0))
  );
};

const isRating = (value: unknown): value is McRating => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const rating = value as Partial<McRating>;
  return Boolean(
    rating.object &&
    typeof rating.object.subjectId === "string" &&
    typeof rating.object.metacriticId === "string" &&
    typeof rating.object.kind === "string" &&
    typeof rating.fetchedAt === "number" &&
    Number.isFinite(rating.fetchedAt) &&
    typeof rating.sourceUrl === "string" &&
    (rating.critics === null || isMcScoreSide(rating.critics, 100, true)) &&
    (rating.audience === null || isMcScoreSide(rating.audience, 10, false)) &&
    (rating.critics !== null || rating.audience !== null)
  );
};

const usableSnapshot = (rating: McRating, now: number): McRating | null => {
  const age = now - rating.fetchedAt;
  if (age < 0 || age > MAX_AGE) {
    return null;
  }
  return { ...rating, stale: age >= FRESH_AGE };
};

const readSnapshot = (
  object: McObject,
  now: number = Date.now()
): McRating | null => {
  const store = readStore();
  const key = identityKey(object);
  const value = store[key];
  if (!isRating(value) || identityKey(value.object) !== key) {
    return null;
  }
  const snapshot = usableSnapshot(value, now);
  if (!snapshot) {
    writeStore(withoutKey(store, key));
  }
  return snapshot;
};

const readUniqueSnapshot = (
  subjectId: string,
  kind: McObject["kind"],
  season: number | null,
  now: number = Date.now()
): McRating | null => {
  const store = readStore();
  const matches = Object.values(store)
    .filter(isRating)
    .filter(
      (rating) =>
        rating.object.subjectId === subjectId &&
        rating.object.kind === kind &&
        rating.object.season === season
    )
    .map((rating) => usableSnapshot(rating, now))
    .filter((rating): rating is McRating => rating !== null);
  return matches.length === 1 ? (matches[0] ?? null) : null;
};

const writeSnapshot = (rating: McRating): void => {
  const store = readStore();
  store[identityKey(rating.object)] = { ...rating, stale: false };
  const entries = Object.entries(store).toSorted(
    ([, left], [, right]) => right.fetchedAt - left.fetchedAt
  );
  writeStore(Object.fromEntries(entries.slice(0, 200)));
};

const removeSnapshot = (object: McObject): void => {
  const store = readStore();
  writeStore(withoutKey(store, identityKey(object)));
};

const removeSnapshotsForContext = (
  subjectId: string,
  kind: McObject["kind"],
  season: number | null
): void => {
  const store = readStore();
  const filtered = Object.fromEntries(
    Object.entries(store).filter(
      ([, rating]) =>
        !isRating(rating) ||
        rating.object.subjectId !== subjectId ||
        rating.object.kind !== kind ||
        rating.object.season !== season
    )
  );
  writeStore(filtered);
};

export {
  readSnapshot,
  readUniqueSnapshot,
  removeSnapshot,
  removeSnapshotsForContext,
  writeSnapshot,
  type SnapshotStore,
};
