import { useEffect, useState } from "preact/hooks";

import { extractH1 } from "@/modules/subject/extract/title-helpers";
import { buildContext } from "@/modules/subject/resolve/context";
import { resolveAll } from "@/modules/subject/resolve/orchestrate";

type ExternalRatings = Awaited<ReturnType<typeof resolveAll>>;

const useExternalRatings = (
  imdbId: string | null,
  isTV: boolean,
  doc: Document
): ExternalRatings | null => {
  const [external, setExternal] = useState<ExternalRatings | null>(null);

  useEffect(() => {
    if (!imdbId) {
      setExternal(null);
      return;
    }

    let cancelled = false;
    const loadRatings = async (): Promise<void> => {
      const ratings = await resolveAll(
        buildContext(imdbId, isTV, extractH1(doc))
      );
      if (!cancelled) {
        setExternal(ratings);
      }
    };
    void loadRatings();

    return () => {
      cancelled = true;
    };
  }, [doc, imdbId, isTV]);

  return external;
};

export { useExternalRatings };
export type { ExternalRatings };
