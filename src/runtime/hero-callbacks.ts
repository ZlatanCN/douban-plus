import type { HeroCallbacks } from "../types";
import { buildInterestMarkingCallbacks } from "./interest-marking";

const buildHeroCallbacks = (
  subjectId: string,
  doc: Document = document,
  loggedIn = true
): HeroCallbacks => buildInterestMarkingCallbacks(subjectId, { doc, loggedIn });

export { buildHeroCallbacks };
