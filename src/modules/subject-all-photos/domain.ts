type SubjectPhotoPreview = {
  href: string;
  src: string;
};

type SubjectPhotoGroup = {
  allHref: string;
  count: number;
  label: string;
  photos: SubjectPhotoPreview[];
};

type SubjectAllPhotosPageData = {
  groups: SubjectPhotoGroup[];
  subjectHref: string;
  title: string;
  uploadHref: string | null;
};

type ResolvedSubjectPhotoPreview = SubjectPhotoPreview & {
  aspectRatio: number;
};

type ResolvedSubjectPhotoGroup = Omit<SubjectPhotoGroup, "photos"> & {
  photos: ResolvedSubjectPhotoPreview[];
};

type ResolvedSubjectAllPhotosPageData = Omit<
  SubjectAllPhotosPageData,
  "groups"
> & {
  groups: ResolvedSubjectPhotoGroup[];
};

export type {
  ResolvedSubjectAllPhotosPageData,
  ResolvedSubjectPhotoGroup,
  ResolvedSubjectPhotoPreview,
  SubjectAllPhotosPageData,
  SubjectPhotoGroup,
  SubjectPhotoPreview,
};
