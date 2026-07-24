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
  const sections = useMemo(
    () => computePersonageNavSections(profile),
    [profile]
  );
  const navigation = useStickyNavigation(doc, sections);
  // Expand truncated biography: defer click to rAF to ensure jQuery's
  // delegate handler is registered, then verify expansion before extracting
  useLayoutEffect(() => {
    if (!isBiographyExpansionPending(doc)) {
      return;
    }

    const foldSwitch = [
      ...doc.querySelectorAll<HTMLAnchorElement>(".subject-intro .fold-switch"),
    ].find((element) => element.textContent?.includes("展开"));

    if (!foldSwitch) {
      return;
    }

    const view = doc.defaultView;
    if (!view) {
      return;
    }

    view.requestAnimationFrame(() => {
      foldSwitch.click();

      // Verify: text changed from "(展开)" to "(折叠)" = expansion succeeded
      if (!isBiographyExpansionPending(doc)) {
        const nextProfile = extractPersonageProfile(doc);
        if (nextProfile) {
          setProfile(nextProfile);
        }
      }
    });
  }, [doc]);

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
      // Skip mutations inside our own enhanced DOM — they don't reflect
      // changes to the native Douban content sections we extract from
      for (const mutation of mutations) {
        if (
          mutation.target instanceof Element &&
          mutation.target.closest("#atv-douban-root")
        ) {
          return;
        }
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
