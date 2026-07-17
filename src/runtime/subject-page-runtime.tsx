import { useMemo } from "preact/hooks";

import { postVote } from "@/api/comment";
import {
  fetchInterestSnapshot,
  postInterest,
  removeInterest,
} from "@/api/interest";
import { postReviewVote } from "@/api/review";
import { computeNavSections } from "@/components/layout/nav";
import { SubjectPage } from "@/modules/subject-page/subject-page";
import type { SubjectPageRuntime as SubjectPageRuntimeState } from "@/modules/subject-page/types";
import type { DoubanData } from "@/types";

import { useExternalRatings } from "./use-external-ratings";
import { useFirstBroadcastPlatform } from "./use-first-broadcast-platform";
import { useNativeSummary } from "./use-native-summary";
import { useResolvedComments } from "./use-resolved-comments";
import { useSeriesRuntime } from "./use-series-runtime";
import { useStickyNavigation } from "./use-sticky-navigation";

type SubjectPageRuntimeProps = {
  data: DoubanData;
  doc: Document;
};

const SubjectPageRuntime = ({ data, doc }: SubjectPageRuntimeProps) => {
  const series = useSeriesRuntime(data.series, doc);
  const summary = useNativeSummary(data.summary, doc);
  const resolvedComments = useResolvedComments(data.comments, doc);
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
    () => computeNavSections({ ...data, series: series.items }),
    [data, series.items]
  );
  const navigation = useStickyNavigation(doc, sections);

  const runtime: SubjectPageRuntimeState = {
    actions: {
      handleCommentVote: (cid) => postVote(cid, data.subjectId),
      handleReviewVote: (rid, type) =>
        postReviewVote(rid, type, data.subjectId),
      interestMarking: {
        fetch: fetchInterestSnapshot,
        post: postInterest,
        remove: removeInterest,
      },
    },
    externalRatings,
    firstBroadcastPlatform,
    navigation,
    resolvedComments,
    series: series.items,
    ...(series.moreLink ? { seriesMoreLink: series.moreLink } : {}),
    summary,
  };

  return <SubjectPage data={data} runtime={runtime} />;
};

export { SubjectPageRuntime };
export type { SubjectPageRuntimeProps };
