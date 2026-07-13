import { useEffect, useState } from "preact/hooks";

import { fetchFirstBroadcastPlatform } from "@/api/first-broadcast-platform";

const platformCache = new Map<string, string | null>();
const platformRequests = new Map<string, Promise<string | null>>();

const loadFirstBroadcastPlatform = (
  subjectId: string
): Promise<string | null> => {
  if (platformCache.has(subjectId)) {
    return Promise.resolve(platformCache.get(subjectId) ?? null);
  }

  const inFlight = platformRequests.get(subjectId);
  if (inFlight) {
    return inFlight;
  }

  const request = (async (): Promise<string | null> => {
    try {
      const platform = await fetchFirstBroadcastPlatform(subjectId);
      platformCache.set(subjectId, platform);
      return platform;
    } finally {
      platformRequests.delete(subjectId);
    }
  })();
  platformRequests.set(subjectId, request);
  return request;
};

const useFirstBroadcastPlatform = (
  subjectId: string,
  loggedIn: boolean
): string | null => {
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn || !subjectId) {
      setPlatform(null);
      return;
    }

    let active = true;
    void (async () => {
      const value = await loadFirstBroadcastPlatform(subjectId);
      if (active) {
        setPlatform(value);
      }
    })();

    return () => {
      active = false;
    };
  }, [loggedIn, subjectId]);

  return platform;
};

export { useFirstBroadcastPlatform };
