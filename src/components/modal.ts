import type { Trailer } from "../types";
import { el } from "./dom-factory";

const openVideoModal = (trailer: Trailer): void => {
  if (!document.querySelector("#atv-vs")) {
    const s = el("style", {
      id: "atv-vs",
      textContent:
        "@keyframes atv-spin{to{transform:rotate(360deg)}}.atv-modal-loading{display:flex;flex-direction:column;align-items:center;gap:16px;color:#fff;font-size:15px}.atv-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.2);border-top-color:#41be5d;border-radius:50%;animation:atv-spin .8s linear infinite}",
    });
    document.head.append(s);
  }

  const old = document.querySelector("#atv-video-modal");
  if (old) {
    old.remove();
  }

  const overlay = el("div", {
    className: "atv-modal-overlay is-video",
    id: "atv-video-modal",
  });

  const content = el("div", { className: "atv-modal-video-content" });

  const loading = el("div", {
    className: "atv-modal-loading",
    html: '<div class="atv-spinner"></div><span>加载中...</span>',
  });
  content.append(loading);

  const close = el("button", {
    attrs: { type: "button" },
    className: "atv-modal-close",
    html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  });

  const dismiss = (): void => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      overlay.remove();
    }, 350);
  };

  close.addEventListener("click", dismiss);

  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) {
      dismiss();
    }
  });

  const keyHandler = (e: KeyboardEvent): void => {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", keyHandler);
    }
  };
  document.addEventListener("keydown", keyHandler);

  overlay.append(content);
  overlay.append(close);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));

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

const openPosterModal = (src: string, alt: string): void => {
  const old = document.querySelector("#atv-poster-modal");
  if (old) {
    old.remove();
  }

  const overlay = el("div", {
    className: "atv-modal-overlay",
    id: "atv-poster-modal",
  });
  const img = el("img", {
    alt: alt || "",
    className: "atv-modal-img",
    src,
  });

  const close = el("button", {
    attrs: { type: "button" },
    className: "atv-modal-close",
    html: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>',
  });

  const dismiss = (): void => {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      overlay.remove();
    }, 350);
  };

  close.addEventListener("click", dismiss);

  overlay.addEventListener("click", (e: MouseEvent) => {
    if (e.target === overlay) {
      dismiss();
    }
  });

  document.addEventListener("keydown", function handler(e: KeyboardEvent) {
    if (e.key === "Escape") {
      dismiss();
      document.removeEventListener("keydown", handler);
    }
  });

  overlay.append(img);
  overlay.append(close);
  document.body.append(overlay);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => overlay.classList.add("is-open"));
};

export { openPosterModal, openVideoModal };
