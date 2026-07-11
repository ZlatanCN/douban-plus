import { Section } from "@/components/layout/section";
import type { DiscussionData } from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type DiscussionsSectionProps = {
  discussions: DiscussionData;
};

const DiscussionsSection = ({ discussions }: DiscussionsSectionProps) =>
  discussions.topics.length ? (
    <Section
      id="atv-discussions"
      title={getSubjectSectionCopy("discussions").sectionTitle}
    >
      <div class="atv-discussion-board">
        {discussions.topics.map((topic, index) => (
          <article class="atv-discussion-row" key={`${topic.href}-${index}`}>
            <a
              aria-label={`打开讨论：${topic.title}`}
              class="atv-discussion-topic-link"
              href={topic.href}
              rel="noopener"
              target="_blank"
            />
            <h3 class="atv-discussion-title">{topic.title}</h3>
            <span aria-hidden="true" class="atv-discussion-arrow">
              ↗
            </span>
          </article>
        ))}
      </div>
    </Section>
  ) : null;

export { DiscussionsSection };
export type { DiscussionsSectionProps };
