import { gmGetResponse } from "@/shared/utils/request";

import { readStructuredPage, structuredPageTypes } from "./structured-page";

const RT_ORIGIN = "https://www.rottentomatoes.com";
const REQUEST_TIMEOUT = 8000;

const pathMatches = (url: string, rtId: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.rottentomatoes.com" &&
      parsed.pathname === `/${rtId}` &&
      !parsed.search
    );
  } catch {
    return false;
  }
};

const requestRtPage = async (
  rtId: string,
  signal: AbortSignal
): Promise<{ html: string; url: string }> => {
  const url = `${RT_ORIGIN}/${rtId}`;
  const response = await gmGetResponse(url, `${RT_ORIGIN}/`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  if (
    response.status < 200 ||
    response.status >= 400 ||
    !pathMatches(response.finalUrl, rtId)
  ) {
    throw new Error("Rotten Tomatoes response did not match its mapped page");
  }
  return { html: response.responseText, url };
};

const isRtSeriesPage = (html: string, rtId: string): boolean => {
  const page = readStructuredPage(html);
  return Boolean(
    page.canonicalUrl &&
    pathMatches(page.canonicalUrl, rtId) &&
    structuredPageTypes(page).has("TVSeries")
  );
};

export { isRtSeriesPage, requestRtPage };
