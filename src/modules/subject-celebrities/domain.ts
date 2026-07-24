type CelebrityWork = {
  href: string;
  title: string;
};

type SubjectCelebrityCredit = {
  avatar: string | null;
  credit: string | null;
  href: string | null;
  name: string;
  works: CelebrityWork[];
};

type SubjectCelebrityGroup = {
  credits: SubjectCelebrityCredit[];
  title: string;
};

type SubjectCelebritiesPageData = {
  groups: SubjectCelebrityGroup[];
  subjectHref: string | null;
  subjectId: string;
  title: string;
};

export type {
  CelebrityWork,
  SubjectCelebritiesPageData,
  SubjectCelebrityCredit,
  SubjectCelebrityGroup,
};
