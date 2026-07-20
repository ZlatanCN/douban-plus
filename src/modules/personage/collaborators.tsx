import { Section } from "@/components/layout/section";

import type { PersonageCollaborator } from "./types";

type PersonageCollaboratorsProps = {
  collaborators: PersonageCollaborator[] | null;
};

const formatRank = (index: number): string =>
  String(index + 1).padStart(2, "0");

const PersonageCollaborators = ({
  collaborators,
}: PersonageCollaboratorsProps) => {
  if (!collaborators?.length) {
    return null;
  }

  return (
    <Section id="atv-personage-collaborators" title="常合作的人">
      <ol class="atv-personage-collaborators">
        {collaborators.map((collaborator, index) => (
          <li
            class="atv-personage-collaborator"
            data-leading={index === 0 ? "true" : undefined}
            key={collaborator.href}
          >
            <span aria-hidden="true" class="atv-personage-collaborator-rank">
              {formatRank(index)}
            </span>
            {collaborator.avatar ? (
              <img alt="" src={collaborator.avatar} />
            ) : (
              <span
                aria-hidden="true"
                class="atv-personage-collaborator-avatar"
              >
                {collaborator.name.slice(0, 1)}
              </span>
            )}
            <div class="atv-personage-collaborator-identity">
              <h3>{collaborator.name}</h3>
              <p>
                <strong>{collaborator.sharedWorkCount}</strong>
                <span>部共同作品</span>
              </p>
            </div>
            <div class="atv-personage-collaborator-actions">
              {collaborator.sharedWorksHref ? (
                <a
                  href={collaborator.sharedWorksHref}
                  rel="noopener"
                  target="_blank"
                >
                  查看共同作品
                </a>
              ) : null}
              <a href={collaborator.href} rel="noopener" target="_blank">
                查看人物
              </a>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
};

export { PersonageCollaborators };
export type { PersonageCollaboratorsProps };
