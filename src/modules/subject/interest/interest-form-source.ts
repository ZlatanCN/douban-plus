import type { InterestFormSnapshot } from "@/modules/subject/domain";

type InterestFormSource =
  | { kind: "error"; message: string }
  | { kind: "loading" }
  | { kind: "ready"; snapshot: InterestFormSnapshot };

export type { InterestFormSource };
