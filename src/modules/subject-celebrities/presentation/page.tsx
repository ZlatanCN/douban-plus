import { useMemo } from "preact/hooks";

import type { SubjectCelebritiesPageData } from "@/modules/subject-celebrities/domain";
import { StickyNav } from "@/shared/components/layout";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";

import { compactGroupLabel, creditGroupId, CreditGroup } from "./credit-group";

type SubjectCelebritiesPageProps = {
  data: SubjectCelebritiesPageData;
  doc: Document;
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
