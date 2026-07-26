import { useMemo } from "preact/hooks";

import { StickyNav } from "@/shared/components/layout";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";

import type {
  ResolvedSubjectAllPhotosPageData,
  ResolvedSubjectPhotoGroup,
} from "../domain";
import { archivePhotoSource } from "../domain/photo-source";

type SubjectAllPhotosPageProps = {
  data: ResolvedSubjectAllPhotosPageData;
  doc: Document;
};

const numberFormatter = new Intl.NumberFormat("zh-CN");
const photoGroupId = (index: number): string =>
  `atv-photo-archive-section-${index + 1}`;

const PhotoGroup = ({
  group,
  index,
  title,
}: {
  group: ResolvedSubjectPhotoGroup;
  index: number;
  title: string;
}) => {
  const headingId = `atv-photo-archive-group-${index + 1}`;

  return (
    <section
      aria-labelledby={headingId}
      class="atv-photo-archive-group"
      id={photoGroupId(index)}
    >
      <header class="atv-photo-archive-group-heading">
        <div>
          <h2 id={headingId}>{group.label}</h2>
          <p class="atv-photo-archive-count">
            {numberFormatter.format(group.count)} 张
          </p>
        </div>
        <a class="atv-photo-archive-all" href={group.allHref}>
          查看全部 <span aria-hidden="true">↗</span>
        </a>
      </header>
      <ul aria-label={`${group.label}预览`} class="atv-photo-archive-grid">
        {group.photos.map((photo, photoIndex) => (
          <li
            class="atv-photo-archive-item"
            key={photo.href}
            style={{
              "--atv-photo-archive-aspect-ratio": String(photo.aspectRatio),
            }}
          >
            <a
              aria-label={`查看《${title}》${group.label}第 ${photoIndex + 1} 张`}
              class="atv-photo-archive-tile"
              href={photo.href}
            >
              <img alt="" loading="lazy" {...archivePhotoSource(photo.src)} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

const SubjectAllPhotosPage = ({ data, doc }: SubjectAllPhotosPageProps) => {
  const sections = useMemo(
    () =>
      data.groups.map((group, index) => ({
        id: photoGroupId(index),
        label: group.label,
      })),
    [data.groups]
  );
  const navigation = useStickyNavigation(doc, sections);

  return (
    <>
      <StickyNav
        {...navigation}
        className="atv-photo-archive-nav"
        title={data.title}
      />
      <main class="atv-photo-archive">
        <header class="atv-photo-archive-hero">
          <div class="atv-photo-archive-toolbar">
            <a class="atv-photo-archive-back" href={data.subjectHref}>
              <span aria-hidden="true">←</span> 返回作品
            </a>
            {data.uploadHref ? (
              <a class="atv-photo-archive-upload" href={data.uploadHref}>
                上传图片 <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
          <div class="atv-photo-archive-intro">
            <p>影像档案</p>
            <h1>{data.title}</h1>
            <dl aria-label="图集分类总览" class="atv-photo-archive-index">
              {data.groups.map((group) => (
                <div key={group.allHref}>
                  <dt>{group.label}</dt>
                  <dd>{numberFormatter.format(group.count)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>
        <div class="atv-photo-archive-groups">
          {data.groups.map((group, index) => (
            <PhotoGroup
              group={group}
              index={index}
              key={group.allHref}
              title={data.title}
            />
          ))}
        </div>
      </main>
    </>
  );
};

export { SubjectAllPhotosPage };
export type { SubjectAllPhotosPageProps };
