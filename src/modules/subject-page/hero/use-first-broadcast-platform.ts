import { useEffect, useState } from "preact/hooks";

import { fetchFirstBroadcastPlatform } from "@/api/first-broadcast-platform";

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
      const value = await fetchFirstBroadcastPlatform(subjectId);
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
