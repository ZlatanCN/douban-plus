import { StickyNav } from "@/shared/components/layout";

import type { PersonageStickyNavigation } from "../runtime/use-sticky-navigation";

type PersonageStickyNavProps = PersonageStickyNavigation & {
  name: string;
};

const PersonageStickyNav = ({
  name,
  ...navigation
}: PersonageStickyNavProps) => <StickyNav {...navigation} title={name} />;

export { PersonageStickyNav };
export type { PersonageStickyNavProps };
