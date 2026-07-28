import { useCallback, useMemo, useState } from "preact/hooks";

import { postVote } from "@/modules/subject/api/comment";
import { postReviewVote } from "@/modules/subject/api/review";
import type { DoubanData } from "@/modules/subject/domain";
import { computeNavSections } from "@/modules/subject/navigation/sections";
import type { SubjectPageRuntime as SubjectPageRuntimeState } from "@/modules/subject/runtime/types";
import { doubanInterestActions } from "@/shared/components/interest-form/douban-interest";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";

import { readSubjectData } from "./read-subject-data";
import { SubjectPage } from "./subject-page";
import { useExternalRatings } from "./use-external-ratings";
import { useFirstBroadcastPlatform } from "./use-first-broadcast-platform";
import { useNativeSummary } from "./use-native-summary";
import { useResolvedComments } from "./use-resolved-comments";
import { useResolvedPhotoGeometry } from "./use-resolved-photo-geometry";
import { useSeriesRuntime } from "./use-series-runtime";

type SubjectPageRuntimeProps = {
  data: DoubanData;
  doc: Document;
};

const SubjectPageRuntime = ({
  data: initialData,
  doc,
}: SubjectPageRuntimeProps) => {
  const [data, setData] = useState(initialData);
  const refreshAuthenticatedData =
    useCallback(async (): Promise<DoubanData> => {
      const snapshot = await readSubjectData(data.subjectId);
      const currentContent = doc.querySelector<HTMLElement>("#content");
      if (!currentContent) {
        throw new Error("当前作品页缺少原生内容容器");
      }
      currentContent.replaceWith(doc.importNode(snapshot.nativeContent, true));
      setData(snapshot.data);
      return snapshot.data;
    }, [data.subjectId, doc]);
  const series = useSeriesRuntime(data.series, doc);
  const summary = useNativeSummary(data.summary, doc);
  const resolvedComments = useResolvedComments(data.comments, doc);
  const photoResolution = useResolvedPhotoGeometry(data.photos, doc);
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
      interestMarking: doubanInterestActions,
    },
    externalRatings,
    firstBroadcastPlatform,
    navigation,
    photoResolution,
    resolvedComments,
    series: series.items,
    ...(series.moreLink ? { seriesMoreLink: series.moreLink } : {}),
    summary,
  };

  return (
    <SubjectPage
      data={data}
      onAuthenticated={refreshAuthenticatedData}
      runtime={runtime}
    />
  );
};

export { SubjectPageRuntime };
export type { SubjectPageRuntimeProps };
