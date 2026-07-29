import { useRef } from "preact/hooks";

import type { SubjectCelebrityGroup } from "@/modules/subject-celebrities/domain";
import { useSectionReveal } from "@/shared/hooks/use-section-reveal";

import { CreditCard, chineseLabel } from "./credit-card";

const creditGroupId = (index: number): string =>
  `atv-credit-group-${index + 1}`;

const compactGroupLabel = (title: string): string => {
  const primary = title.match(/^[^\p{Script=Latin}]+/u)?.[0].trim() ?? "";

  return primary || title;
};

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

export { creditGroupId, compactGroupLabel, CreditGroup };
export type { CreditGroupProps };
