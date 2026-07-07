import type { HeroCallbacks } from "../types";
import { buildInterestMarkingCallbacks } from "./interest-marking";

const buildHeroCallbacks = (
  subjectId: string,
  doc: Document = document
): HeroCallbacks => buildInterestMarkingCallbacks(subjectId, { doc });

export { buildHeroCallbacks };
