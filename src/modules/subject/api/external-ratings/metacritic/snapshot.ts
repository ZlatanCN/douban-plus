import type { McObject, McRating } from "@/modules/subject/domain";

const STORAGE_KEY = "dp:metacritic-snapshots:v1";
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
    typeof rating.sourceUrl === "string" &&
    typeof rating.score === "number" &&
    Number.isFinite(rating.score) &&
    rating.score >= 0 &&
    rating.score <= 100 &&
    (rating.reviewCount === null ||
      (typeof rating.reviewCount === "number" &&
        Number.isSafeInteger(rating.reviewCount) &&
        rating.reviewCount >= 0))
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
