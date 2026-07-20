import { useLayoutEffect, useState } from "preact/hooks";

import { extractPersonageProfile } from "@/modules/personage/extract";
import { PersonagePage } from "@/modules/personage/personage";
import type { PersonageProfile } from "@/modules/personage/types";

type PersonagePageRuntimeProps = {
  doc: Document;
  initialProfile: PersonageProfile;
};

const isWorkSourceOrDescendant = (node: Node): boolean => {
  if (!(node instanceof Element)) {
    return false;
  }

  return (
    node.matches(".subject-creations") ||
    node.closest(".subject-creations") !== null ||
    node.querySelector(".subject-creations") !== null
  );
};

const hasWorkSourceMutation = (mutations: MutationRecord[]): boolean =>
  mutations.some(
    (mutation) =>
      isWorkSourceOrDescendant(mutation.target) ||
      [...mutation.addedNodes].some(isWorkSourceOrDescendant)
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

    refreshProfile();
    const observer = new MutationObserver((mutations) => {
      if (hasWorkSourceMutation(mutations)) {
        refreshProfile();
      }
    });
    observer.observe(doc.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [doc]);

  return <PersonagePage profile={profile} />;
};

export { PersonagePageRuntime };
export type { PersonagePageRuntimeProps };
