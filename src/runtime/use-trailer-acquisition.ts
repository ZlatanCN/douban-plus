import { useEffect, useState } from "preact/hooks";

import type { Trailer } from "@/types";

const FALLBACK_DELAY_MS = 1500;

type TrailerAcquisitionState =
  | { status: "fallback" }
  | { status: "failed" }
  | { status: "loading" }
  | { embedUrl: string; status: "loaded" };

type TrailerAcquisitionRecord = {
  result: TrailerAcquisitionState;
  trailerPageUrl: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const safeEmbedUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value) {
    return null;
  }
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

const findEmbedUrl = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const embedUrl = findEmbedUrl(item);
      if (embedUrl) {
        return embedUrl;
      }
    }
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  return (
    safeEmbedUrl(value.embedUrl) ??
    findEmbedUrl(value.video) ??
    findEmbedUrl(value["@graph"])
  );
};

const extractEmbedUrl = (html: string): string | null => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const script of doc.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  )) {
    try {
      const embedUrl = findEmbedUrl(JSON.parse(script.textContent ?? ""));
      if (embedUrl) {
        return embedUrl;
      }
    } catch {
      // Continue to a later valid LD+JSON block.
    }
  }
  return null;
};

const loadEmbedUrl = async (
  trailerPageUrl: string,
  signal: AbortSignal
): Promise<string> => {
  const response = await fetch(trailerPageUrl, { signal });
  if (!response.ok) {
    throw new Error("trailer page request failed");
  }
  const embedUrl = extractEmbedUrl(await response.text());
  if (!embedUrl) {
    throw new Error("trailer page has no safe embed URL");
  }
  return embedUrl;
};

const useTrailerAcquisition = (
  trailer: Trailer | null
): TrailerAcquisitionState => {
  const [record, setRecord] = useState<TrailerAcquisitionRecord>({
    result: { status: "loading" },
    trailerPageUrl: null,
  });
  const trailerPageUrl = trailer?.trailerPageUrl;

  useEffect(() => {
    if (!trailerPageUrl) {
      return;
    }
    const controller = new AbortController();
    setRecord({ result: { status: "loading" }, trailerPageUrl });
    void (async () => {
      try {
        const embedUrl = await loadEmbedUrl(trailerPageUrl, controller.signal);
        if (!controller.signal.aborted) {
          setRecord({
            result: { embedUrl, status: "loaded" },
            trailerPageUrl,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setRecord({ result: { status: "failed" }, trailerPageUrl });
        }
      }
    })();
    return () => controller.abort();
  }, [trailerPageUrl]);

  useEffect(() => {
    if (
      !trailerPageUrl ||
      record.trailerPageUrl !== trailerPageUrl ||
      record.result.status !== "failed"
    ) {
      return;
    }
    const fallbackTimer = window.setTimeout(() => {
      window.open(trailerPageUrl, "_blank", "noopener");
      setRecord({ result: { status: "fallback" }, trailerPageUrl });
    }, FALLBACK_DELAY_MS);
    return () => window.clearTimeout(fallbackTimer);
  }, [record.result.status, record.trailerPageUrl, trailerPageUrl]);

  return record.trailerPageUrl === trailerPageUrl
    ? record.result
    : { status: "loading" };
};

export { useTrailerAcquisition };
export type { TrailerAcquisitionState };
