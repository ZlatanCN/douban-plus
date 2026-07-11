import type { JSX } from "preact";

import { findPlatformBrandByExactName } from "@/components/common/platform-brand";

const IconBroadcast = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <rect
      fill="none"
      height="14"
      rx="2"
      stroke="currentColor"
      stroke-width="1.8"
      width="19"
      x="2.5"
      y="3.5"
    />
    <path
      d="m9 8 6 2.5L9 13Z"
      fill="currentColor"
      stroke="currentColor"
      stroke-linejoin="round"
      stroke-width="1"
    />
    <path
      d="M8.5 20.5h7"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="1.8"
    />
  </svg>
);

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
  const Icon = brand?.Icon;

  return (
    <div
      aria-label={`首播平台：${platform}`}
      class="atv-first-broadcast-platform"
      data-provider={brand?.key ?? "unknown"}
    >
      <span
        aria-hidden="true"
        class={`atv-first-broadcast-platform-mark${
          brand?.presentation === "wordmark" ? " is-wordmark" : ""
        }`}
        style={{ color: brand?.color ?? "#fff" }}
      >
        {Icon ? <Icon /> : <IconBroadcast />}
      </span>
      <span class="atv-first-broadcast-platform-label">首播平台</span>
      <span class="atv-first-broadcast-platform-name">{platform}</span>
    </div>
  );
};

export { FirstBroadcastPlatform };
export type { FirstBroadcastPlatformProps };
