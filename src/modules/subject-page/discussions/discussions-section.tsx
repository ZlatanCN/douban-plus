import { Section } from "@/components/layout/section";
import type {
  DiscussionActivity,
  DiscussionAuthor,
  DiscussionData,
} from "@/types";

import { getSubjectSectionCopy } from "../section-copy";

type DiscussionsSectionProps = {
  discussions: DiscussionData;
};

const DiscussionAuthorLink = ({ author }: { author: DiscussionAuthor }) =>
  author.href ? (
    <a
      class="atv-discussion-author"
      href={author.href}
      rel="noopener"
      target="_blank"
    >
      {author.name}
    </a>
  ) : (
    <span class="atv-discussion-author">{author.name}</span>
  );

const DiscussionActivityTime = ({
  activity,
}: {
  activity: DiscussionActivity;
}) =>
  activity.date && activity.dateTime && activity.time ? (
    <time
      class="atv-discussion-time"
      dateTime={activity.dateTime}
      title={activity.raw}
    >
      <span>{activity.date}</span>
      <span>{activity.time}</span>
    </time>
  ) : (
    <time class="atv-discussion-time" title={activity.raw}>
      {activity.raw}
    </time>
  );

const DiscussionMetadata = ({
  activity,
  author,
  replies,
}: {
  activity?: DiscussionActivity;
  author?: DiscussionAuthor;
  replies?: number;
}) =>
  author || replies !== undefined || activity ? (
    <div class="atv-discussion-meta">
      {author ? <DiscussionAuthorLink author={author} /> : null}
      {replies !== undefined || activity ? (
        <div class="atv-discussion-activity">
          {replies === undefined ? null : (
            <span class="atv-discussion-replies">{`${replies} 回应`}</span>
          )}
          {activity ? <DiscussionActivityTime activity={activity} /> : null}
        </div>
      ) : null}
    </div>
  ) : null;

const formatDiscussionTotal = (total: number | undefined): string =>
  total === undefined
    ? "查看全部讨论 →"
    : `查看全部 ${total.toLocaleString("en-US")} 条讨论 →`;

const DiscussionsSection = ({ discussions }: DiscussionsSectionProps) =>
  discussions.topics.length ? (
    <Section
      id="atv-discussions"
      moreLink={
        discussions.startDiscussionHref
          ? { href: discussions.startDiscussionHref, text: "发起讨论 ↗" }
          : undefined
      }
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
            <div class="atv-discussion-copy">
              <h3 class="atv-discussion-title">{topic.title}</h3>
              <DiscussionMetadata
                activity={topic.activity}
                author={topic.author}
                replies={topic.replies}
              />
            </div>
            <span aria-hidden="true" class="atv-discussion-arrow">
              ↗
            </span>
          </article>
        ))}
      </div>
      {discussions.allDiscussions ? (
        <footer class="atv-discussion-footer">
          <a
            href={discussions.allDiscussions.href}
            rel="noopener"
            target="_blank"
          >
            {formatDiscussionTotal(discussions.allDiscussions.total)}
          </a>
        </footer>
      ) : null}
    </Section>
  ) : null;

export { DiscussionsSection };
export type { DiscussionsSectionProps };
