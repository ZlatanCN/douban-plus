import { useLayoutEffect, useMemo, useState } from "preact/hooks";

import type { PersonageProfile } from "@/modules/personage/domain";
import { extractPersonageProfile } from "@/modules/personage/extract/profile";
import { PersonagePage } from "@/modules/personage/presentation/page";
import { PERSONAGE_SECTIONS } from "@/modules/personage/section-identity";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";
import type { StickyNavigationSection } from "@/shared/hooks/use-sticky-navigation";

type PersonageProfileAdoptionProps = {
  doc: Document;
  initialProfile: PersonageProfile;
};

const isBiographyExpansionPending = (doc: Document): boolean =>
  [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].some((element) => element.textContent?.includes("展开"));

const waitForExpandedBiography = (
  doc: Document,
  onExpanded: (profile: PersonageProfile) => void
): void => {
  const source = doc.querySelector(".subject-intro");
  const view = doc.defaultView;
  if (!source || !view) {
    return;
  }

  let frame: number | null = null;
  let observer: MutationObserver | null = null;

  const finishAdoption = () => {
    frame = null;
    observer?.disconnect();
    if (isBiographyExpansionPending(doc)) {
      return;
    }

    const profile = extractPersonageProfile(doc);
    if (profile) {
      onExpanded(profile);
    }
  };

  const scheduleAdoption = () => {
    if (frame !== null) {
      view.cancelAnimationFrame(frame);
    }
    frame = view.requestAnimationFrame(finishAdoption);
  };

  observer = new MutationObserver(scheduleAdoption);
  observer.observe(source, {
    characterData: true,
    childList: true,
    subtree: true,
  });
  scheduleAdoption();
};

const adoptPersonageProfileWhenReady = (
  doc: Document,
  onAdopted: (profile: PersonageProfile) => void
): void => {
  const adopt = () => {
    const initialProfile = extractPersonageProfile(doc);
    if (!initialProfile) {
      return;
    }
    if (!isBiographyExpansionPending(doc)) {
      onAdopted(initialProfile);
      return;
    }

    const trigger = [
      ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
    ].find((element) => element.textContent?.includes("展开"));
    waitForExpandedBiography(doc, onAdopted);
    trigger?.click();
  };

  if (doc.readyState === "complete" || !isBiographyExpansionPending(doc)) {
    adopt();
    return;
  }

  const view = doc.defaultView;
  if (!view) {
    adopt();
    return;
  }

  view.addEventListener("load", adopt, { once: true });
};

const isDynamicPersonageSourceOrDescendant = (node: Node): boolean => {
  if (!(node instanceof Element)) {
    return false;
  }

  return (
    node.matches(".subject-awards, .subject-creations") ||
    node.closest(".subject-awards, .subject-creations") !== null ||
    node.querySelector(".subject-awards, .subject-creations") !== null
  );
};

const hasDynamicPersonageSourceMutation = (
  mutations: MutationRecord[]
): boolean =>
  mutations.some(
    (mutation) =>
      isDynamicPersonageSourceOrDescendant(mutation.target) ||
      [...mutation.addedNodes].some(isDynamicPersonageSourceOrDescendant)
  );

const computePersonageNavSections = (
  profile: PersonageProfile
): StickyNavigationSection[] =>
  PERSONAGE_SECTIONS.filter((entry) => entry.visible(profile)).map((entry) => ({
    id: entry.id,
    label: entry.navLabel(profile),
  }));

const PersonageProfileAdoption = ({
  doc,
  initialProfile,
}: PersonageProfileAdoptionProps) => {
  const [profile, setProfile] = useState(initialProfile);
  const sections = useMemo(
    () => computePersonageNavSections(profile),
    [profile]
  );
  const navigation = useStickyNavigation(doc, sections);

  useLayoutEffect(() => {
    const refreshProfile = () => {
      const nextProfile = extractPersonageProfile(doc);
      if (nextProfile) {
        setProfile(nextProfile);
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (hasDynamicPersonageSourceMutation(mutations)) {
        refreshProfile();
      }
    });
    observer.observe(doc.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [doc]);

  return (
    <PersonagePage
      navigation={sections.length > 0 ? navigation : undefined}
      profile={profile}
    />
  );
};

export { adoptPersonageProfileWhenReady, PersonageProfileAdoption };
export type { PersonageProfileAdoptionProps };
