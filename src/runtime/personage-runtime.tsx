import { useLayoutEffect, useState } from "preact/hooks";

import { extractPersonageProfile } from "@/modules/personage/extract";
import { PersonagePage } from "@/modules/personage/personage";
import type { PersonageProfile } from "@/modules/personage/types";

type PersonagePageRuntimeProps = {
  doc: Document;
  initialProfile: PersonageProfile;
};

const isDynamicPersonageSourceOrDescendant = (node: Node): boolean => {
  if (!(node instanceof Element)) {
    return false;
  }

  return (
    node.matches(".subject-awards, .subject-creations, .subject-intro") ||
    node.closest(".subject-awards, .subject-creations, .subject-intro") !==
      null ||
    node.querySelector(
      ".subject-awards, .subject-creations, .subject-intro"
    ) !== null
  );
};

const expandNativeBiography = (doc: Document): void => {
  const trigger = [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].find((element) => element.textContent?.includes("展开"));

  trigger?.click();
};

const hasDynamicPersonageSourceMutation = (
  mutations: MutationRecord[]
): boolean =>
  mutations.some(
    (mutation) =>
      isDynamicPersonageSourceOrDescendant(mutation.target) ||
      [...mutation.addedNodes].some(isDynamicPersonageSourceOrDescendant)
  );

const PersonagePageRuntime = ({
  doc,
  initialProfile,
}: PersonagePageRuntimeProps) => {
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
    expandNativeBiography(doc);
    refreshProfile();

    return () => observer.disconnect();
  }, [doc]);

  return <PersonagePage profile={profile} />;
};

export { PersonagePageRuntime };
export type { PersonagePageRuntimeProps };
