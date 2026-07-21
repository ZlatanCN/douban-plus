type PersonageFact = {
  label: string;
  value: string;
};

type PersonageGalleryImage = {
  alt: string;
  largeSrc: string;
  src: string;
};

type PersonageGallery = {
  allImagesHref: string | null;
  images: PersonageGalleryImage[];
};

type PersonageWork = {
  href: string;
  poster: string;
  rating: string | null;
  title: string;
  /** 作品上映/发布年份，从豆瓣 DOM 解析 */
  year: string | null;
};

type PersonageWorkRail = {
  allWorksHref: string | null;
  totalCount?: number;
  works: PersonageWork[];
};

type PersonageAward = {
  award: string;
  ceremony: string;
  ceremonyHref: string | null;
  work: string | null;
  workHref: string | null;
  year: string;
};

type PersonageAwards = {
  allAwardsHref: string | null;
  awards: PersonageAward[];
  totalCount?: number;
};

type PersonageCollaborator = {
  avatar: string | null;
  href: string;
  name: string;
  sharedWorkCount: number;
  sharedWorksHref: string | null;
};

type PersonageCollaborators = {
  allCollaboratorsHref: string | null;
  collaborators: PersonageCollaborator[];
  totalCount?: number;
};

type PersonageProfile = {
  awards: PersonageAwards | null;
  biography: string[] | null;
  collaborators: PersonageCollaborators | null;
  facts: PersonageFact[];
  gallery: PersonageGallery | null;
  id: string;
  name: string;
  portrait: string | null;
  recentWorks: PersonageWorkRail | null;
  representativeWorks: PersonageWorkRail | null;
};

export type {
  PersonageAward,
  PersonageAwards,
  PersonageCollaborator,
  PersonageCollaborators,
  PersonageFact,
  PersonageGallery,
  PersonageGalleryImage,
  PersonageProfile,
  PersonageWork,
  PersonageWorkRail,
};
