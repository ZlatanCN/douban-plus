import type {
  DiscussionActivity,
  DiscussionAuthor,
  DiscussionData,
} from "@/modules/subject/domain";
import { Section } from "@/shared/components/layout/section";

import { getSubjectSectionCopy } from "../navigation/section-copy";

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

const DiscussionsSection = ({ discussions }: DiscussionsSectionProps) =>
  discussions.topics.length ? (
    <Section
      id="atv-discussions"
      {...(discussions.allDiscussions
        ? {
            moreLink: {
              href: discussions.allDiscussions.href,
              text: "查看全部 →",
            },
          }
        : {})}
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
              <div class="atv-discussion-title-row">
                <h3 class="atv-discussion-title">{topic.title}</h3>
                <span aria-hidden="true" class="atv-discussion-arrow">
                  ↗
                </span>
              </div>
              <DiscussionMetadata
                {...(topic.activity ? { activity: topic.activity } : {})}
                {...(topic.author ? { author: topic.author } : {})}
                {...(topic.replies === undefined
                  ? {}
                  : { replies: topic.replies })}
              />
            </div>
          </article>
        ))}
      </div>
    </Section>
  ) : null;

export { DiscussionsSection };
export type { DiscussionsSectionProps };
