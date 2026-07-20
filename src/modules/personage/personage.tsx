import { useLayoutEffect, useRef, useState } from "preact/hooks";

import { ModalSession, PosterModal } from "@/components/modal";
import type { ImageModalSource } from "@/components/modal";
import { useModalRequest } from "@/hooks/use-modal-request";

import { PersonageAwardsSection } from "./awards";
import { PersonageCollaborators } from "./collaborators";
import { PersonageGallerySection } from "./gallery";
import type { PersonageProfile } from "./types";
import { PersonageWorkRail } from "./works";

type PersonagePageProps = {
  profile: PersonageProfile;
};

type ActivePersonageImage = ImageModalSource;

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

const biographyPreviewLineCount = 3;

const useBiographyDisclosure = (biography: string[] | null) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const biographyKey = biography?.join("\n") ?? "";
  const previousBiographyKeyRef = useRef(biographyKey);
  const [canExpand, setCanExpand] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useLayoutEffect(() => {
    if (previousBiographyKeyRef.current !== biographyKey) {
      previousBiographyKeyRef.current = biographyKey;
      setCanExpand(false);
      setIsExpanded(false);
    }
  }, [biographyKey]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !biographyKey) {
      setCanExpand(false);
      setIsExpanded(false);
      return;
    }

    if (canExpand) {
      return;
    }

    const measureOverflow = () => {
      const lineHeight = Number(
        window.getComputedStyle(content).lineHeight.replace("px", "")
      );
      const fullHeight = content.scrollHeight;
      const hasHiddenContent =
        Number.isFinite(lineHeight) &&
        fullHeight > lineHeight * biographyPreviewLineCount + 1;

      setCanExpand(hasHiddenContent);
      if (!hasHiddenContent) {
        setIsExpanded(false);
      }
    };

    measureOverflow();
    const frame = window.requestAnimationFrame(measureOverflow);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureOverflow);
    observer?.observe(content);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [biographyKey, canExpand]);

  return { canExpand, contentRef, isExpanded, setIsExpanded };
};

const PersonagePage = ({ profile }: PersonagePageProps) => {
  const { canExpand, contentRef, isExpanded, setIsExpanded } =
    useBiographyDisclosure(profile.biography);
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
                <div
                  class={`atv-personage-biography-content ${
                    canExpand && !isExpanded ? "is-clamped" : "is-expanded"
                  }`}
                  ref={contentRef}
                >
                  {profile.biography.map((paragraph, index) => (
                    <p key={`${index}-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                {canExpand ? (
                  <button
                    aria-expanded={isExpanded}
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    type="button"
                  >
                    {isExpanded ? "收起" : "展开"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        <PersonageCollaborators collaborators={profile.collaborators} />
        <PersonageGallerySection
          gallery={profile.gallery}
          name={primaryName}
          onOpenImage={activeImage.handleOpen}
        />
        <PersonageWorkRail
          id="atv-personage-recent-works"
          rail={profile.recentWorks}
          title="近期作品"
        />
        <PersonageWorkRail
          id="atv-personage-representative-works"
          rail={profile.representativeWorks}
          title="代表作品"
        />
        <PersonageAwardsSection awards={profile.awards} />
      </main>
      {activeImage.active ? (
        <ModalSession request={activeImage.active}>
          <PosterModal
            alt={activeImage.active.value.alt}
            onClose={activeImage.handleClose}
            {...(activeImage.active.value.previewSrc
              ? { previewSrc: activeImage.active.value.previewSrc }
              : {})}
            src={activeImage.active.value.src}
          />
        </ModalSession>
      ) : null}
    </>
  );
};

export { PersonagePage };
export type { PersonagePageProps };
