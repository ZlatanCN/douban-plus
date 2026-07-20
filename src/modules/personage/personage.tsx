import { useState } from "preact/hooks";

import { ModalSession, PosterModal } from "@/components/modal";
import { useModalRequest } from "@/hooks/use-modal-request";

import { PersonageGallerySection } from "./gallery";
import type { PersonageProfile } from "./types";

type PersonagePageProps = {
  profile: PersonageProfile;
};

type ActivePersonageImage = {
  alt: string;
  src: string;
};

const splitPersonageName = (name: string) => {
  const originalNameStart = name.search(/\p{Script=Latin}/u);
  if (originalNameStart <= 0) {
    return { originalName: null, primaryName: name };
  }

  return {
    originalName: name.slice(originalNameStart).trim(),
    primaryName: name.slice(0, originalNameStart).trim(),
  };
};

const PersonagePage = ({ profile }: PersonagePageProps) => {
  const [biographyExpanded, setBiographyExpanded] = useState(false);
  const activeImage = useModalRequest<ActivePersonageImage>();
  const { originalName, primaryName } = splitPersonageName(profile.name);

  return (
    <>
      <main class="atv-personage">
        <section class="atv-personage-hero">
          {profile.portrait ? (
            <button
              aria-label={`查看${primaryName}的头像`}
              class="atv-personage-portrait-trigger"
              onClick={() =>
                activeImage.handleOpen({
                  alt: `${primaryName}的头像`,
                  src: profile.portrait ?? "",
                })
              }
              type="button"
            >
              <img
                alt=""
                class="atv-personage-portrait"
                src={profile.portrait}
              />
            </button>
          ) : (
            <div aria-hidden="true" class="atv-personage-portrait is-empty" />
          )}
          <div class="atv-personage-identity">
            <p class="atv-personage-kicker">人物</p>
            <h1>{primaryName}</h1>
            {originalName ? (
              <p class="atv-personage-original-name">{originalName}</p>
            ) : null}
            {profile.facts.length > 0 ? (
              <dl class="atv-personage-facts">
                {profile.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {profile.biography?.length ? (
              <div class="atv-personage-biography">
                <div class={biographyExpanded ? "is-expanded" : "is-clamped"}>
                  {profile.biography.map((paragraph, index) => (
                    <p key={`${index}-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <button
                  aria-expanded={biographyExpanded}
                  onClick={() => setBiographyExpanded((expanded) => !expanded)}
                  type="button"
                >
                  {biographyExpanded ? "收起" : "展开"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
        <PersonageGallerySection
          gallery={profile.gallery}
          name={primaryName}
          onOpenImage={(src, alt) => activeImage.handleOpen({ alt, src })}
        />
      </main>
      {activeImage.active ? (
        <ModalSession request={activeImage.active}>
          <PosterModal
            alt={activeImage.active.value.alt}
            onClose={activeImage.handleClose}
            src={activeImage.active.value.src}
          />
        </ModalSession>
      ) : null}
    </>
  );
};

export { PersonagePage };
export type { PersonagePageProps };
