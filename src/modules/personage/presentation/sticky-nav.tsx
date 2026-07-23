import { StickyNav } from "@/shared/components/layout";
import type { StickyNavigation } from "@/shared/hooks/use-sticky-navigation";

type PersonageStickyNavProps = StickyNavigation & {
  name: string;
};

const PersonageStickyNav = ({
  name,
  ...navigation
}: PersonageStickyNavProps) => <StickyNav {...navigation} title={name} />;

export { PersonageStickyNav };
export type { PersonageStickyNavProps };
