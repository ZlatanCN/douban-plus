import type { SubjectReviewsPageData } from "../domain";
import { SubjectReviewsPage } from "../presentation/page";
import { useSubjectReviewsNavigation } from "./navigation";

const SubjectReviewsRuntimePage = ({
  data,
  doc,
}: {
  data: SubjectReviewsPageData;
  doc: Document;
}) => (
  <SubjectReviewsPage
    doc={doc}
    navigation={useSubjectReviewsNavigation(doc, data)}
  />
);
export { SubjectReviewsRuntimePage };
