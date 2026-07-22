import type { PageMount } from "@/shared/runtime/page-mount";

import {
  isPersonageHomepage,
  mountPersonage as mountPersonagePage,
} from "./runtime/mount";

const personagePage: PageMount = {
  matches: isPersonageHomepage,
  mount: mountPersonagePage,
};

export { mountPersonage } from "./runtime/mount";
export { personagePage };
