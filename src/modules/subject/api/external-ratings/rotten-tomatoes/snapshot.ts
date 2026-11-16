import type { RtObjectKind, RtRating } from "@/modules/subject/domain";

const STORAGE_KEY = "dp:rotten-snapshots:v2";
const FRESH_AGE = 7 * 24 * 60 * 60 * 1000;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

type SnapshotStore = Record<string, RtRating>;

const identityKey = (object: RtRating["object"]): string =>
  JSON.stringify([object.subjectId, object.kind, object.rtId]);

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

const isRating = (value: unknown): value is RtRating => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const rating = value as Partial<RtRating>;
  return Boolean(
    rating.object &&
    typeof rating.object.subjectId === "string" &&
    typeof rating.object.rtId === "string" &&
    typeof rating.object.kind === "string" &&
    typeof rating.fetchedAt === "number" &&
    typeof rating.sourceUrl === "string"
  );
};

const usableSnapshot = (rating: RtRating, now: number): RtRating | null => {
  const age = now - rating.fetchedAt;
  if (age < 0 || age > MAX_AGE) {
    return null;
  }
  return { ...rating, stale: age >= FRESH_AGE };
};

const readSnapshot = (
  object: RtRating["object"],
  now: number = Date.now()
): RtRating | null => {
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
  kind: RtObjectKind,
  now: number = Date.now()
): RtRating | null => {
  const store = readStore();
  const matches = Object.values(store)
    .filter(isRating)
    .filter(
      (rating) =>
        rating.object.subjectId === subjectId && rating.object.kind === kind
    )
    .map((rating) => usableSnapshot(rating, now))
    .filter((rating): rating is RtRating => rating !== null);
  return matches.length === 1 ? (matches[0] ?? null) : null;
};

const writeSnapshot = (rating: RtRating): void => {
  const store = readStore();
  store[identityKey(rating.object)] = { ...rating, stale: false };
  const entries = Object.entries(store).toSorted(
    ([, left], [, right]) => right.fetchedAt - left.fetchedAt
  );
  writeStore(Object.fromEntries(entries.slice(0, 200)));
};

const removeSnapshot = (object: RtRating["object"]): void => {
  const store = readStore();
  writeStore(withoutKey(store, identityKey(object)));
};

const removeSnapshotsForContext = (
  subjectId: string,
  kind: RtObjectKind
): void => {
  const store = readStore();
  const retained = Object.fromEntries(
    Object.entries(store).filter(
      ([, value]) =>
        !isRating(value) ||
        value.object.subjectId !== subjectId ||
        value.object.kind !== kind
    )
  );
  writeStore(retained);
};

export {
  readSnapshot,
  readUniqueSnapshot,
  removeSnapshot,
  removeSnapshotsForContext,
  writeSnapshot,
};
