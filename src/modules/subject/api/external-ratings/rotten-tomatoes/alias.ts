import { parseRottenTomatoesPath } from "@/modules/subject/api/external-ratings/shared/wikidata-identity";
import type { ResolutionContext } from "@/modules/subject/resolve/types";

import {
  readStructuredPage,
  structuredPageTypes,
} from "../shared/structured-page";
import { contextIdentityEvidence, verifiesRtAlias } from "./identity";
import { isRtSeriesPage, requestRtPage } from "./page";
import { findSeasonPath, readSeriesRtId, readSeasonNumber } from "./parser";
import type { ResolvedRtTarget } from "./target";

type RtPage = { html: string; rtId: string; url: string };
type AliasValidation =
  | { seriesRtId: string | null; status: "matched" }
  | { status: "aborted" }
  | { status: "identity-conflict" }
  | { status: "identity-unavailable" };
type SeasonPageIdentity =
  | { seriesRtId: string; status: "matched" }
  | { status: "identity-conflict" | "identity-unavailable" };

const verifyWorkAlias = async (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  page: RtPage,
  kind: "movie" | "series",
  signal: AbortSignal
): Promise<AliasValidation> => {
  const evidence = contextIdentityEvidence(context);
  if (!evidence) {
    return { status: "identity-conflict" };
  }
  let proof: Awaited<ReturnType<typeof verifiesRtAlias>>;
  try {
    proof = await verifiesRtAlias(
      {
        evidence,
        expectedStableIds: target.identityImdbIds,
        html: page.html,
        imdbId: context.imdbId,
        kind,
        personIds: target.identityPersonIds,
      },
      signal
    );
  } catch {
    return signal.aborted
      ? { status: "aborted" }
      : { status: "identity-unavailable" };
  }
  if (signal.aborted) {
    return { status: "aborted" };
  }
  if (proof === "matched") {
    return { seriesRtId: null, status: "matched" };
  }
  return {
    status:
      proof === "unavailable" ? "identity-unavailable" : "identity-conflict",
  };
};

const seasonPageIdentity = (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  page: RtPage
): SeasonPageIdentity => {
  const requestedPath = parseRottenTomatoesPath(target.rtId);
  const finalPath = parseRottenTomatoesPath(page.rtId);
  const structuredPage = readStructuredPage(page.html);
  const pageSeason = readSeasonNumber(structuredPage, page.html, page.rtId);
  const pageSeries = readSeriesRtId(structuredPage);
  if (
    requestedPath?.kind !== "season" ||
    finalPath?.kind !== "season" ||
    requestedPath.season !== context.season ||
    finalPath.season !== context.season ||
    pageSeason !== context.season
  ) {
    return { status: "identity-conflict" };
  }
  if (pageSeries === null || target.seriesRtId === null) {
    return { status: "identity-unavailable" };
  }
  return { seriesRtId: pageSeries, status: "matched" };
};

const verifySeasonParent = async (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  page: RtPage,
  expectedSeriesRtId: string,
  signal: AbortSignal
): Promise<AliasValidation> => {
  if (target.seriesRtId === null) {
    return { status: "identity-unavailable" };
  }
  let parentPage: RtPage;
  try {
    parentPage = await requestRtPage(target.seriesRtId, signal);
  } catch {
    return signal.aborted
      ? { status: "aborted" }
      : { status: "identity-unavailable" };
  }
  if (signal.aborted) {
    return { status: "aborted" };
  }
  const structuredPage = readStructuredPage(parentPage.html);
  if (!structuredPage.canonicalUrl || structuredPage.jsonLd.length === 0) {
    return { status: "identity-unavailable" };
  }
  if (!structuredPageTypes(structuredPage).has("TVSeries")) {
    return { status: "identity-conflict" };
  }
  if (!isRtSeriesPage(parentPage.html, parentPage.url)) {
    return { status: "identity-unavailable" };
  }
  if (parentPage.rtId !== expectedSeriesRtId) {
    return { status: "identity-conflict" };
  }
  if (parentPage.rtId !== target.seriesRtId) {
    return verifyWorkAlias(context, target, parentPage, "series", signal);
  }
  const linkedSeason = findSeasonPath(
    parentPage.html,
    parentPage.rtId,
    context.season ?? 0
  );
  if (linkedSeason === null) {
    return { status: "identity-unavailable" };
  }
  return linkedSeason === page.rtId
    ? { seriesRtId: parentPage.rtId, status: "matched" }
    : { status: "identity-conflict" };
};

const verifySeasonAlias = (
  context: ResolutionContext,
  target: ResolvedRtTarget,
  page: RtPage,
  signal: AbortSignal
): Promise<AliasValidation> => {
  const identity = seasonPageIdentity(context, target, page);
  if (identity.status !== "matched") {
    return Promise.resolve({
      status:
        identity.status === "identity-unavailable"
          ? "identity-unavailable"
          : "identity-conflict",
    });
  }
  if (page.rtId === target.rtId && identity.seriesRtId === target.seriesRtId) {
    return Promise.resolve({
      seriesRtId: identity.seriesRtId,
      status: "matched",
    });
  }
  return verifySeasonParent(context, target, page, identity.seriesRtId, signal);
};

const validateRtPage = (
  input: {
    context: ResolutionContext;
    page: RtPage;
    target: ResolvedRtTarget;
  },
  signal: AbortSignal
): Promise<AliasValidation> => {
  if (signal.aborted) {
    return Promise.resolve({ status: "aborted" });
  }
  if (input.context.kind === "season") {
    return verifySeasonAlias(input.context, input.target, input.page, signal);
  }
  if (input.target.rtId === input.page.rtId) {
    return Promise.resolve({ seriesRtId: null, status: "matched" });
  }
  return verifyWorkAlias(
    input.context,
    input.target,
    input.page,
    input.context.kind,
    signal
  );
};

export { validateRtPage, type AliasValidation };
