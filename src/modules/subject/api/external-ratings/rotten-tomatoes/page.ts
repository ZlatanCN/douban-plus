import { gmGetResponse } from "@/shared/utils/request";

import {
  readStructuredPage,
  structuredPageTypes,
} from "../shared/structured-page";

const RT_ORIGIN = "https://www.rottentomatoes.com";
const REQUEST_TIMEOUT = 8000;

const readRtPageId = (value: string): string | null => {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "www.rottentomatoes.com" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    const rtId = url.pathname.replaceAll(/^\/+|\/+$/gu, "");
    return /^(?:m\/[^/]+|tv\/[^/]+(?:\/s\d{2,})?)$/u.test(rtId) ? rtId : null;
  } catch {
    return null;
  }
};

const pathMatches = (url: string, expectedUrl: string): boolean => {
  const actualRtId = readRtPageId(url);
  return actualRtId !== null && actualRtId === readRtPageId(expectedUrl);
};

const requestRtPage = async (
  rtId: string,
  signal: AbortSignal
): Promise<{ html: string; rtId: string; url: string }> => {
  const url = `${RT_ORIGIN}/${rtId}`;
  if (readRtPageId(url) !== rtId) {
    throw new Error("Rotten Tomatoes target was not a supported page");
  }
  const response = await gmGetResponse(url, `${RT_ORIGIN}/`, {
    signal,
    timeoutMs: REQUEST_TIMEOUT,
  });
  const finalRtId = readRtPageId(response.finalUrl);
  if (response.status < 200 || response.status >= 400 || finalRtId === null) {
    throw new Error("Rotten Tomatoes response did not match its mapped page");
  }
  return {
    html: response.responseText,
    rtId: finalRtId,
    url: response.finalUrl,
  };
};

const isRtSeriesPage = (html: string, url: string): boolean => {
  const page = readStructuredPage(html);
  return Boolean(
    page.canonicalUrl &&
    pathMatches(page.canonicalUrl, url) &&
    structuredPageTypes(page).has("TVSeries")
  );
};

export { isRtSeriesPage, requestRtPage };
