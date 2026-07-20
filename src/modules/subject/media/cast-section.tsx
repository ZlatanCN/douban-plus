import { Section } from "@/components/layout/section";
import type { Celebrity } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type CastSectionProps = {
  celebrities: Celebrity[];
  subjectId: string;
};

const CastSection = ({ celebrities, subjectId }: CastSectionProps) =>
  celebrities.length ? (
    <Section
      id="atv-cast"
      {...(subjectId
        ? {
            moreLink: {
              href: `https://movie.douban.com/subject/${subjectId}/celebrities`,
              text: "查看全部 →",
            },
          }
        : {})}
      title={getSubjectSectionCopy("cast").sectionTitle}
    >
      <div class="atv-carousel atv-cast-carousel">
        {celebrities.map((person) => {
          const content = (
            <>
              <div
                class="atv-cast-avatar"
                style={
                  person.avatar
                    ? { backgroundImage: `url("${person.avatar}")` }
                    : undefined
                }
              />
              <div class="atv-cast-name">{person.name}</div>
              {person.role ? (
                <div class="atv-cast-role">{person.role}</div>
              ) : null}
            </>
          );

          return person.link ? (
            <a
              class="atv-cast-card"
              href={person.link}
              key={person.link}
              rel="noopener"
              target="_blank"
            >
              {content}
            </a>
          ) : (
            <div class="atv-cast-card" key={person.name}>
              {content}
            </div>
          );
        })}
      </div>
    </Section>
  ) : null;

export { CastSection };
export type { CastSectionProps };
