type InterestStatus = "none" | "wish" | "do" | "collect";

/** The current user's marking state for one Douban subject. */
type InterestState = {
  ck: string;
  comment: string;
  date: string;
  hasWatching: boolean;
  loggedIn: boolean;
  marked: boolean;
  rating: number;
  status: InterestStatus;
  tags: string[];
  usefulCount: string;
};

/** Values edited in the shared marking form. */
type InterestFormState = {
  comment: string;
  isPrivate: boolean;
  rating: number;
  shareToBroadcast: boolean;
  status: Exclude<InterestStatus, "none">;
  tags: string[];
};

/** Fresh values returned by Douban when the form opens. */
type InterestFormSnapshot = {
  isPrivate: boolean;
  myTags: string[];
  popularTags: string[];
  rating?: number;
  shareToBroadcast: boolean;
  status: InterestStatus;
  tags: string[];
};

type InterestActionResult = {
  error?: string;
  ok: boolean;
};

type InterestWriteOptions = {
  comment: string;
  isPrivate: boolean;
  rating?: number;
  shareToBroadcast: boolean;
  tags: string[];
};

type InterestMarkingActions = {
  fetch: (subjectId: string) => Promise<InterestFormSnapshot>;
  read: (subjectId: string) => Promise<InterestState>;
  post: (
    subjectId: string,
    status: InterestFormState["status"],
    options: InterestWriteOptions
  ) => Promise<InterestActionResult>;
  remove: (
    subjectId: string,
    status: InterestStatus
  ) => Promise<InterestActionResult>;
};

type InterestFormCallbacks = {
  onRemove: (status: InterestStatus) => Promise<InterestActionResult>;
  onSave: (form: InterestFormState) => Promise<InterestActionResult>;
};

type InterestFormSource =
  | { kind: "error"; message: string }
  | { kind: "loading" }
  | { kind: "ready"; snapshot: InterestFormSnapshot };

export type {
  InterestActionResult,
  InterestFormCallbacks,
  InterestFormSnapshot,
  InterestFormSource,
  InterestFormState,
  InterestMarkingActions,
  InterestState,
  InterestStatus,
  InterestWriteOptions,
};
