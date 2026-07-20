import type { ComponentChild } from "preact";

import { IconArrow } from "@/components/common/icons";
import { Section } from "@/components/layout/section";
import { RE_IMDB_LINK } from "@/constants";
import type { Award, DetailsData, InfoBlock } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type DetailsSectionProps = {
  data: DetailsData;
};

type DetailRow = {
  label: ComponentChild;
  value: ComponentChild;
};

const textValue = (text: string) => <div class="atv-info-value">{text}</div>;

const linkParts = (items: { text: string; href?: string }[]) =>
  items.flatMap((item, index) => [
    index > 0 ? <span key={`sep-${index}`}> / </span> : null,
    item.href ? (
      <a href={item.href} key={`link-${index}`} rel="noopener" target="_blank">
        {item.text}
      </a>
    ) : (
      <span key={`text-${index}`}>{item.text}</span>
    ),
  ]);

const linksValue = (items: { text: string; href?: string }[]) => (
  <div class="atv-info-value">{linkParts(items)}</div>
);

const imdbValue = (imdb: string) => (
  <div class="atv-info-value">
    {RE_IMDB_LINK.test(imdb) ? (
      <a
        href={`https://www.imdb.com/title/${imdb}/`}
        rel="noopener"
        target="_blank"
      >
        {imdb}
        <IconArrow />
      </a>
    ) : (
      imdb
    )}
  </div>
);

const collectTimeRows = (
  info: InfoBlock,
  isTV: boolean,
  rows: DetailRow[]
): void => {
  if (isTV) {
    if (info.firstAired) {
      rows.push({ label: "首播", value: textValue(info.firstAired) });
    } else if (info.releaseDate) {
      rows.push({ label: "首播", value: textValue(info.releaseDate) });
    }
    if (info.seasons) {
      rows.push({ label: "季数", value: textValue(info.seasons) });
    }
    if (info.episodes) {
      rows.push({ label: "集数", value: textValue(info.episodes) });
    }
    if (info.episodeRuntime) {
      rows.push({ label: "单集片长", value: textValue(info.episodeRuntime) });
    }
    return;
  }

  if (info.releaseDate) {
    rows.push({ label: "上映日期", value: textValue(info.releaseDate) });
  }
  if (info.runtime) {
    rows.push({ label: "片长", value: textValue(info.runtime) });
  }
};

const awardRows = (awards: Award[]): DetailRow[] =>
  awards.map((award) => ({
    label: (
      <div class="atv-info-label" style={{ color: "var(--atv-rating-gold)" }}>
        {award.orgLink ? (
          <a
            href={award.orgLink}
            rel="noopener"
            style={{ color: "inherit" }}
            target="_blank"
          >
            {award.org}
          </a>
        ) : (
          award.org
        )}
      </div>
    ),
    value: (
      <div class="atv-info-value">
        {award.name ? <div>{award.name}</div> : null}
        {award.person ? (
          <div
            style={{
              color: "var(--atv-text-tertiary)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            {award.personLink ? (
              <a href={award.personLink} rel="noopener" target="_blank">
                {award.person}
              </a>
            ) : (
              award.person
            )}
          </div>
        ) : null}
      </div>
    ),
  }));

const collectDetailRows = ({
  awards,
  info,
  isTV,
}: DetailsData): DetailRow[] => {
  const rows: DetailRow[] = [];

  if (info.director.length) {
    rows.push({ label: "导演", value: linksValue(info.director) });
  }
  if (info.writers.length) {
    rows.push({ label: "编剧", value: linksValue(info.writers) });
  }
  if (info.cast.length) {
    rows.push({ label: "主演", value: linksValue(info.cast) });
  }
  if (info.genres.length) {
    rows.push({ label: "类型", value: textValue(info.genres.join(" / ")) });
  }
  if (info.country) {
    rows.push({ label: "制片国家/地区", value: textValue(info.country) });
  }
  if (info.language) {
    rows.push({ label: "语言", value: textValue(info.language) });
  }

  collectTimeRows(info, isTV, rows);

  if (info.aliases) {
    rows.push({ label: "又名", value: textValue(info.aliases) });
  }
  if (info.imdb) {
    rows.push({ label: "IMDb", value: imdbValue(info.imdb) });
  }
  if (awards.length) {
    rows.push(...awardRows(awards));
  }

  return rows;
};

const DetailsSection = ({ data }: DetailsSectionProps) => {
  const rows = collectDetailRows(data);
  if (!rows.length) {
    return null;
  }

  return (
    <Section
      id="atv-info"
      title={getSubjectSectionCopy("details").sectionTitle}
    >
      <div class="atv-info-grid">
        {rows.map((row) => (
          <>
            {typeof row.label === "string" ? (
              <div class="atv-info-label">{row.label}</div>
            ) : (
              row.label
            )}
            {row.value}
          </>
        ))}
      </div>
    </Section>
  );
};

export { DetailsSection, collectDetailRows };
export type { DetailRow, DetailsSectionProps };
