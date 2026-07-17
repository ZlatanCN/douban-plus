import { useEffect, useState } from "preact/hooks";

import type { Photo } from "@/types";
import { hashStr } from "@/utils/hash";

type HeroBackgroundProps = {
  photos: Photo[];
  poster: string | null;
  subjectId: string;
};

const pickStill = (photos: Photo[], seed: string): Photo | null => {
  if (!photos.length) {
    return null;
  }
  return photos[hashStr(String(seed || "")) % photos.length] ?? null;
};

const backgroundStyle = (still: Photo | null, poster: string | null) => {
  if (still?.hdUrl || poster) {
    return {};
  }
  return {
    background: "radial-gradient(circle at 30% 30%, #2c2c2e 0%, #000 70%)",
  };
};

const stillBackground = (still: Photo, hdLoaded: boolean) => (
  <>
    <div
      class="atv-hero-still is-thumb"
      style={{
        backgroundImage: `url("${still.thumbUrl || still.hdUrl}")`,
      }}
    />
    <div
      aria-hidden="true"
      class={`atv-hero-still is-hd${hdLoaded ? " is-loaded" : ""}`}
      style={{
        backgroundImage: hdLoaded
          ? `url("${still.hdUrl || still.thumbUrl}")`
          : undefined,
      }}
    />
  </>
);

const posterBackground = (poster: string) => (
  <div
    class="atv-hero-still is-poster"
    style={{ backgroundImage: `url("${poster}")` }}
  />
);

const HeroBackground = ({ photos, poster, subjectId }: HeroBackgroundProps) => {
  const still = pickStill(photos, subjectId);
  const [hdLoaded, setHdLoaded] = useState(false);

  useEffect(() => {
    setHdLoaded(false);
    if (!still?.hdUrl) {
      return;
    }

    const loader = new Image();
    loader.addEventListener(
      "load",
      () => requestAnimationFrame(() => setHdLoaded(true)),
      { once: true }
    );
    loader.addEventListener(
      "error",
      () => {
        if (still.thumbUrl && still.thumbUrl !== still.hdUrl) {
          requestAnimationFrame(() => setHdLoaded(true));
        }
      },
      { once: true }
    );
    loader.src = still.hdUrl;
  }, [still?.hdUrl, still?.thumbUrl]);

  return (
    <div class="atv-hero-bg" style={backgroundStyle(still, poster)}>
      {still?.hdUrl ? stillBackground(still, hdLoaded) : null}
      {!still?.hdUrl && poster ? posterBackground(poster) : null}
    </div>
  );
};

export { HeroBackground, pickStill };
export type { HeroBackgroundProps };
