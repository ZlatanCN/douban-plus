import { Section } from "@/components/layout/section";

import type { PersonageAwards } from "./types";

type PersonageAwardsSectionProps = {
  awards: PersonageAwards | null;
};

const AwardLink = ({
  children,
  href,
}: {
  children: string;
  href: string | null;
}) =>
  href ? (
    <a href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );

const PersonageAwardsSection = ({ awards }: PersonageAwardsSectionProps) => {
  if (!awards) {
    return null;
  }

  return (
    <Section
      id="atv-personage-awards"
      {...(awards.allAwardsHref
        ? {
            moreLink: {
              href: awards.allAwardsHref,
              text: "查看全部 →",
            },
          }
        : {})}
      title="获奖"
    >
      {awards.awards.length ? (
        <ul class="atv-personage-awards-list">
          {awards.awards.map((award) => (
            <li key={`${award.year}-${award.ceremony}-${award.award}`}>
              <time class="atv-personage-award-year">{award.year}</time>
              <div class="atv-personage-award-detail">
                <span class="atv-personage-award-ceremony">
                  <AwardLink href={award.ceremonyHref}>
                    {award.ceremony}
                  </AwardLink>
                </span>
                <p class="atv-personage-award-name">{award.award}</p>
                {award.work ? (
                  <p class="atv-personage-award-work">
                    <AwardLink href={award.workHref}>{award.work}</AwardLink>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p class="atv-personage-awards-empty">暂无公开获奖记录</p>
      )}
    </Section>
  );
};

export { PersonageAwardsSection };
export type { PersonageAwardsSectionProps };
