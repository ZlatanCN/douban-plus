import { useEffect, useState } from "preact/hooks";

import { buildContext } from "@/resolve/context";
import { resolveAll } from "@/resolve/orchestrate";

type ExternalRatings = Awaited<ReturnType<typeof resolveAll>>;

const useExternalRatings = (
  imdbId: string | null,
  isTV: boolean
): ExternalRatings | null => {
  const [external, setExternal] = useState<ExternalRatings | null>(null);

  useEffect(() => {
    if (!imdbId) {
      setExternal(null);
      return;
    }

    let cancelled = false;
    const loadRatings = async (): Promise<void> => {
      const ratings = await resolveAll(buildContext(imdbId, isTV, document));
      if (!cancelled) {
        setExternal(ratings);
      }
    };
    void loadRatings();

    return () => {
      cancelled = true;
    };
  }, [imdbId, isTV]);

  return external;
};

export { useExternalRatings };
export type { ExternalRatings };
