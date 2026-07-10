import type { JSX, SVGAttributes } from "preact";

import {
  LogoAppleTv,
  LogoBilibiliCombined,
  LogoHbo,
  LogoHboMax,
  LogoIqiyiCombined,
  LogoNetflix,
  LogoParamountPlus,
  LogoTencentCombined,
  LogoTubi,
  LogoVimeo,
  LogoYoukuCombined,
  LogoYouTube,
} from "@/components/common/icons";
import type { Streaming } from "@/types";

type StreamingProviderKey =
  | "apple-tv"
  | "bilibili"
  | "hbo"
  | "hbo-max"
  | "iqiyi"
  | "migu"
  | "netflix"
  | "paramount-plus"
  | "tencent-video"
  | "tubi"
  | "vimeo"
  | "youku"
  | "youtube"
  | "unknown";

type ProviderIconProps = SVGAttributes<SVGSVGElement>;

type StreamingProvider = {
  key: StreamingProviderKey;
  label: string;
  color: string;
  aliases: string[];
  hosts: string[];
  Icon?: (props: ProviderIconProps) => JSX.Element;
  combinedSvg?: boolean;
};

type ResolvedStreamingProvider = {
  key: StreamingProviderKey;
  label: string;
  color: string;
  Icon?: (props: ProviderIconProps) => JSX.Element;
  combinedSvg?: boolean;
};

const UNKNOWN_PROVIDER_COLOR = "#41be5d";

const PROVIDERS: StreamingProvider[] = [
  {
    Icon: LogoBilibiliCombined,
    aliases: ["哔哩哔哩", "bilibili", "b站", "b 站"],
    color: "#FF5588",
    combinedSvg: true,
    hosts: ["bilibili.com"],
    key: "bilibili",
    label: "哔哩哔哩",
  },
  {
    Icon: LogoIqiyiCombined,
    aliases: ["爱奇艺", "iqiyi", "iQIYI"],
    color: "#00DC5A",
    combinedSvg: true,
    hosts: ["iqiyi.com"],
    key: "iqiyi",
    label: "爱奇艺",
  },
  {
    Icon: LogoTencentCombined,
    aliases: ["腾讯视频", "tencent video"],
    color: "#00A2FF",
    combinedSvg: true,
    hosts: ["v.qq.com"],
    key: "tencent-video",
    label: "腾讯视频",
  },
  {
    Icon: LogoYoukuCombined,
    aliases: ["优酷", "youku"],
    color: "#00A6FF",
    combinedSvg: true,
    hosts: ["youku.com"],
    key: "youku",
    label: "优酷",
  },
  {
    aliases: ["咪咕视频", "咪咕", "migu"],
    color: "#F04B23",
    hosts: ["miguvideo.com", "migu.cn"],
    key: "migu",
    label: "咪咕视频",
  },
  {
    Icon: LogoNetflix,
    aliases: ["netflix"],
    color: "#E50914",
    hosts: ["netflix.com"],
    key: "netflix",
    label: "Netflix",
  },
  {
    Icon: LogoYouTube,
    aliases: ["youtube", "youtube tv"],
    color: "#FF0000",
    hosts: ["youtube.com", "youtu.be"],
    key: "youtube",
    label: "YouTube",
  },
  {
    Icon: LogoAppleTv,
    aliases: ["apple tv", "apple tv+"],
    color: "#F5F5F7",
    hosts: ["tv.apple.com"],
    key: "apple-tv",
    label: "Apple TV",
  },
  {
    Icon: LogoHbo,
    aliases: ["hbo"],
    color: "#F5F5F7",
    hosts: ["hbo.com"],
    key: "hbo",
    label: "HBO",
  },
  {
    Icon: LogoHboMax,
    aliases: ["hbo max", "max"],
    color: "#8A7CFF",
    hosts: ["max.com", "hbomax.com"],
    key: "hbo-max",
    label: "HBO Max",
  },
  {
    Icon: LogoParamountPlus,
    aliases: ["paramount+"],
    color: "#0064FF",
    hosts: ["paramountplus.com"],
    key: "paramount-plus",
    label: "Paramount+",
  },
  {
    Icon: LogoTubi,
    aliases: ["tubi"],
    color: "#7408FF",
    hosts: ["tubi.tv"],
    key: "tubi",
    label: "Tubi",
  },
  {
    Icon: LogoVimeo,
    aliases: ["vimeo"],
    color: "#1AB7EA",
    hosts: ["vimeo.com"],
    key: "vimeo",
    label: "Vimeo",
  },
];

const normalizeText = (value: string): string =>
  value.toLowerCase().replaceAll(/\s+/gu, "");

const decodeStreamingHref = (href: string): string => {
  try {
    const url = new URL(href);
    const wrapped = url.searchParams.get("url");
    return wrapped || href;
  } catch {
    return href;
  }
};

const hostMatches = (href: string, provider: StreamingProvider): boolean => {
  const decoded = decodeStreamingHref(href);
  try {
    const host = new URL(decoded).hostname.replace(/^www\./u, "");
    return provider.hosts.some((providerHost) => host.endsWith(providerHost));
  } catch {
    return provider.hosts.some((providerHost) =>
      decoded.includes(providerHost)
    );
  }
};

const nameMatches = (name: string, provider: StreamingProvider): boolean => {
  const normalized = normalizeText(name);
  return provider.aliases.some((alias) =>
    normalized.includes(normalizeText(alias))
  );
};

const resolveStreamingProvider = (
  item: Streaming
): ResolvedStreamingProvider => {
  const provider = PROVIDERS.find(
    (candidate) =>
      nameMatches(item.name, candidate) || hostMatches(item.href, candidate)
  );

  if (provider) {
    const { Icon, color, key, label, combinedSvg } = provider;
    return { Icon, color, combinedSvg, key, label };
  }

  return {
    color: UNKNOWN_PROVIDER_COLOR,
    key: "unknown",
    label: item.name,
  };
};

export { decodeStreamingHref, resolveStreamingProvider };
