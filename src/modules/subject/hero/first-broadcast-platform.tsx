import type { JSX } from "preact";

import { findPlatformBrandByExactName } from "@/components/common/platform-brand";

type FirstBroadcastPlatformProps = {
  platform: string;
};

const FirstBroadcastPlatform = ({
  platform,
}: FirstBroadcastPlatformProps): JSX.Element => {
  const brand =
    platform
      .split("/")
      .map(findPlatformBrandByExactName)
      .find((candidate) => candidate !== null) ?? null;
  const Icon = brand?.heroIcon ?? brand?.Icon;

  if (!brand || !Icon) {
    return (
      <span
        aria-label={`首播平台：${platform}`}
        class="atv-first-broadcast-platform is-unknown"
        data-provider="unknown"
      >
        首播 · {platform}
      </span>
    );
  }

  return (
    <span
      class="atv-first-broadcast-platform"
      data-provider={brand?.key ?? "unknown"}
    >
      <span
        aria-hidden="true"
        class={`atv-first-broadcast-platform-mark${
          brand.presentation === "wordmark" ? " is-wordmark" : ""
        }${brand.colorMode === "intrinsic" ? " is-intrinsic" : " is-catalog"} is-surface-${brand.surface}`}
        style={{
          color: brand.colorMode === "intrinsic" ? undefined : brand.color,
        }}
      >
        <Icon />
      </span>
      <span class="atv-screen-reader-only">首播平台：{platform}</span>
    </span>
  );
};

export { FirstBroadcastPlatform };
export type { FirstBroadcastPlatformProps };
