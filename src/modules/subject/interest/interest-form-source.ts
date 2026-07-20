import type { InterestFormSnapshot } from "@/types";

type InterestFormSource =
  | { kind: "error"; message: string }
  | { kind: "loading" }
  | { kind: "ready"; snapshot: InterestFormSnapshot };

export type { InterestFormSource };
