import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

import { SafeImage } from "@/shared/components/common/safe-image";

import type { PersonageProfile } from "../domain";

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

const computeStatsKicker = (profile: PersonageProfile): string | null => {
  const totalWorks =
    profile.recentWorks?.totalCount ??
    profile.representativeWorks?.totalCount ??
    0;
  const totalAwards =
    profile.awards?.totalCount ?? profile.awards?.awards.length ?? 0;

  if (totalWorks === 0 && totalAwards === 0) {
    return null;
  }

  const parts: string[] = [];
  if (totalWorks > 0) {
    parts.push(`${totalWorks} 部作品`);
  }
  if (totalAwards > 0) {
    parts.push(`${totalAwards} 项荣誉`);
  }

  return parts.join(" · ");
};

type PersonageHeroProps = {
  profile: PersonageProfile;
  onOpenPortrait: (src: string, alt: string) => void;
};

type PersonageHeroPortraitProps = {
  portrait: string;
  primaryName: string;
  onOpenPortrait: (src: string, alt: string) => void;
};

const PersonageHeroPortrait = ({
  portrait,
  primaryName,
  onOpenPortrait,
}: PersonageHeroPortraitProps) => {
  const handleClick = () => {
    onOpenPortrait(portrait, `${primaryName}的头像`);
  };

  const handleKeyDown = (event: globalThis.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      aria-label={`查看${primaryName}的头像`}
      class="atv-personage-portrait-trigger atv-image-preview-trigger"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      type="button"
    >
      <SafeImage
        alt=""
        className="atv-personage-portrait"
        fallback={
          <div aria-hidden="true" class="atv-personage-portrait is-empty" />
        }
        loading="eager"
        src={portrait}
      />
    </button>
  );
};

type PersonageBiographyProps = {
  biography: string[];
  canExpand: boolean;
  contentRef: { current: HTMLDivElement | null };
  isExpanded: boolean;
  setIsExpanded: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const PersonageBiography = ({
  biography,
  canExpand,
  contentRef,
  isExpanded,
  setIsExpanded,
}: PersonageBiographyProps) => (
  <div class="atv-personage-biography">
    <div
      class={`atv-personage-biography-content ${
        canExpand && !isExpanded ? "is-clamped" : "is-expanded"
      }`}
      ref={contentRef}
    >
      {biography.map((paragraph, index) => (
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
);

const PersonageHero = ({ profile, onOpenPortrait }: PersonageHeroProps) => {
  const { canExpand, contentRef, isExpanded, setIsExpanded } =
    useBiographyDisclosure(profile.biography);
  const { originalName, primaryName } = splitPersonageName(profile.name);

  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsRevealed(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const statsKicker = computeStatsKicker(profile);

  return (
    <section class={`atv-personage-hero${isRevealed ? " is-revealed" : ""}`}>
      <div class="atv-personage-hero-inner">
        {profile.portrait ? (
          <PersonageHeroPortrait
            portrait={profile.portrait}
            primaryName={primaryName}
            onOpenPortrait={onOpenPortrait}
          />
        ) : (
          <div aria-hidden="true" class="atv-personage-portrait is-empty" />
        )}

        <div class="atv-personage-identity">
          {statsKicker ? (
            <p class="atv-personage-kicker">{statsKicker}</p>
          ) : null}
          <h1>{primaryName}</h1>
          {originalName ? (
            <p class="atv-personage-original-name">{originalName}</p>
          ) : null}

          {profile.facts.length > 0 ? (
            <dl class="atv-personage-facts">
              {profile.facts.map((fact, index) => (
                <div key={fact.label} style={{ "--fact-index": String(index) }}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {profile.biography?.length ? (
            <PersonageBiography
              biography={profile.biography}
              canExpand={canExpand}
              contentRef={contentRef}
              isExpanded={isExpanded}
              setIsExpanded={setIsExpanded}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};

export { PersonageHero };
export type { PersonageHeroProps };
