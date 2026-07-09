import type { Trailer } from "../../types";
import { el } from "../dom-factory";
import { createOverlay } from "../overlay";

export const openVideoModal = (trailer: Trailer): void => {
  if (!document.querySelector("#atv-vs")) {
    const s = el("style", {
      id: "atv-vs",
      textContent:
        "@keyframes atv-spin{to{transform:rotate(360deg)}}.atv-modal-loading{display:flex;flex-direction:column;align-items:center;gap:16px;color:#fff;font-size:15px}.atv-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#41be5d;border-radius:50%;animation:atv-spin .8s linear infinite}",
    });
    document.head.append(s);
  }

  const content = el("div", { className: "atv-modal-video-content" });

  const loading = el("div", {
    className: "atv-modal-loading",
    html: '<div class="atv-spinner"></div><span>加载中...</span>',
  });
  content.append(loading);

  const { dismiss, overlay } = createOverlay({
    className: ["atv-modal-overlay", "is-video"],
    content: [content],
    id: "atv-video-modal",
  });

  const showToast = (msg: string): void => {
    const t = el("div", { className: "atv-modal-toast", text: msg });
    content.append(t);
    setTimeout(() => t.remove(), 3000);
  };

  (async () => {
    try {
      const res = await fetch(trailer.trailerPageUrl);
      if (!overlay.isConnected) {
        return;
      }
      const html = await res.text();
      const ldMatch = html.match(
        /<script type="application\/ld\+json">(?<json>[\s\S]*?)<\/script>/u
      );
      if (!ldMatch || !ldMatch.groups) {
        throw new Error("no ld+json");
      }
      const data = JSON.parse(ldMatch.groups.json);
      const embedUrl: unknown = data?.embedUrl ?? data?.video?.embedUrl ?? null;
      if (typeof embedUrl !== "string" || !embedUrl) {
        throw new Error("no embedUrl");
      }
      if (!overlay.isConnected) {
        return;
      }
      const video = el("video", {
        attrs: {
          autoplay: "true",
          controls: "true",
          playsinline: "true",
          src: embedUrl,
        },
        className: "atv-modal-video",
      });
      content.innerHTML = "";
      content.append(video);
    } catch {
      if (!overlay.isConnected) {
        return;
      }
      showToast("视频加载失败");
      setTimeout(() => {
        window.open(trailer.trailerPageUrl, "_blank");
        dismiss();
      }, 1500);
    }
  })();
};
