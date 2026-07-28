import type { SubjectCommentsPageData } from "../domain";
import { SubjectCommentsPage } from "../presentation/page";
import { useSubjectCommentsNavigation } from "./navigation";

type SubjectCommentsRuntimePageProps = {
  data: SubjectCommentsPageData;
  doc: Document;
};

const SubjectCommentsRuntimePage = ({
  data: initialData,
  doc,
}: SubjectCommentsRuntimePageProps) => {
  const navigation = useSubjectCommentsNavigation(doc, initialData);
  return <SubjectCommentsPage doc={doc} navigation={navigation} />;
};

export { SubjectCommentsRuntimePage };
