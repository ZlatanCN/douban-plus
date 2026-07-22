import { useLayoutEffect, useState } from "preact/hooks";

import type { PersonageProfile } from "@/modules/personage/domain";
import { extractPersonageProfile } from "@/modules/personage/extract/profile";
import { PersonagePage } from "@/modules/personage/presentation/page";

type PersonageProfileAdoptionProps = {
  doc: Document;
  initialProfile: PersonageProfile;
};

const isBiographyExpansionPending = (doc: Document): boolean =>
  [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].some((element) => element.textContent?.includes("展开"));

const adoptPersonageProfile = (doc: Document): PersonageProfile | null => {
  const initialProfile = extractPersonageProfile(doc);
  if (!initialProfile || !isBiographyExpansionPending(doc)) {
    return initialProfile;
  }

  const trigger = [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].find((element) => element.textContent?.includes("展开"));
  trigger?.click();

  return isBiographyExpansionPending(doc) ? null : extractPersonageProfile(doc);
};

const adoptPersonageProfileWhenReady = (
  doc: Document,
  onAdopted: (profile: PersonageProfile) => void
): void => {
  const adopt = () => {
    const profile = adoptPersonageProfile(doc);
    if (profile) {
      onAdopted(profile);
    }
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

const PersonageProfileAdoption = ({
  doc,
  initialProfile,
}: PersonageProfileAdoptionProps) => {
  const [profile, setProfile] = useState(initialProfile);

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

  return <PersonagePage profile={profile} />;
};

export { adoptPersonageProfileWhenReady, PersonageProfileAdoption };
export type { PersonageProfileAdoptionProps };
