import { SafeImage } from "@/components/common/safe-image";
import { Section } from "@/components/layout/section";

import type { PersonageCollaborators as PersonageCollaboratorsData } from "./types";

type PersonageCollaboratorsProps = {
  collaborators: PersonageCollaboratorsData | null;
};

const PersonageCollaborators = ({
  collaborators,
}: PersonageCollaboratorsProps) => {
  if (!collaborators?.collaborators.length) {
    return null;
  }

  const { allCollaboratorsHref, collaborators: entries } = collaborators;
  const title = "合作";

  return (
    <Section
      id="atv-personage-collaborators"
      title={title}
      {...(allCollaboratorsHref
        ? { moreLink: { href: allCollaboratorsHref, text: "查看全部 →" } }
        : {})}
    >
      <ol class="atv-personage-collaborators">
        {entries.map((collaborator, index) => (
          <li
            class="atv-personage-collaborator"
            data-leading={index === 0 ? "true" : undefined}
            key={collaborator.href}
            style={{ "--stagger-index": String(index) }}
          >
            <span aria-hidden="true" class="atv-personage-collaborator-rank">
              {index + 1}
            </span>
            {collaborator.avatar ? (
              <SafeImage
                alt=""
                className="atv-personage-collaborator-avatar"
                fallback={
                  <span
                    aria-hidden="true"
                    class="atv-personage-collaborator-avatar is-fallback"
                  >
                    {collaborator.name.slice(0, 1)}
                  </span>
                }
                src={collaborator.avatar}
              />
            ) : (
              <span
                aria-hidden="true"
                class="atv-personage-collaborator-avatar is-fallback"
              >
                {collaborator.name.slice(0, 1)}
              </span>
            )}
            <div class="atv-personage-collaborator-info">
              <a
                class="atv-personage-collaborator-name"
                href={collaborator.href}
                rel="noopener"
                target="_blank"
              >
                {collaborator.name}
              </a>
              <span class="atv-personage-collaborator-count">
                {collaborator.sharedWorkCount} 次合作
              </span>
            </div>
            {collaborator.sharedWorksHref ? (
              <a
                class="atv-personage-collaborator-action"
                href={collaborator.sharedWorksHref}
                rel="noopener"
                target="_blank"
              >
                查看共同作品
                <span
                  class="atv-personage-collaborator-arrow"
                  aria-hidden="true"
                >
                  {" "}
                  ↗
                </span>
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </Section>
  );
};

export { PersonageCollaborators };
export type { PersonageCollaboratorsProps };
