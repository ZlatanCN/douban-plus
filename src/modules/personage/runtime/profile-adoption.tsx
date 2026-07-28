import { useLayoutEffect, useMemo, useState } from "preact/hooks";

import type { PersonageProfile } from "@/modules/personage/domain";
import { extractPersonageProfile } from "@/modules/personage/extract/profile";
import { PersonagePage } from "@/modules/personage/presentation/page";
import { PERSONAGE_SECTIONS } from "@/modules/personage/section-identity";
import { useStickyNavigation } from "@/shared/hooks/use-sticky-navigation";
import type { StickyNavigationSection } from "@/shared/hooks/use-sticky-navigation";

type PersonageProfileAdoptionProps = {
  doc: Document;
  profile: PersonageProfile;
};

const biographyExpansionRetryDelay = 50;
const biographyExpansionMaxAttempts = 40;

const isBiographyExpansionPending = (doc: Document): boolean =>
  [
    ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
  ].some((element) => element.textContent?.includes("展开"));

const computePersonageNavSections = (
  profile: PersonageProfile
): StickyNavigationSection[] =>
  PERSONAGE_SECTIONS.filter((entry) => entry.visible(profile)).map((entry) => ({
    id: entry.id,
    label: entry.navLabel(profile),
  }));

const PersonageProfileAdoption = ({
  doc,
  profile: initialProfile,
}: PersonageProfileAdoptionProps) => {
  const [profile, setProfile] = useState(initialProfile);
  const biographyKey = profile.biography?.join("\n") ?? "";
  const sections = useMemo(
    () => computePersonageNavSections(profile),
    [profile]
  );
  const navigation = useStickyNavigation(doc, sections);
  // Douban registers the delegated fold handler asynchronously. Keep retries
  // short and bounded so an early click cannot leave the Hero empty forever.
  useLayoutEffect(() => {
    const view = doc.defaultView;
    if (!view) {
      return;
    }

    let retryTimer: number | undefined;
    let attempts = 0;
    const refreshProfile = () => {
      const nextProfile = extractPersonageProfile(doc);
      if (nextProfile) {
        setProfile(nextProfile);
      }
    };
    const tryExpand = () => {
      const foldSwitch = [
        ...doc.querySelectorAll<HTMLAnchorElement>(
          ".subject-intro .fold-switch"
        ),
      ].find((element) => element.textContent?.includes("展开"));

      if (!foldSwitch) {
        return;
      }

      foldSwitch.click();

      if (!isBiographyExpansionPending(doc)) {
        refreshProfile();
        return;
      }

      attempts += 1;
      if (attempts < biographyExpansionMaxAttempts) {
        retryTimer = view.setTimeout(tryExpand, biographyExpansionRetryDelay);
      }
    };
    const frame = view.requestAnimationFrame(tryExpand);

    return () => {
      view.cancelAnimationFrame(frame);
      clearTimeout(retryTimer);
    };
  }, [biographyKey, doc]);

  // Observe ALL dynamic content via body-level mutation watcher,
  // skipping mutations inside our own enhanced DOM
  useLayoutEffect(() => {
    let timer: number | undefined;

    const refreshProfile = () => {
      const nextProfile = extractPersonageProfile(doc);
      if (nextProfile) {
        setProfile(nextProfile);
      }
    };

    const observer = new MutationObserver((mutations) => {
      const hasNativeMutation = mutations.some(
        (mutation) =>
          !(
            mutation.target instanceof Element &&
            mutation.target.closest("#atv-douban-root")
          )
      );
      if (!hasNativeMutation) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(refreshProfile, 200) as unknown as number;
    });

    observer.observe(doc.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [doc]);

  return (
    <PersonagePage
      navigation={sections.length > 0 ? navigation : undefined}
      profile={profile}
    />
  );
};

export { PersonageProfileAdoption };
export type { PersonageProfileAdoptionProps };
