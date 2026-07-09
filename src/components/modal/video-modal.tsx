import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

import { useModalClose } from "@/components/modal/modal-close-context";
import type { Trailer } from "@/types";

import { ModalCloseButton } from "./modal-close-button";
import { ModalShell } from "./modal-shell";

const MODAL_ID = "atv-video-modal";
const SPINNER_STYLE_ID = "atv-vs";
const REDIRECT_DELAY_MS = 1500;
const TOAST_DURATION_MS = 3000;

type VideoModalProps = {
  onClose: () => void;
  trailer: Trailer;
};

type VideoState =
  | { status: "loading" }
  | { embedUrl: string; status: "loaded" }
  | { status: "error" };

const ensureVideoStyle = (): void => {
  if (document.querySelector(`#${SPINNER_STYLE_ID}`)) {
    return;
  }
  const style = document.createElement("style");
  style.id = SPINNER_STYLE_ID;
  style.textContent =
    "@keyframes atv-spin{to{transform:rotate(360deg)}}.atv-modal-loading{display:flex;flex-direction:column;align-items:center;gap:16px;color:#fff;font-size:15px}.atv-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#41be5d;border-radius:50%;animation:atv-spin .8s linear infinite}";
  document.head.append(style);
};

const removeExistingVideoModal = (): void => {
  const existing = document.querySelector(`#${MODAL_ID}`);
  const host = existing?.parentElement;
  if (host) {
    render(null, host);
    host.remove();
  } else {
    existing?.remove();
  }
};

const extractEmbedUrl = (html: string): string => {
  const ldMatch = html.match(
    /<script type="application\/ld\+json">(?<json>[\s\S]*?)<\/script>/u
  );
  if (!ldMatch?.groups) {
    throw new Error("no ld+json");
  }
  const data = JSON.parse(ldMatch.groups.json);
  const embedUrl: unknown = data?.embedUrl ?? data?.video?.embedUrl ?? null;
  if (typeof embedUrl !== "string" || !embedUrl) {
    throw new Error("no embedUrl");
  }
  return embedUrl;
};

const VideoModalContent = ({ trailer }: Pick<VideoModalProps, "trailer">) => {
  const close = useModalClose();
  const [state, setState] = useState<VideoState>({ status: "loading" });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(trailer.trailerPageUrl);
        const html = await res.text();
        const embedUrl = extractEmbedUrl(html);
        if (active) {
          setState({ embedUrl, status: "loaded" });
        }
      } catch {
        if (active) {
          setState({ status: "error" });
          setShowToast(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [trailer.trailerPageUrl]);

  useEffect(() => {
    if (state.status !== "error") {
      return;
    }
    const redirectTimer = window.setTimeout(() => {
      window.open(trailer.trailerPageUrl, "_blank");
      close();
    }, REDIRECT_DELAY_MS);
    const toastTimer = window.setTimeout(() => {
      setShowToast(false);
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(redirectTimer);
      window.clearTimeout(toastTimer);
    };
  }, [close, state.status, trailer.trailerPageUrl]);

  return (
    <>
      <ModalCloseButton ariaLabel="关闭视频" onClick={close} />
      <div class="atv-modal-video-content">
        {state.status === "loading" ? (
          <div class="atv-modal-loading">
            <div class="atv-spinner" />
            <span>加载中...</span>
          </div>
        ) : null}
        {state.status === "loaded" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- Douban trailer embeds do not expose caption tracks.
          <video
            autoplay
            class="atv-modal-video"
            controls
            playsinline
            src={state.embedUrl}
          />
        ) : null}
        {showToast ? <div class="atv-modal-toast">视频加载失败</div> : null}
      </div>
    </>
  );
};

const VideoModal = ({ onClose, trailer }: VideoModalProps) => (
  <ModalShell
    ariaLabel={trailer.title || "视频预览"}
    className="atv-modal-overlay is-video"
    id={MODAL_ID}
    onClose={onClose}
    surfaceClassName="atv-modal-surface"
  >
    <VideoModalContent trailer={trailer} />
  </ModalShell>
);

const openVideoModal = (trailer: Trailer): void => {
  ensureVideoStyle();
  removeExistingVideoModal();

  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const host = document.createElement("div");
  document.body.append(host);

  const close = (): void => {
    render(null, host);
    host.remove();
    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  };

  render(<VideoModal onClose={close} trailer={trailer} />, host);
};

export { openVideoModal };
