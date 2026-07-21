import { ModalSession, PosterModal } from "@/components/modal";
import type { ImageModalSource } from "@/components/modal";
import { useModalRequest } from "@/hooks/use-modal-request";

import { PersonageAwardsSection } from "./awards";
import { PersonageCollaborators } from "./collaborators";
import { PersonageGallerySection } from "./gallery";
import { PersonageHero } from "./hero";
import { PersonageTimeline } from "./timeline";
import type { PersonageProfile } from "./types";
import { PersonageWorkRail } from "./works";

type PersonagePageProps = {
  profile: PersonageProfile;
};

type ActivePersonageImage = ImageModalSource;

const extractPrimaryName = (name: string): string => {
  const originalNameStart = name.search(/\p{Script=Latin}/u);
  if (originalNameStart <= 0) {
    return name;
  }
  return name.slice(0, originalNameStart).trim();
};

const PersonagePage = ({ profile }: PersonagePageProps) => {
  const activeImage = useModalRequest<ActivePersonageImage>();
  const primaryName = extractPrimaryName(profile.name);

  const handleOpenPortrait = (src: string, alt: string) => {
    activeImage.handleOpen({ alt, src });
  };

  return (
    <>
      <main class="atv-personage">
        <PersonageHero profile={profile} onOpenPortrait={handleOpenPortrait} />
        <PersonageAwardsSection awards={profile.awards} />
        <PersonageTimeline
          id="atv-personage-recent-works"
          rail={profile.recentWorks}
          title="近作"
        />
        <PersonageWorkRail
          id="atv-personage-representative-works"
          rail={profile.representativeWorks}
          title="作品选"
        />
        <PersonageCollaborators collaborators={profile.collaborators} />
        <PersonageGallerySection
          gallery={profile.gallery}
          name={primaryName}
          onOpenImage={activeImage.handleOpen}
        />
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
