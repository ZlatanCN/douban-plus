import type {
  AuditStatus,
  DiagnosticRecord,
  NetworkObservation,
  Source,
} from "./live-rating-audit-types";

const classifyDiagnostic = (
  record: DiagnosticRecord | undefined,
  observations: NetworkObservation[] = [],
  visibleRating = false
): AuditStatus => {
  if (
    !record ||
    record.reason === "cancelled" ||
    record.reason === "request-error"
  ) {
    return "unverified";
  }
  if (
    observations.some((observation) =>
      isRestrictedResponse(record.source, observation)
    )
  ) {
    return "unverified";
  }
  if (record.reason === "rating") {
    return visibleRating ? "pass" : "fail";
  }
  if (record.reason === "source-no-rating") {
    return visibleRating ? "fail" : "pass";
  }
  return "fail";
};

const isRestrictedResponse = (
  source: Source,
  observation: NetworkObservation
): boolean => {
  const request = new URL(observation.requestUrl);
  const final = new URL(observation.finalUrl || observation.requestUrl);
  const sourceHost = {
    imdb: "imdb.com",
    mc: "metacritic.com",
    rt: "rottentomatoes.com",
  }[source];
  const isProviderResponse =
    request.hostname === sourceHost ||
    request.hostname.endsWith(`.${sourceHost}`) ||
    request.hostname === "www.wikidata.org";
  if (!isProviderResponse) {
    return false;
  }
  if (
    observation.status === 401 ||
    observation.status === 403 ||
    observation.status === 407 ||
    observation.status === 429 ||
    observation.status >= 500
  ) {
    return true;
  }
  if (
    (request.hostname === sourceHost ||
      request.hostname.endsWith(`.${sourceHost}`)) &&
    final.hostname !== sourceHost &&
    !final.hostname.endsWith(`.${sourceHost}`)
  ) {
    return true;
  }
  return observation.restricted;
};

const responseIsRestricted = (input: {
  finalUrl: string;
  requestUrl: string;
  responseText: string;
  status: number;
}): boolean => {
  if (
    input.status === 401 ||
    input.status === 403 ||
    input.status === 407 ||
    input.status === 429 ||
    input.status >= 500
  ) {
    return true;
  }
  const request = new URL(input.requestUrl);
  const final = new URL(input.finalUrl || input.requestUrl);
  if (final.hostname === "sec.douban.com" || final.pathname.startsWith("/c")) {
    return true;
  }
  const providerRoots = [
    "douban.com",
    "imdb.com",
    "metacritic.com",
    "rottentomatoes.com",
    "wikidata.org",
  ];
  const requestRoot = providerRoots.find(
    (root) => request.hostname === root || request.hostname.endsWith(`.${root}`)
  );
  const finalRoot = providerRoots.find(
    (root) => final.hostname === root || final.hostname.endsWith(`.${root}`)
  );
  if (requestRoot && finalRoot !== requestRoot) {
    return true;
  }
  return /captcha|access denied|temporarily blocked|request blocked|verify (?:that )?you are human|unusual traffic|robot check/iu.test(
    input.responseText.slice(0, 10_000)
  );
};

export { classifyDiagnostic, responseIsRestricted };
