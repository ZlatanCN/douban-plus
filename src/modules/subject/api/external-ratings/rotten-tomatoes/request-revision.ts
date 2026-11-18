import type { ResolutionContext } from "@/modules/subject/resolve/types";

const revisions = new Map<string, number>();

const requestKey = (context: ResolutionContext): string =>
  JSON.stringify([
    context.subjectId,
    context.imdbId,
    context.kind,
    context.season,
  ]);

const currentRevision = (context: ResolutionContext): number =>
  revisions.get(requestKey(context)) ?? 0;

const isCurrent = (context: ResolutionContext, revision: number): boolean =>
  currentRevision(context) === revision;

const invalidateRequests = (context: ResolutionContext): number => {
  const revision = currentRevision(context) + 1;
  revisions.set(requestKey(context), revision);
  return revision;
};

export { currentRevision, invalidateRequests, isCurrent };
