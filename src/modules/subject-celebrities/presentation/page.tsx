import { useMemo, useRef } from "preact/hooks";

import type {
  SubjectCelebritiesPageData,
  SubjectCelebrityCredit,
  SubjectCelebrityGroup,
} from "@/modules/subject-celebrities/domain";
import { SafeImage } from "@/shared/components/common/safe-image";
import { StickyNav } from "@/shared/components/layout";
import { useSectionReveal } from "@/shared/hooks/use-section-reveal";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";

type SubjectCelebritiesPageProps = {
  data: SubjectCelebritiesPageData;
  doc: Document;
};

const creditGroupId = (index: number): string =>
  `atv-credit-group-${index + 1}`;

const compactGroupLabel = (title: string): string => {
  const primary = title.match(/^[^\p{Script=Latin}]+/u)?.[0].trim() ?? "";
  return primary || title;
};

const chineseLabel = (label: string): string => {
  const latinIndex = label.search(/\p{Script=Latin}/u);
  if (latinIndex < 0) {
    return label;
  }

  return label.slice(0, latinIndex).trim() || label;
};

type NameHierarchy = {
  original: string | null;
  primary: string;
};

const nameHierarchy = (name: string): NameHierarchy => {
  const latinIndex = name.search(/\p{Script=Latin}/u);
  if (latinIndex < 1) {
    return { original: null, primary: name };
  }

  return {
    original: name.slice(latinIndex).trim(),
    primary: name.slice(0, latinIndex).trim(),
  };
};

type CreditPresentation = {
  character: NameHierarchy | null;
  detail: string | null;
  title: string;
};

const creditPresentation = (
  credit: string | null
): CreditPresentation | null => {
  if (!credit) {
    return null;
  }

  const parentheticalDetail = credit.match(/\s*\((?<detail>[^)]+)\)\s*$/u);
  const title = chineseLabel(
    parentheticalDetail
      ? credit.slice(0, parentheticalDetail.index).trim()
      : credit
  );
  const detail = parentheticalDetail?.groups?.detail ?? null;
  const characterName = detail?.match(/^饰\s+(?<name>.+)$/u)?.groups?.name;

  return {
    character: characterName ? nameHierarchy(characterName) : null,
    detail,
    title,
  };
};

const CreditAvatar = ({
  avatar,
  name,
}: Pick<SubjectCelebrityCredit, "avatar" | "name">) => (
  <SafeImage
    alt={`${name}的头像`}
    className="atv-credit-avatar"
    fallback={<div aria-hidden="true" class="atv-credit-avatar is-empty" />}
    src={avatar}
  />
);

const CreditName = ({ name }: Pick<SubjectCelebrityCredit, "name">) => {
  const displayName = nameHierarchy(name);

  return (
    <span class="atv-credit-name">
      <span class="atv-credit-name-primary">{displayName.primary}</span>
      {displayName.original ? (
        <span class="atv-credit-name-original">{displayName.original}</span>
      ) : null}
    </span>
  );
};

const CreditRole = ({ credit }: Pick<SubjectCelebrityCredit, "credit">) => {
  const displayCredit = creditPresentation(credit);
  if (!displayCredit) {
    return null;
  }

  if (displayCredit.character) {
    return (
      <div class="atv-credit-role">
        <span class="atv-credit-role-title">{displayCredit.title}</span>
        <span class="atv-credit-character">
          <span class="atv-credit-character-prefix">饰</span>
          <span class="atv-credit-character-name">
            {displayCredit.character.primary}
          </span>
          {displayCredit.character.original ? (
            <span class="atv-credit-character-original">
              {displayCredit.character.original}
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <div class="atv-credit-role">
      <span class="atv-credit-role-title">{displayCredit.title}</span>
      {displayCredit.detail ? (
        <span class="atv-credit-role-detail">{displayCredit.detail}</span>
      ) : null}
    </div>
  );
};

const CreditIdentity = ({
  avatar,
  credit,
  href,
  name,
}: SubjectCelebrityCredit) => {
  const portrait = <CreditAvatar avatar={avatar} name={name} />;

  return (
    <div class="atv-credit-identity">
      {href ? (
        <a
          aria-label={`在新标签页查看${name}`}
          class="atv-credit-person"
          href={href}
          rel="noreferrer"
          target="_blank"
        >
          {portrait}
          <CreditName name={name} />
        </a>
      ) : (
        <div class="atv-credit-person is-static">
          {portrait}
          <CreditName name={name} />
        </div>
      )}
      <CreditRole credit={credit} />
    </div>
  );
};

const CreditCard = ({ credit }: { credit: SubjectCelebrityCredit }) => (
  <article class="atv-credit-card">
    <CreditIdentity {...credit} />
    {credit.works.length > 0 ? (
      <div class="atv-credit-works">
        <span>代表作</span>
        <div>
          {credit.works.map((work, index) => (
            <a
              class="atv-credit-work"
              href={work.href}
              key={`${work.href}-${index}`}
              rel="noreferrer"
              target="_blank"
            >
              {work.title}
            </a>
          ))}
        </div>
      </div>
    ) : null}
  </article>
);

type CreditGroupProps = {
  group: SubjectCelebrityGroup;
  id: string;
};

const CreditGroup = ({ group, id }: CreditGroupProps) => {
  const ref = useRef<HTMLElement | null>(null);
  useSectionReveal(ref);
  const heading = chineseLabel(group.title);

  return (
    <section class="atv-credit-group atv-section-reveal" id={id} ref={ref}>
      <div class="atv-credit-group-heading">
        <h2>{heading}</h2>
        <p>{group.credits.length} 位</p>
      </div>
      <div class="atv-credit-grid">
        {group.credits.map((credit, index) => (
          <CreditCard
            credit={credit}
            key={`${credit.href ?? credit.name}-${index}`}
          />
        ))}
      </div>
    </section>
  );
};

const SubjectCelebritiesPage = ({ data, doc }: SubjectCelebritiesPageProps) => {
  const sections = useMemo(
    () =>
      data.groups.map((group, index) => ({
        id: creditGroupId(index),
        label: compactGroupLabel(group.title),
      })),
    [data.groups]
  );
  const navigation = useStickyNavigation(doc, sections);
  const totalCredits = data.groups.reduce(
    (total, group) => total + group.credits.length,
    0
  );

  return (
    <>
      <StickyNav
        {...navigation}
        className="atv-celebrities-nav"
        title={data.title}
      />
      <main class="atv-celebrities">
        <header class="atv-celebrities-hero">
          <p class="atv-celebrities-kicker">全部演职员</p>
          <h1>{data.title}</h1>
          <div class="atv-celebrities-context">
            <p>{totalCredits} 位演职员</p>
            {data.subjectHref ? (
              <a
                class="atv-credit-back"
                href={data.subjectHref}
                rel="noreferrer"
                target="_blank"
              >
                查看作品详情 <span aria-hidden="true">↗</span>
              </a>
            ) : null}
          </div>
        </header>
        <div class="atv-credit-groups">
          {data.groups.map((group, index) => (
            <CreditGroup
              group={group}
              id={creditGroupId(index)}
              key={creditGroupId(index)}
            />
          ))}
        </div>
      </main>
    </>
  );
};

export { SubjectCelebritiesPage };
export type { SubjectCelebritiesPageProps };
