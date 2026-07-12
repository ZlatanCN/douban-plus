import { useEffect, useMemo, useState } from "preact/hooks";

import { postVote } from "@/api/comment";
import { postInterest, removeInterest } from "@/api/interest";
import { postReviewVote } from "@/api/review";
import { computeNavSections } from "@/components/layout/nav";
import { expandNativeSummary } from "@/extract/rating";
import { SubjectPage } from "@/modules/subject-page/subject-page";
import type { SubjectPageRuntime as SubjectPageRuntimeState } from "@/modules/subject-page/types";
import type { DoubanData } from "@/types";

import { extractSeriesMoreLink, watchSeries } from "./series-effect";
import { useExternalRatings } from "./use-external-ratings";
import { useFirstBroadcastPlatform } from "./use-first-broadcast-platform";
import { useStickyNavigation } from "./use-sticky-navigation";

type SubjectPageRuntimeProps = {
  data: DoubanData;
  doc: Document;
};

const reloadPage = (): void => {
  location.reload();
};

const SubjectPageRuntime = ({ data, doc }: SubjectPageRuntimeProps) => {
  const [series, setSeries] = useState(data.series);
  const externalRatings = useExternalRatings(
    data.info.imdb || null,
    data.isTV,
    doc
  );
  const firstBroadcastPlatform = useFirstBroadcastPlatform(
    data.subjectId,
    data.interest.loggedIn
  );
  const sections = useMemo(
    () => computeNavSections({ ...data, series }),
    [data, series]
  );
  const navigation = useStickyNavigation(doc, sections);

  useEffect(() => watchSeries(setSeries, doc), [doc]);

  const runtime: SubjectPageRuntimeState = {
    actions: {
      expandNativeSummary: () => expandNativeSummary(doc),
      handleCommentVote: (cid) => postVote(cid, data.subjectId),
      handleReviewVote: (rid, type) =>
        postReviewVote(rid, type, data.subjectId),
      interestMarking: {
        post: postInterest,
        reload: reloadPage,
        remove: removeInterest,
      },
    },
    externalRatings,
    firstBroadcastPlatform,
    navigation,
    series,
    seriesMoreLink: extractSeriesMoreLink(doc),
  };

  return <SubjectPage data={data} runtime={runtime} />;
};

export { SubjectPageRuntime };
export type { SubjectPageRuntimeProps };
